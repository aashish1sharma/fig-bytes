const INSIGHT_HOURS = 7 * 24;
const INDIA_SIGNAL =
  /\b(india|indian|mumbai|delhi|bengaluru|bangalore|rbi|sebi|irdai|nifty|sensex|lic\b|hdfc|sbi\b|₹|rs\.| crore| lakh|mutual fund|banking sector)\b/i;

const ASIA_SIGNAL =
  /\b(singapore|hong kong|japan|australia|china|taiwan|korea|south korea|malaysia|thailand|indonesia|vietnam|philippines|southeast asia|mas\b|hkma|sfc\b|asic|apra|tokyo|sydney|beijing|shanghai)\b/i;

const INDIA_EXCLUDE_FOR_ASIA =
  /\b(india|indian|mumbai|delhi|bengaluru|bangalore|rbi\b|sebi\b|irdai|nifty|sensex|hdfc\b|icici\b|sbi\b|kotak|lic\b|nuvama|360 one|moneycontrol|livemint|economic times|business standard|cnbctv18|bseindia|nseindia|₹|crore|lakh)\b/i;

const NON_INDIA_SIGNAL =
  /\b(european private banking|us asset management|united states only|europe only)\b/i;
const INSIGHT_CUTOFF = () => Date.now() - INSIGHT_HOURS * 60 * 60 * 1000;

const PREMIUM_PUBLISHERS = [
  { pattern: /the-ken|the ken/i, label: "The Ken", paywalled: true },
  { pattern: /morningcontext|morning context/i, label: "The Morning Context", paywalled: true },
  { pattern: /captable|the captable/i, label: "The CapTable", paywalled: true },
  { pattern: /restofworld|rest of world/i, label: "Rest of World", paywalled: true },
];

const RESEARCH_FIRMS = [
  { pattern: /mckinsey/i, label: "McKinsey" },
  { pattern: /\bbcg\b|boston consulting/i, label: "BCG" },
  { pattern: /\bbain\b/i, label: "Bain" },
  { pattern: /deloitte/i, label: "Deloitte" },
  { pattern: /\bpwc\b|pricewaterhouse/i, label: "PwC" },
  { pattern: /\bey\b|ernst.?young/i, label: "EY" },
  { pattern: /\bkpmg\b/i, label: "KPMG" },
  { pattern: /oliver wyman/i, label: "Oliver Wyman" },
  { pattern: /crisil/i, label: "CRISIL" },
  { pattern: /india ratings/i, label: "India Ratings" },
  { pattern: /morningstar/i, label: "Morningstar" },
];

const NEWSLETTER_PUBLISHERS = [
  { pattern: /morningbrew|morning brew/i, label: "Morning Brew" },
];

export const INSIGHT_SOURCE_LIST = [
  "The Ken",
  "The Morning Context",
  "Morningstar",
  "Morning Brew",
  "McKinsey",
  "BCG",
  "Bain",
  "Deloitte",
  "PwC",
  "EY",
  "KPMG",
  "Oliver Wyman",
  "CRISIL",
];

const PREMIUM_FEEDS = [
  { url: "https://the-ken.com/feed/", source: "The Ken" },
];

const SECTOR_INSIGHTS = {
  "asset-management": {
    keywords:
      /\b(mutual fund|amc|asset management|fund house|etf|aum|passive|index fund|sip|nfo|target.?date|sebi|zerodha|icici prudential|hdfc amc|sbi mutual)\b/i,
    premiumQueries: [
      "site:the-ken.com mutual fund OR asset management OR AMC India when:7d",
      "site:themorningcontext.com mutual fund OR asset management India when:7d",
    ],
    researchQueries: [
      "site:mckinsey.com asset management OR mutual fund India when:30d",
      "site:bcg.com asset management OR mutual fund India when:30d",
      "site:bain.com asset management India when:30d",
      "site:oliverwyman.com asset management India when:30d",
      "site:morningstar.in mutual fund OR AMC India when:30d",
      "site:morningstar.com mutual fund India when:30d",
      "site:morningbrew.com asset management OR mutual fund India when:7d",
    ],
    opEdQueries: [
      "site:livemint.com opinion mutual fund OR asset management India when:7d",
      "site:economictimes.indiatimes.com opinion mutual fund India when:7d",
    ],
  },
  "wealth-management": {
    keywords:
      /\b(wealth management|private bank|private banking|family office|hnwi|pms|aum|360 one|nuvama|iifl wealth|anand rathi|kotak securities|hdfc securities|icici securities)\b/i,
    premiumQueries: [
      "site:the-ken.com wealth OR private banking OR family office India when:7d",
      "site:themorningcontext.com wealth management India when:7d",
    ],
    researchQueries: [
      "site:mckinsey.com wealth management OR private banking India when:30d",
      "site:bcg.com wealth management OR private banking India when:30d",
      "site:bain.com wealth management India when:30d",
      "site:morningstar.in wealth OR private banking India when:30d",
      "site:morningbrew.com wealth management OR private banking India when:7d",
    ],
    opEdQueries: [
      "site:livemint.com opinion wealth OR private banking India when:7d",
      "site:business-standard.com opinion wealth management India when:7d",
    ],
  },
  insurance: {
    keywords:
      /\b(insur|irdai|lic|policy|premium|underwrit|life insurance|general insurance|insurtech)\b/i,
    premiumQueries: [
      "site:the-ken.com insurance OR IRDAI India when:7d",
      "site:themorningcontext.com insurance India when:7d",
    ],
    researchQueries: [
      "site:mckinsey.com insurance India when:30d",
      "site:bcg.com insurance India when:30d",
      "site:bain.com insurance India when:30d",
      "site:morningstar.in insurance India when:30d",
      "site:morningbrew.com insurance India when:7d",
    ],
    opEdQueries: [
      "site:livemint.com opinion insurance India when:7d",
      "site:economictimes.indiatimes.com opinion insurance India when:7d",
    ],
  },
  "retail-banking": {
    keywords:
      /\b(retail bank|banking|rbi|deposit|loan|digital bank|neobank|credit card|casa|npa|hdfc bank|sbi|icici bank|axis bank|fintech)\b/i,
    premiumQueries: [
      "site:the-ken.com banking OR fintech OR RBI India when:7d",
      "site:themorningcontext.com banking OR fintech India when:7d",
    ],
    researchQueries: [
      "site:mckinsey.com retail banking OR payments India when:30d",
      "site:bcg.com retail banking OR digital banking India when:30d",
      "site:bain.com banking India when:30d",
      "site:deloitte.com banking India when:30d",
      "site:morningstar.in banking OR RBI India when:30d",
      "site:morningbrew.com banking OR fintech India when:7d",
    ],
    opEdQueries: [
      "site:livemint.com opinion banking OR RBI India when:7d",
      "site:business-standard.com opinion retail banking India when:7d",
    ],
  },
};

const ASIA_SECTOR_INSIGHTS = {
  "asset-management": {
    keywords:
      /\b(asset management|amc|mutual fund|fund house|etf|aum|passive|index fund|unit trust|superannuation|reit)\b/i,
    premiumQueries: [
      "site:ft.com asset management OR mutual fund (Singapore OR Hong Kong OR Japan OR Australia) -India when:7d",
      "site:scmp.com asset management OR fund manager when:7d",
    ],
    researchQueries: [
      "site:mckinsey.com asset management Asia Pacific -India when:30d",
      "site:bcg.com asset management OR wealth Asia Pacific when:30d",
      "site:bain.com asset management Asia when:30d",
      "site:oliverwyman.com asset management Asia Pacific when:30d",
      "site:morningstar.com asset management Singapore OR Hong Kong OR Japan when:30d",
    ],
    opEdQueries: [
      "site:ft.com opinion asset management Asia Pacific -India when:7d",
      "site:scmp.com opinion fund management OR asset management when:7d",
    ],
  },
  "wealth-management": {
    keywords:
      /\b(wealth management|private bank|private banking|family office|hnwi|uhni|pms|aum|private client)\b/i,
    premiumQueries: [
      "site:ft.com wealth management OR private banking (Singapore OR Hong Kong) -India when:7d",
      "site:scmp.com wealth management OR private banking when:7d",
    ],
    researchQueries: [
      "site:mckinsey.com wealth management OR private banking Asia Pacific when:30d",
      "site:bcg.com wealth management Asia when:30d",
      "site:bain.com private banking Asia when:30d",
      "site:morningstar.com wealth management Singapore OR Hong Kong when:30d",
    ],
    opEdQueries: [
      "site:ft.com opinion wealth OR private banking Asia -India when:7d",
      "site:scmp.com opinion wealth management when:7d",
    ],
  },
  insurance: {
    keywords:
      /\b(insur|life insurance|general insurance|policy|premium|underwrit|insurtech|health insurance)\b/i,
    premiumQueries: [
      "site:ft.com insurance (Singapore OR Japan OR Australia OR Hong Kong) -India when:7d",
      "site:scmp.com insurance when:7d",
    ],
    researchQueries: [
      "site:mckinsey.com insurance Asia Pacific when:30d",
      "site:bcg.com insurance Asia when:30d",
      "site:bain.com insurance Asia Pacific when:30d",
      "site:morningstar.com insurance Singapore OR Japan OR Australia when:30d",
    ],
    opEdQueries: [
      "site:ft.com opinion insurance Asia -India when:7d",
      "site:scmp.com opinion insurance when:7d",
    ],
  },
  "retail-banking": {
    keywords:
      /\b(retail bank|consumer bank|digital bank|neobank|deposit|loan|credit card|casa|payments|branch network|mobile banking)\b/i,
    premiumQueries: [
      "site:ft.com banking OR fintech (Singapore OR Hong Kong OR Japan OR Australia) -India when:7d",
      "site:scmp.com retail banking OR digital banking when:7d",
    ],
    researchQueries: [
      "site:mckinsey.com retail banking OR payments Asia Pacific when:30d",
      "site:bcg.com digital banking Asia when:30d",
      "site:bain.com banking Asia Pacific when:30d",
      "site:deloitte.com banking Asia Pacific when:30d",
      "site:morningstar.com banking Singapore OR Australia when:30d",
    ],
    opEdQueries: [
      "site:ft.com opinion banking Asia -India when:7d",
      "site:scmp.com opinion banking OR fintech when:7d",
    ],
  },
};

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripHtml(html) {
  const decoded = decodeEntities(html);
  return decoded
    .replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function summarize(text, max = 140) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function cleanTeaser(text) {
  if (!text) return null;
  const plain = stripHtml(text);
  if (plain.length < 40) return null;
  if (/appeared first on|read more at|the post .* appeared first/i.test(plain)) return null;
  if (/^https?:\/\//i.test(plain)) return null;
  if (/<|href=/i.test(plain)) return null;
  return summarize(plain, 140);
}

function classifyInsight(item, sourceLabel) {
  const haystack = `${item.title} ${item.link} ${sourceLabel}`.toLowerCase();
  if (PREMIUM_PUBLISHERS.some((p) => p.label === sourceLabel)) return "Premium";
  if (/\/opinion\/|\/op-ed\/|\/views\/|\/editorial\/|\/commentary\//i.test(item.link)) return "Op-ed";
  if (RESEARCH_FIRMS.some((f) => f.label === sourceLabel)) return "Research";
  if (NEWSLETTER_PUBLISHERS.some((p) => p.label === sourceLabel)) return "Research";
  if (/\b(opinion|op-ed|op ed|column|editorial|commentary)\b/i.test(haystack)) return "Op-ed";
  if (/\b(report|insight|publication|survey|outlook|analysis)\b/i.test(haystack)) return "Research";
  return "Research";
}

function resolveInsightSource(item, defaultSource = "") {
  const haystack = `${item.title} ${item.link} ${item.source} ${defaultSource}`;
  for (const pub of PREMIUM_PUBLISHERS) {
    if (pub.pattern.test(haystack)) return pub.label;
  }
  for (const firm of RESEARCH_FIRMS) {
    if (firm.pattern.test(haystack)) return firm.label;
  }
  for (const pub of NEWSLETTER_PUBLISHERS) {
    if (pub.pattern.test(haystack)) return pub.label;
  }
  if (/livemint|mint/i.test(haystack)) return "Livemint";
  if (/economictimes|economic times/i.test(haystack)) return "Economic Times";
  if (/business.?standard/i.test(haystack)) return "Business Standard";
  return item.source || defaultSource || "Research";
}

function isPaywalled(sourceLabel) {
  return PREMIUM_PUBLISHERS.some((p) => p.label === sourceLabel && p.paywalled);
}

function parseRssItems(xml, defaultSource = "") {
  const items = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  for (const block of blocks) {
    const title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim();
    const link =
      block.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/)?.[1]?.trim() ??
      block.match(/<guid>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/guid>/)?.[1]?.trim();
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim();
    const description =
      block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1]?.trim() ?? "";
    const source =
      block.match(/<source[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/source>/)?.[1]?.trim() ?? defaultSource;
    if (!title || !link) continue;
    items.push({
      title: decodeEntities(title.replace(/<[^>]+>/g, "")),
      link: decodeEntities(link),
      pubDate: pubDate ? new Date(pubDate) : null,
      source: decodeEntities(source),
      teaser: cleanTeaser(description),
    });
  }
  return items;
}

async function fetchUrl(url) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": "sector-daily-dashboard/1.0",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
  });
  if (!res.ok) throw new Error(`Fetch failed (${res.status}): ${url}`);
  return res.text();
}

async function fetchGoogleNews(query, region) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${region.hl}&gl=${region.gl}&ceid=${region.ceid}`;
  return parseRssItems(await fetchUrl(url));
}

function passesInsightFilter(item, config, sourceLabel, regionId = "india") {
  const haystack = `${item.title} ${item.link} ${sourceLabel}`;
  if (/\b(job|career|hiring|consultant job|openings|vacancy|apply now|join our team)\b/i.test(haystack)) {
    return false;
  }
  if (/\b(research tools|fund overview|new fund offerings|login|subscribe now|ETF.*summary|assets and holdings)\b/i.test(haystack)) {
    return false;
  }
  if (regionId === "asia" && INDIA_EXCLUDE_FOR_ASIA.test(haystack)) return false;
  if (regionId === "india" && NON_INDIA_SIGNAL.test(haystack)) return false;
  if (!config.keywords.test(haystack)) return false;
  const regionSignal = regionId === "asia" ? ASIA_SIGNAL : INDIA_SIGNAL;
  if (!regionSignal.test(haystack) && !PREMIUM_PUBLISHERS.some((p) => p.label === sourceLabel)) {
    return false;
  }
  return true;
}

function scoreInsight(item, config, sourceLabel, regionId = "india") {
  const haystack = `${item.title} ${item.link} ${sourceLabel}`;
  const tag = classifyInsight(item, sourceLabel);
  let rank = tag === "Premium" ? 0 : tag === "Research" ? 1 : 2;
  if (config.keywords.test(haystack)) rank -= 2;
  if (RESEARCH_FIRMS.some((f) => f.label === sourceLabel)) rank -= 1;
  if (NEWSLETTER_PUBLISHERS.some((p) => p.label === sourceLabel)) rank -= 1;
  const regionSignal = regionId === "asia" ? ASIA_SIGNAL : INDIA_SIGNAL;
  if (regionSignal.test(haystack)) rank -= 2;
  if (regionId === "asia" && INDIA_EXCLUDE_FOR_ASIA.test(haystack)) rank += 10;
  if (regionId === "india" && NON_INDIA_SIGNAL.test(haystack)) rank += 5;
  if (/news\.google\.com/i.test(item.link)) rank += 1;
  return { ...item, source: sourceLabel, tag, rank, paywalled: isPaywalled(sourceLabel) };
}

function toInsightBullet(item) {
  const teaser =
    item.teaser && !/news\.google\.com/i.test(item.link) ? cleanTeaser(item.teaser) : null;
  return {
    tag: item.tag,
    headline: summarize(item.title),
    teaser: teaser || null,
    source: item.source,
    url: item.link,
    published: item.pubDate?.toISOString() ?? null,
    paywalled: item.paywalled ?? false,
  };
}

async function collectInsightQueries(queries, config, region, cutoffMs, regionId) {
  const all = [];
  for (const query of queries) {
    try {
      for (const item of await fetchGoogleNews(query, region)) {
        if (!item.pubDate || item.pubDate.getTime() < cutoffMs) continue;
        const sourceLabel = resolveInsightSource(item);
        if (!passesInsightFilter(item, config, sourceLabel, regionId)) continue;
        all.push(scoreInsight(item, config, sourceLabel, regionId));
      }
    } catch (err) {
      console.warn(`  insight warn: ${query} — ${err.message}`);
    }
  }
  return all;
}

async function collectPremiumFeeds(config, cutoffMs, regionId) {
  const all = [];
  for (const feed of PREMIUM_FEEDS) {
    try {
      for (const item of parseRssItems(await fetchUrl(feed.url), feed.source)) {
        if (!item.pubDate || item.pubDate.getTime() < cutoffMs) continue;
        if (!passesInsightFilter(item, config, feed.source, regionId)) continue;
        all.push(scoreInsight(item, config, feed.source, regionId));
      }
    } catch (err) {
      console.warn(`  insight warn: ${feed.url} — ${err.message}`);
    }
  }
  return all;
}

export async function buildSectorInsight(sectorId, regionConfig, regionId = regionConfig.id) {
  const config = regionId === "asia" ? ASIA_SECTOR_INSIGHTS[sectorId] : SECTOR_INSIGHTS[sectorId];
  if (!config) return null;

  const cutoffMs = INSIGHT_CUTOFF();
  let all = [];
  if (regionId === "india") {
    all = await collectPremiumFeeds(config, cutoffMs, regionId);
  }
  all = all.concat(await collectInsightQueries(config.premiumQueries, config, regionConfig, cutoffMs, regionId));
  all = all.concat(await collectInsightQueries(config.researchQueries, config, regionConfig, cutoffMs, regionId));
  all = all.concat(await collectInsightQueries(config.opEdQueries, config, regionConfig, cutoffMs, regionId));

  all.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return (b.pubDate?.getTime() ?? 0) - (a.pubDate?.getTime() ?? 0);
  });

  const best = all[0];
  return best ? toInsightBullet(best) : null;
}
