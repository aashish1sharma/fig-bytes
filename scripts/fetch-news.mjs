import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSectorInsight } from "./insights.mjs";
import { buildSectorCompanyUpdates } from "./company-ir.mjs";
import { getRegionConfig, dashboardPath, REGIONS } from "./regions.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
export const OUT = dashboardPath(ROOT, "india");

const HOURS_24 = 24 * 60 * 60 * 1000;

const LOW_SIGNAL =
  /\b(top \d+|best \d+|how to|what'?s the trick|mistake that costs|returns comparison|delivers \d+(\.\d+)?%|cagr returns?|in focus after|share price in focus|share price today|stock to (?:buy|watch)|price to earnings forward|owned by \d+ mutual|evergreen|week ahead|things to know|cautions investors|is becoming the next|assets and holdings|ratings - FT|NMQ:|LSE:EUR|UCITS ETF.*summary|viral video|partying contradicts|demerger tax|share sale plans|stake sale)\b/i;

const TAG_RULES = [
  {
    tag: "Leadership",
    patterns: [
      /\b(ceo|cfo|president|chairman|chief|appointed|named|steps down|resigns|succession|executive|md\b|managing director)\b/i,
    ],
  },
  {
    tag: "Strategy",
    patterns: [
      /\b(strategy|restructur|pivot|margin|cost.?cut|expansion|acquisition|merger|consolidat|partnership|fee.?based|inflows?|outflows?|milestone|crosses?|surpass|branch network|digital transformation)\b/i,
    ],
  },
  {
    tag: "Product",
    patterns: [
      /\b(launch(es|ed|ing)?|introduc(es|ed|ing)?|new product|new fund|new program|etf|fund|platform|insurtech|policy|coverage|savings plan|neobank|app|nfo|target.?date|life cycle fund|file draft|scheme launch|wealth platform|credit card|digital banking|loan product|private client|wealth centre|wealth center)\b/i,
    ],
  },
  {
    tag: "Regulatory",
    patterns: [
      /\b(regulat|approv(al|ed)|investigation|examination|fine|penalty|compliance|rbi|sebi|irdai|irda|pfrda|commissioner|license|circular|guideline)\b/i,
    ],
  },
  {
    tag: "Earnings",
    patterns: [
      /\b(earnings|quarterly|q[1-4]|results|revenue|eps|profit|aum|assets under management|net profit|pat\b)\b/i,
    ],
  },
  {
    tag: "Press",
    patterns: [/./],
  },
];

function classify(text) {
  for (const rule of TAG_RULES) {
    if (rule.tag === "Press") continue;
    if (rule.patterns.some((p) => p.test(text))) return rule.tag;
  }
  return "Press";
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function summarize(title) {
  return title.length > 140 ? `${title.slice(0, 137)}…` : title;
}

function resolveSource(item, preferredSources) {
  const haystack = `${item.title} ${item.link} ${item.source}`;
  for (const pref of preferredSources) {
    if (pref.pattern.test(haystack)) return pref.label;
  }
  return item.source || "News";
}

function sourceBoost(sourceLabel, preferredSources) {
  const pref = preferredSources.find((p) => p.label === sourceLabel);
  return pref?.boost ?? 0;
}

function parseRss(xml, defaultSource = "") {
  const items = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  for (const block of blocks) {
    const title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim();
    const link =
      block.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/)?.[1]?.trim() ??
      block.match(/<guid>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/guid>/)?.[1]?.trim();
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim();
    const source =
      block.match(/<source[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/source>/)?.[1]?.trim() ?? defaultSource;
    if (!title || !link) continue;
    items.push({
      title: decodeEntities(title.replace(/<[^>]+>/g, "")),
      link: decodeEntities(link),
      pubDate: pubDate ? new Date(pubDate) : null,
      source: decodeEntities(source),
    });
  }
  return items;
}

async function fetchUrl(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "sector-daily-dashboard/1.0",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
  });
  if (!res.ok) throw new Error(`Fetch failed (${res.status}): ${url}`);
  return res.text();
}

async function fetchQuery(query, region) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${region.hl}&gl=${region.gl}&ceid=${region.ceid}`;
  return parseRss(await fetchUrl(url));
}

async function fetchFeed(feed) {
  return parseRss(await fetchUrl(feed.url), feed.source);
}

function passesSectorFilter(item, sector, preferredSources, regionConfig = null) {
  const sourceLabel = resolveSource(item, preferredSources);
  const haystack = `${item.title} ${item.link} ${sourceLabel}`;
  if (LOW_SIGNAL.test(haystack)) return false;
  if (regionConfig?.excludeIndia?.test(haystack)) return false;
  if (sector.exclude?.test(haystack)) return false;
  if (sector.requireStrong && !sector.requireStrong.test(haystack)) return false;
  if (sector.requireLocal && !sector.requireLocal.test(haystack)) return false;
  if (sector.keywords && !sector.keywords.test(haystack)) return false;
  return true;
}

function scoreItem(item, sector, preferredSources) {
  const sourceLabel = resolveSource(item, preferredSources);
  const haystack = `${item.title} ${item.link}`;
  const text = `${item.title} ${sourceLabel}`;
  const tag = classify(text);
  const priority = ["Regulatory", "Leadership", "Strategy", "Product", "Earnings", "Press"];
  let rank = priority.indexOf(tag) + sourceBoost(sourceLabel, preferredSources);

  if (sector.keywords && !sector.keywords.test(haystack)) {
    rank += 3;
  }
  if (sector.highSignal?.test(haystack)) {
    rank -= 3;
  }
  if (LOW_SIGNAL.test(haystack)) {
    rank += 5;
  }

  return { ...item, source: sourceLabel, tag, rank };
}

const TITLE_STOP_WORDS = new Set([
  "about", "after", "also", "amid", "and", "are", "becomes", "become", "been", "being",
  "from", "gets", "grants", "granted", "have", "here", "how", "inside", "into", "its",
  "just", "more", "most", "new", "news", "now", "over", "says", "said", "that", "the",
  "their", "they", "this", "today", "under", "what", "when", "where", "which", "while",
  "with", "will", "your", "india", "indian", "indias", "final", "becomes", "explained",
]);

const SOURCE_SUFFIX =
  /\s*[-–|]\s*(?:the\s+)?(?:economic\s+times|business\s+standard|financial\s+express|fortune\s+india|india\s+infoline|goodreturns|newsbytes|the\s+statesman|business\s+line|asia\s+insurance\s+post|bizzbuzz|et\s*legalworld(?:\.com)?|moneycontrol(?:\.com)?|livemint(?:\.com)?|cnbc\s*tv-?18|reuters|bloomberg|mint|ndtv|zee\s+business|tradingview|whalesbook|quartr)(?:\s+.*)?$/i;

function cleanTitle(title) {
  return title
    .replace(SOURCE_SUFFIX, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/₹/g, "rs ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleTokens(title) {
  return cleanTitle(title)
    .split(" ")
    .map((tok) => tok.replace(/^rs$/, "").trim())
    .filter((tok) => tok.length > 2 && !TITLE_STOP_WORDS.has(tok) && !/^\d+$/.test(tok));
}

function jaccardSimilarity(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  if (!setA.size || !setB.size) return 0;
  let intersection = 0;
  for (const tok of setA) {
    if (setB.has(tok)) intersection += 1;
  }
  return intersection / (setA.size + setB.size - intersection);
}

function storySignatures(title) {
  const t = cleanTitle(title);
  const sigs = [];

  const combos = [
    [/prudential/, /hcl/, "prudential-hcl-licence"],
    [/irdai/, /dark patterns?/, "irdai-dark-patterns"],
    [/irdai/, /bima sugam/, "irdai-bima-sugam"],
    [/irdai/, /mis.?selling|seller tagging|policy linked/, "irdai-mis-selling"],
    [/irdai/, /distribution reform/, "irdai-distribution-reform"],
    [/irdai/, /listings?/, "irdai-listings"],
    [/rbi/, /ombudsman/, "rbi-ombudsman"],
    [/rbi/, /deposit mobil/, "rbi-deposits"],
    [/rbi/, /financial stability report|fsr\b/, "rbi-fsr"],
    [/alphagrep/, /.{0,40}/, "alphagrep-launch"],
    [/jioblackrock|jio blackrock/, /sif|nfo/, "jioblackrock-sif"],
    [/invesco/, /sif|nfo/, "invesco-sif"],
    [/edelweiss/, /aum|milestone|crore|trn|assets under management/, "edelweiss-aum"],
    [/sebi/, /manipulat/, "sebi-manipulation"],
    [/kotak/, /deutsche/, "kotak-deutsche"],
    [/fcnr|fcnra|nre deposit|nri deposit/, /.{0,40}/, "nri-deposit"],
    [/forex reserve|fx reserve/, /.{0,40}/, "forex-reserves"],
    [/nuvama/, /.{0,40}/, "nuvama"],
    [/360 one|360one/, /.{0,40}/, "360-one"],
    [/iifl wealth/, /.{0,40}/, "iifl-wealth"],
    [/performance.?linked/, /mutual fund|ter/, "sebi-performance-fee"],
    [/capital market/, /norms?|rbi/, "rbi-capital-markets"],
    [/corporate debt/, /rbi/, "rbi-corporate-debt"],
  ];

  for (const [left, right, key] of combos) {
    if (left.test(t) && right.test(t)) sigs.push(key);
  }

  const tokens = [...new Set(titleTokens(title))].sort();
  if (tokens.length >= 4) {
    sigs.push(`tok:${tokens.slice(0, 5).join("|")}`);
  }

  return sigs;
}

function topicKeys(title) {
  const t = cleanTitle(title);
  const keys = [];
  if (/fcnr|fcnra|nre deposit|nri deposit/.test(t)) keys.push("nri-deposit");
  if (/forex reserve|fx reserve/.test(t)) keys.push("forex");
  if (/nuvama/.test(t)) keys.push("nuvama");
  if (/wealth management market|market growth/.test(t)) keys.push("wm-survey");
  if (/digital bank|neobank|upi|credit card launch|savings account/.test(t)) keys.push("rb-product");
  if (/home loan|personal loan|retail lending/.test(t)) keys.push("rb-lending");
  if (/merger|acquisition/.test(t)) keys.push("rb-ma");
  if (/360 one|iifl wealth|anand rathi|family office|private bank/.test(t)) keys.push("wm-player");
  return keys;
}

function isSameStory(a, b) {
  const titleA = cleanTitle(a.title);
  const titleB = cleanTitle(b.title);
  if (!titleA || !titleB) return false;
  if (titleA === titleB) return true;

  const tokensA = titleTokens(a.title);
  const tokensB = titleTokens(b.title);
  const similarity = jaccardSimilarity(tokensA, tokensB);
  if (similarity >= 0.45) return true;

  const shared = tokensA.filter((tok) => tokensB.includes(tok));
  const regulators = new Set(["irdai", "rbi", "sebi", "pfrda", "lic"]);
  if (
    similarity >= 0.32 &&
    shared.length >= 3 &&
    shared.some((tok) => regulators.has(tok))
  ) {
    return true;
  }

  const sigA = storySignatures(a.title);
  const sigB = storySignatures(b.title);
  const specificA = sigA.filter((s) => !s.startsWith("tok:"));
  const specificB = sigB.filter((s) => !s.startsWith("tok:"));
  if (specificA.some((sig) => specificB.includes(sig))) return true;

  const topicsA = topicKeys(a.title);
  const topicsB = topicKeys(b.title);
  if (topicsA.length && topicsB.some((topic) => topicsA.includes(topic))) return true;

  return false;
}

function pickTopN(items, n = 3) {
  const sorted = [...items].sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return (b.pubDate?.getTime() ?? 0) - (a.pubDate?.getTime() ?? 0);
  });

  const unique = [];
  for (const item of sorted) {
    if (unique.some((kept) => isSameStory(item, kept))) continue;
    unique.push(item);
  }

  return unique.slice(0, n).map((item) => ({
    tag: item.tag,
    headline: summarize(item.title),
    source: item.source,
    url: item.link,
    published: item.pubDate?.toISOString() ?? null,
  }));
}

function pickTop3(items) {
  return pickTopN(items, 3);
}

async function collectFromQueries(queries, cutoff, sector, region, preferredSources, { extendedHours = null } = {}) {
  const effectiveCutoff = extendedHours
    ? Date.now() - extendedHours * 60 * 60 * 1000
    : cutoff;
  const all = [];
  for (const query of queries) {
    try {
      for (const item of await fetchQuery(query, region)) {
        if (item.pubDate && item.pubDate.getTime() >= effectiveCutoff && passesSectorFilter(item, sector, preferredSources, region)) {
          all.push(scoreItem(item, sector, preferredSources));
        }
      }
    } catch (err) {
      console.warn(`  warn: ${query} — ${err.message}`);
    }
  }
  return all;
}

async function collectFromFeeds(feeds, cutoff, sector, preferredSources, regionConfig) {
  const all = [];
  for (const feed of feeds) {
    try {
      for (const item of await fetchFeed(feed)) {
        if (item.pubDate && item.pubDate.getTime() >= cutoff && passesSectorFilter(item, sector, preferredSources, regionConfig)) {
          all.push(scoreItem({ ...item, source: feed.source }, sector, preferredSources));
        }
      }
    } catch (err) {
      console.warn(`  warn: ${feed.url} — ${err.message}`);
    }
  }
  return all;
}

async function buildSector(sector, regionConfig) {
  const cutoff = Date.now() - HOURS_24;
  const { preferredSources, insightRegionId } = regionConfig;
  const region = regionConfig;
  let all = await collectFromFeeds(sector.feeds ?? [], cutoff, sector, preferredSources, regionConfig);
  all = all.concat(await collectFromQueries(sector.queries, cutoff, sector, region, preferredSources));

  if (pickTop3(all).length < 3 && sector.fallback) {
    all = all.concat(await collectFromQueries([sector.fallback], cutoff, sector, region, preferredSources));
  }

  if (pickTop3(all).length < 3 && sector.gapFill) {
    all = all.concat(
      await collectFromQueries(sector.gapFill, cutoff, sector, region, preferredSources, { extendedHours: 72 }),
    );
  }

  return {
    id: sector.id,
    name: sector.name,
    bullets: pickTopN(all, 3),
    candidates: pickTopN(all, 8),
    insight: await buildSectorInsight(sector.id, regionConfig, insightRegionId),
    companyUpdates: await buildSectorCompanyUpdates(sector.id, regionConfig),
  };
}

export async function fetchDashboard(regionId = "india") {
  const regionConfig = getRegionConfig(regionId);
  const generatedAt = new Date().toISOString();
  const sectors = [];

  for (const sector of regionConfig.sectors) {
    console.log(`  ${sector.name}`);
    sectors.push(await buildSector(sector, regionConfig));
  }

  return {
    generatedAt,
    region: regionConfig.label,
    title: regionConfig.title,
    regionId: regionConfig.id,
    timezone: regionConfig.timezone,
    windowHours: 24,
    sources: regionConfig.sourceList,
    sectors,
  };
}

export function writeDashboard(payload, regionId = "india") {
  const out = dashboardPath(ROOT, regionId);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(payload, null, 2));
  if (regionId === "india") {
    writeFileSync(join(ROOT, "public", "dashboard.json"), JSON.stringify(payload, null, 2));
  }
  return out;
}

async function main() {
  for (const regionId of Object.keys(REGIONS)) {
    const config = getRegionConfig(regionId);
    console.log(`Fetching ${config.title} (last 24h)…`);
    const payload = await fetchDashboard(regionId);
    const out = writeDashboard(payload, regionId);
    console.log(`Wrote ${out}\n`);
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
