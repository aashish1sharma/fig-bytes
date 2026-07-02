const IR_WINDOW_DAYS = 30;
const IR_CUTOFF = () => Date.now() - IR_WINDOW_DAYS * 24 * 60 * 60 * 1000;
const CONCURRENCY = 5;

const SECTOR_COMPANIES_INDIA = {
  "asset-management": [
    { name: "HDFC AMC", ticker: "HDFCAMC", domain: "hdfcfund.com" },
    { name: "Nippon India AMC", ticker: "NAM-INDIA", domain: "nipponindiaim.com" },
    { name: "UTI AMC", ticker: "UTIAMC", domain: "utimf.com" },
    { name: "Aditya Birla Sun Life AMC", ticker: "ABSLAMC", domain: "adityabirlacapital.com" },
    { name: "ICICI Prudential AMC", ticker: "ICICIPRAMC", domain: "icicipruamc.com" },
    { name: "SBI Mutual Fund", ticker: "SBIMF", domain: "sbimf.com" },
    { name: "Mirae Asset AMC", ticker: "MIRAEF", domain: "miraeassetmf.co.in" },
    { name: "Kotak Mahindra AMC", ticker: "KOTAKMF", domain: "assetmanagement.kotak.com" },
    { name: "Axis AMC", ticker: "AXISAMC", domain: "axismf.com" },
    { name: "DSP AMC", ticker: "DSPMF", domain: "dspim.com" },
  ],
  "wealth-management": [
    { name: "360 ONE WAM", ticker: "360ONE", domain: "360.one" },
    { name: "Nuvama Wealth", ticker: "NUVAMA", domain: "nuvama.com" },
    { name: "Anand Rathi Wealth", ticker: "ANANDRATHI", domain: "anandrathiwealth.com" },
    { name: "Motilal Oswal", ticker: "MOTILALOFS", domain: "motilaloswal.com" },
    { name: "JM Financial", ticker: "JMFINANCL", domain: "jmfl.com" },
    { name: "Angel One", ticker: "ANGELONE", domain: "angelone.in" },
    { name: "ICICI Securities", ticker: "ISEC", domain: "icicisecurities.com" },
    { name: "HDFC Securities", ticker: "HDFCSEC", domain: "hdfcsec.com" },
    { name: "Kotak Securities", ticker: "KOTAKSEC", domain: "kotaksecurities.com" },
    { name: "IIFL Securities", ticker: "IIFLSEC", domain: "iifl.com" },
  ],
  insurance: [
    { name: "LIC", ticker: "LICI", domain: "licindia.in" },
    { name: "HDFC Life", ticker: "HDFCLIFE", domain: "hdfclife.com" },
    { name: "SBI Life", ticker: "SBILIFE", domain: "sbilife.co.in" },
    { name: "ICICI Prudential Life", ticker: "ICICIPRULI", domain: "iciciprulife.com" },
    { name: "ICICI Lombard", ticker: "ICICIGI", domain: "icicilombard.com" },
    { name: "General Insurance Corp", ticker: "GICRE", domain: "gicofindia.com" },
    { name: "New India Assurance", ticker: "NIACL", domain: "newindia.co.in" },
    { name: "Max Financial", ticker: "MFSL", domain: "maxfinancialservices.com" },
    { name: "Star Health", ticker: "STARHEALTH", domain: "starhealth.in" },
    { name: "Bajaj Allianz Life", ticker: "BAJAJFINSV", domain: "bajajallianzlife.com" },
  ],
  "retail-banking": [
    { name: "HDFC Bank", ticker: "HDFCBANK", domain: "hdfcbank.com" },
    { name: "ICICI Bank", ticker: "ICICIBANK", domain: "icicibank.com" },
    { name: "State Bank of India", ticker: "SBIN", domain: "sbi.co.in" },
    { name: "Axis Bank", ticker: "AXISBANK", domain: "axisbank.com" },
    { name: "Kotak Mahindra Bank", ticker: "KOTAKBANK", domain: "kotak.com" },
    { name: "IndusInd Bank", ticker: "INDUSINDBK", domain: "indusind.com" },
    { name: "IDFC First Bank", ticker: "IDFCFIRSTB", domain: "idfcfirstbank.com" },
    { name: "Federal Bank", ticker: "FEDERALBNK", domain: "federalbank.co.in" },
    { name: "Bandhan Bank", ticker: "BANDHANBNK", domain: "bandhanbank.com" },
    { name: "Yes Bank", ticker: "YESBANK", domain: "yesbank.in" },
  ],
};

const SECTOR_COMPANIES_ASIA = {
  "asset-management": [
    { name: "Value Partners", ticker: "0806.HK", domain: "valuepartners-group.com" },
    { name: "Premia Partners", ticker: "PREMIA", domain: "premia-partners.com" },
    { name: "Nikko Asset Management", ticker: "NOMURA", domain: "nikkoam.com" },
    { name: "Schroders", ticker: "SDR", domain: "schroders.com" },
    { name: "BlackRock", ticker: "BLK", domain: "blackrock.com" },
    { name: "Fidelity International", ticker: "FIL", domain: "fidelityinternational.com" },
  ],
  "wealth-management": [
    { name: "iFAST Corporation", ticker: "AIY.SI", domain: "ifastcorp.com" },
    { name: "Netwealth Group", ticker: "NWL.AX", domain: "netwealth.com.au" },
    { name: "UBS Group", ticker: "UBS", domain: "ubs.com" },
    { name: "HSBC", ticker: "HSBC", domain: "hsbc.com" },
    { name: "DBS Group", ticker: "D05.SI", domain: "dbs.com" },
    { name: "OCBC Bank", ticker: "O39.SI", domain: "ocbc.com" },
  ],
  insurance: [
    { name: "AIA Group", ticker: "AIA", domain: "aia.com" },
    { name: "Prudential plc", ticker: "PRU", domain: "prudentialplc.com" },
    { name: "Great Eastern", ticker: "GEL", domain: "greateasternlife.com" },
    { name: "MSIG Insurance", ticker: "MSIG", domain: "msig.com.sg" },
    { name: "QBE Insurance", ticker: "QBE.AX", domain: "qbe.com" },
    { name: "Tokio Marine", ticker: "8766.T", domain: "tokiomarinehd.com" },
  ],
  "retail-banking": [
    { name: "DBS Group", ticker: "D05.SI", domain: "dbs.com" },
    { name: "OCBC Bank", ticker: "O39.SI", domain: "ocbc.com" },
    { name: "UOB", ticker: "U11.SI", domain: "uobgroup.com" },
    { name: "HSBC", ticker: "HSBC", domain: "hsbc.com" },
    { name: "Standard Chartered", ticker: "STAN", domain: "sc.com" },
    { name: "Maybank", ticker: "MAYBANK", domain: "maybank.com" },
    { name: "Commonwealth Bank", ticker: "CBA.AX", domain: "commbank.com.au" },
    { name: "ANZ Bank", ticker: "ANZ.AX", domain: "anz.com" },
  ],
};

const SECTOR_COMPANIES_BY_REGION = {
  india: SECTOR_COMPANIES_INDIA,
  asia: SECTOR_COMPANIES_ASIA,
};

const NEWS_MEDIA_DOMAINS =
  /\b(forbes\.com|economictimes|moneycontrol|livemint|business-standard|cnbc|bloomberg\.com\/news|reuters\.com\/article|thehindu|indiatoday|financialexpress|zeebiz|goodreturns|whalesbook|tradingview|quartr)\b/i;

const BROKERAGE_DOMAINS = new Set([
  "angelone.in",
  "icicisecurities.com",
  "hdfcsec.com",
  "kotaksecurities.com",
  "iifl.com",
]);

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function summarize(title, max = 120) {
  return title.length > max ? `${title.slice(0, max - 1)}…` : title;
}

function classifyIrType(title, link) {
  const haystack = `${title} ${link}`.toLowerCase();

  if (
    /\b(transcript|earnings call transcript|concall transcript|conference call transcript|call transcript)\b/i.test(haystack) ||
    /\/transcript|transcript\.|earnings-call-transcript/i.test(link)
  ) {
    return "Transcript";
  }

  if (
    /\b(investor presentation|earnings presentation|investor deck|earnings deck|investor day|analyst meet|presentation slides)\b/i.test(haystack) ||
    /investor.?presentation|earnings.?presentation|\/presentations?\//i.test(link)
  ) {
    return "Presentation";
  }

  if (
    /\b(analyst report|equity research|research report|initiates coverage|reiterates|maintains (?:buy|hold|sell)|rating and target|brokerage report)\b/i.test(haystack) ||
    /\/research\/|equity-research|analyst-report/i.test(link)
  ) {
    return "Analyst Report";
  }

  return null;
}

function parseRssItems(xml) {
  const items = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  for (const block of blocks) {
    const title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim();
    const link =
      block.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/)?.[1]?.trim() ??
      block.match(/<guid>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/guid>/)?.[1]?.trim();
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim();
    if (!title || !link) continue;
    items.push({
      title: decodeEntities(title.replace(/<[^>]+>/g, "")),
      link: decodeEntities(link),
      pubDate: pubDate ? new Date(pubDate) : null,
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
  if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
  return res.text();
}

async function fetchGoogleNews(query, region) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${region.hl}&gl=${region.gl}&ceid=${region.ceid}`;
  return parseRssItems(await fetchUrl(url));
}

function buildCompanyQueries(company) {
  const base =
    '("investor presentation" OR "earnings presentation" OR transcript OR "earnings call transcript" OR "concall transcript" OR "analyst report" OR "equity research")';
  const queries = [`("${company.name}" OR ${company.ticker}) ${base} when:${IR_WINDOW_DAYS}d`];
  if (company.domain) {
    queries.push(
      `site:${company.domain} (presentation OR transcript OR "earnings call" OR "investor presentation") when:${IR_WINDOW_DAYS}d`,
    );
  }
  return queries;
}

function referencesCompany(title, company) {
  const titleLower = title.toLowerCase();
  const nameParts = company.name.toLowerCase().split(/\s+/).filter((p) => p.length > 2);
  return (
    nameParts.some((p) => titleLower.includes(p)) ||
    titleLower.includes(company.ticker.toLowerCase())
  );
}

function isRelevantIrItem(item, company) {
  const title = item.title;
  const link = item.link.toLowerCase();
  const irType = classifyIrType(title, link);

  if (!irType) return false;
  if (NEWS_MEDIA_DOMAINS.test(link) && !/transcript|presentation|research/i.test(link)) return false;
  if (/\bshare price in focus\b/i.test(title)) return false;

  if (company.domain && BROKERAGE_DOMAINS.has(company.domain.toLowerCase())) {
    if (!referencesCompany(title, company)) return false;
  }

  if (company.domain && link.includes(company.domain.toLowerCase())) {
    if (/investor|\/ir\/|financial.results|annual.report|presentations?\//i.test(link)) {
      return irType !== null || /\b(presentation|transcript|concall|earnings call)\b/i.test(title);
    }
    return irType !== null && referencesCompany(title, company);
  }

  if (link.includes("bseindia.com") || link.includes("nseindia.com") || link.includes("sgx.com")) {
    return irType !== null && referencesCompany(title, company);
  }

  if (!referencesCompany(title, company)) return false;
  return irType !== null;
}

function scoreIrItem(item, company) {
  const tag = classifyIrType(item.title, item.link);
  const tagRank = { Transcript: 0, Presentation: 1, "Analyst Report": 2 }[tag] ?? 3;
  let rank = tagRank;
  const link = item.link.toLowerCase();
  if (company.domain && link.includes(company.domain.toLowerCase())) rank -= 3;
  if (link.includes("bseindia.com") || link.includes("nseindia.com")) rank -= 2;
  return { ...item, company: company.name, ticker: company.ticker, tag, rank };
}

async function fetchCompanyIr(company, region, cutoffMs) {
  const queries = buildCompanyQueries(company);
  try {
    const items = [];
    for (const query of queries) {
      for (const item of await fetchGoogleNews(query, region)) {
        if (!item.pubDate || item.pubDate.getTime() < cutoffMs) continue;
        if (!isRelevantIrItem(item, company)) continue;
        items.push(scoreIrItem(item, company));
      }
    }
    return items;
  } catch (err) {
    console.warn(`  ir warn: ${company.name} — ${err.message}`);
    return [];
  }
}

async function mapConcurrent(items, fn, limit) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function pickTopUpdates(items, limit = 3) {
  const seen = new Set();
  const companiesUsed = new Set();
  const sorted = items.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return (b.pubDate?.getTime() ?? 0) - (a.pubDate?.getTime() ?? 0);
  });

  const picked = [];
  for (const item of sorted) {
    const key = item.title.toLowerCase().replace(/\W+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);

    if (companiesUsed.has(item.company)) continue;
    companiesUsed.add(item.company);

    picked.push({
      company: item.company,
      ticker: item.ticker,
      tag: item.tag,
      headline: summarize(item.title),
      url: item.link,
      published: item.pubDate?.toISOString() ?? null,
    });
    if (picked.length >= limit) break;
  }
  return picked;
}

export async function buildSectorCompanyUpdates(sectorId, regionConfig) {
  const companies = SECTOR_COMPANIES_BY_REGION[regionConfig.id]?.[sectorId];
  if (!companies) return [];

  const cutoffMs = IR_CUTOFF();
  const batches = await mapConcurrent(
    companies,
    (company) => fetchCompanyIr(company, regionConfig, cutoffMs),
    CONCURRENCY,
  );
  return pickTopUpdates(batches.flat(), 3);
}
