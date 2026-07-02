import { INSIGHT_SOURCE_LIST } from "./insights.mjs";

const INDIA_PREFERRED_SOURCES = [
  { pattern: /moneycontrol/i, label: "Moneycontrol", boost: -2 },
  { pattern: /livemint|mint/i, label: "Livemint", boost: -2 },
  { pattern: /economictimes|economic times/i, label: "Economic Times", boost: -1 },
  { pattern: /business.?standard/i, label: "Business Standard", boost: -1 },
  { pattern: /reuters/i, label: "Reuters", boost: -1 },
  { pattern: /financial express/i, label: "Financial Express", boost: -1 },
  { pattern: /cnbc.?tv18|cnbc/i, label: "CNBC-TV18", boost: -1 },
  { pattern: /morningstar/i, label: "Morningstar", boost: -1 },
  { pattern: /morningbrew|morning brew/i, label: "Morning Brew", boost: -1 },
];

const ASIA_PREFERRED_SOURCES = [
  { pattern: /reuters/i, label: "Reuters", boost: -3 },
  { pattern: /bloomberg/i, label: "Bloomberg", boost: -3 },
  { pattern: /financial times|ft\.com/i, label: "Financial Times", boost: -2 },
  { pattern: /nikkei asia|nikkei/i, label: "Nikkei Asia", boost: -2 },
  { pattern: /scmp|south china morning post/i, label: "SCMP", boost: -2 },
  { pattern: /cnbc/i, label: "CNBC", boost: -1 },
  { pattern: /businesstimes|business times/i, label: "Business Times", boost: -1 },
  { pattern: /channel news asia|cna\.com/i, label: "CNA", boost: -1 },
  { pattern: /afr\.com|australian financial review/i, label: "AFR", boost: -1 },
  { pattern: /morningstar/i, label: "Morningstar", boost: -1 },
];

/** Reject India-local FIG stories on the Asia dashboard. */
export const ASIA_EXCLUDE_INDIA =
  /\b(india|indian|mumbai|delhi|bengaluru|bangalore|chennai|kolkata|hyderabad|pune|nifty|sensex|₹|crore|lakh|rupee|rbi\b|sebi\b|irdai|pfrda|bima sugam|hdfc\b|icici\b|sbi\b|kotak|axis bank|lic of india|nuvama|360 one|moneycontrol|livemint|economic times|business standard|cnbctv18|cnbc-tv18|bseindia|nseindia|upi\b)\b/i;

const ASIA_MARKET =
  /\b(singapore|hong kong|japan|australia|china|taiwan|korea|south korea|malaysia|thailand|indonesia|vietnam|philippines|sydney|tokyo|beijing|shanghai|mas\b|hkma|sfc\b|asic|apra|monetary authority)\b/i;

const ASIA_GLOBAL_FEEDS = [
  { url: "https://www.scmp.com/rss/91/feed", source: "SCMP" },
  { url: "https://asia.nikkei.com/rss/feed/nar", source: "Nikkei Asia" },
  { url: "https://www.businesstimes.com.sg/rss/feed/business", source: "Business Times" },
];

const INDIA_SECTORS = [
  {
    id: "asset-management",
    name: "Asset Management",
    queries: [
      "site:moneycontrol.com mutual fund scheme NFO launch when:1d",
      "site:moneycontrol.com SIF mutual fund when:1d",
      "site:livemint.com mutual fund asset management when:1d",
      "site:economictimes.indiatimes.com mutual fund AMC when:1d",
      "site:cnbctv18.com mutual fund SIF NFO when:1d",
      "Invesco JioBlackRock AlphaGrep SIF NFO India when:1d",
      "Edelweiss AMC AUM milestone India when:3d",
      "SEBI mutual fund scheme India when:1d",
      "site:business-standard.com mutual fund AMC when:1d",
    ],
    feeds: [
      { url: "https://www.livemint.com/rss/markets", source: "Livemint" },
      { url: "https://www.livemint.com/rss/money", source: "Livemint" },
      { url: "https://economictimes.indiatimes.com/mf/rssfeeds/837555174.cms", source: "Economic Times" },
      { url: "https://www.moneycontrol.com/rss/marketreports.xml", source: "Moneycontrol" },
    ],
    keywords:
      /\b(mutual fund|amc\b|asset management|fund house|etf|aum|nav|scheme|nfo|sif\b|speciali[sz]ed investment|sip|passive|index fund|inflows?|outflows?)\b/i,
    exclude:
      /\b(builder|real estate|brokerage reco|buy rating|target of rs|stock manipulation(?!.*(?:mutual|amc|fund house)))\b/i,
    highSignal:
      /\b(nfo|new fund|fund launch|scheme launch|sif\b|mutual fund|amc\b|fund house|etf launch|inflows?|outflows?|aum|crosses?.*crore)\b/i,
    fallback: "mutual fund asset management India when:1d",
    gapFill: ["mutual fund NFO SIF launch India when:3d", "AMC AUM milestone India when:3d"],
  },
  {
    id: "wealth-management",
    name: "Wealth Management",
    queries: [
      "site:moneycontrol.com wealth management AUM when:1d",
      "site:livemint.com private banking wealth when:1d",
      "site:economictimes.indiatimes.com wealth management when:1d",
      "Kotak Deutsche Bank wealth private banking acquisition India when:3d",
      "360 ONE Nuvama IIFL wealth AUM India when:1d",
      "family office private banking India when:1d",
      "site:cnbctv18.com wealth management private banking when:1d",
      "site:business-standard.com wealth management OR private banking when:1d",
    ],
    feeds: [
      { url: "https://www.livemint.com/rss/money", source: "Livemint" },
      { url: "https://www.livemint.com/rss/companies", source: "Livemint" },
      { url: "https://economictimes.indiatimes.com/wealth/rssfeeds/837555174.cms", source: "Economic Times" },
    ],
    keywords:
      /\b(wealth management|private bank|private banking|family office|hnwi|pms\b|portfolio management|wealth advisor|360 one|nuvama|iifl wealth|anand rathi|assets under advisory|private client|deutsche bank.*wealth)\b/i,
    exclude:
      /\b(mutual fund|elss\b|amc\b|fund house|nfo alert|sip book|equity aum|tax saver fund|cagr returns?|brokerage reco|buy rating|share price today|market growth)\b/i,
    highSignal:
      /\b(wealth|private bank|family office|wealth management|360 one|nuvama|iifl wealth|kotak|deutsche).{0,80}(aum|milestone|crore|launch|acqui)/i,
    requireLocal:
      /\b(india|indian|mumbai|rbi|sebi|nuvama|360 one|kotak|hdfc|icici|axis|deutsche|₹|rs\.| crore|moneycontrol|livemint|economic times|business standard|cnbc)\b/i,
    fallback: "wealth management private banking India when:1d",
    gapFill: ["Kotak Deutsche wealth private banking India when:7d", "360 ONE wealth AUM India when:7d"],
  },
  {
    id: "insurance",
    name: "Insurance",
    queries: [
      "site:livemint.com insurance when:1d",
      "site:moneycontrol.com insurance when:1d",
      "IRDAI insurance India when:1d",
      "IRDAI Bima Sugam distribution reform when:3d",
      "LIC HDFC Life insurance India when:1d",
      "site:cnbctv18.com insurance IRDAI when:1d",
    ],
    feeds: [
      { url: "https://www.livemint.com/rss/insurance", source: "Livemint" },
      { url: "https://economictimes.indiatimes.com/industry/banking/finance/insure/rssfeeds/58496441.cms", source: "Economic Times" },
    ],
    keywords:
      /\b(insur|irdai|irda\b|life insurance|general insurance|health insurance|bima sugam|insurtech|claims?(?:\s+(?:ratio|settlement|performance|paid))|premium(?:\s+growth)?|underwrit|insurance (?:policy|regulator|licen[cs]e|sector|distribution|reform|venture))\b/i,
    requireStrong:
      /\b(insur|irdai|irda\b|life insurance|general insurance|health insurance|bima sugam|insurtech|insurance (?:policy|regulator|licen[cs]e|sector|industry|distribution|reform|venture|dark pattern))\b/i,
    exclude:
      /\b(stock price|share price|brokerage reco|buy rating|nifty|sensex|share sale|stake sale|divestment|disinvestment|viral video|partying|demerger|tax benefit|itat\b|holding company|psu sale|budget hit|celebrity|goyal)\b/i,
    highSignal: /\b(irdai|licence|license|bima sugam|mis.?selling|dark pattern|distribution reform|regulatory|product launch|merger|acquisition)\b/i,
    fallback: "general insurance India when:1d",
    gapFill: ["IRDAI insurance regulatory India when:3d"],
  },
  {
    id: "retail-banking",
    name: "Retail Banking",
    queries: [
      "site:livemint.com retail bank deposit loan when:1d",
      "site:economictimes.indiatimes.com retail banking when:1d",
      "site:business-standard.com banking RBI when:1d",
      "RBI Integrated Ombudsman Scheme banks when:3d",
      "RBI deposit mobilisation CASA retail banks when:3d",
      "HDFC SBI ICICI Axis retail banking India when:1d",
      "digital banking neobank India when:1d",
      "site:cnbctv18.com retail banking RBI when:1d",
    ],
    feeds: [
      { url: "https://www.livemint.com/rss/industry", source: "Livemint" },
      { url: "https://economictimes.indiatimes.com/industry/banking/finance/banking/rssfeeds/58496441.cms", source: "Economic Times" },
      { url: "https://www.moneycontrol.com/rss/economy.xml", source: "Moneycontrol" },
    ],
    keywords:
      /\b(retail bank|retail banking|banking|rbi|deposit|loan|home loan|personal loan|savings account|credit card|digital bank|digital banking|neobank|casa|npa|hdfc bank|sbi\b|icici bank|axis bank|kotak|upi|ombudsman|mis.?selling)\b/i,
    exclude:
      /\b(forex reserves|sensex|nifty|brokerage reco|mutual fund|amc\b|share price today|paying rent|corporate debt.?servicing|capital market norms|nbcf market volumes)\b/i,
    highSignal:
      /\b(retail bank|retail banking|savings account|home loan|personal loan|credit card|digital banking|neobank|deposit|casa|ombudsman|upi|rbi circular|mis.?selling|merger|acquisition)\b/i,
    requireLocal:
      /\b(india|indian|mumbai|rbi|hdfc bank|sbi\b|icici bank|axis bank|kotak|₹|rs\.| crore|moneycontrol|livemint|economic times|business standard|cnbc)\b/i,
    fallback: "retail banking consumer bank India when:1d",
    gapFill: ["RBI retail bank deposit loan India when:3d", "HDFC SBI digital banking India when:3d"],
  },
];

const ASIA_SECTORS = [
  {
    id: "asset-management",
    name: "Asset Management",
    queries: [
      "site:reuters.com (Singapore OR Japan OR Australia OR Hong Kong) asset management fund -India when:1d",
      "site:scmp.com asset management OR mutual fund OR ETF when:1d",
      "site:ft.com asset management Singapore OR Hong Kong OR Japan when:1d",
      "site:asia.nikkei.com asset management fund when:1d",
      "site:cnbc.com asset management Singapore OR Hong Kong OR Japan -India when:1d",
      "site:afr.com asset management OR superannuation Australia when:1d",
      "MAS fund management Singapore regulation when:1d -India",
      "ETF unit trust launch Singapore Hong Kong when:1d -India",
    ],
    feeds: ASIA_GLOBAL_FEEDS,
    keywords: /\b(asset management|amc\b|mutual fund|fund house|etf|aum|reit|unit trust|fund launch|inflows?|outflows?|superannuation)\b/i,
    exclude: /\b(us only|europe only|brokerage reco|buy rating|stock price today|india only|MDAX|EAFE|spacex|UCITS.*LSE)\b/i,
    highSignal: /\b(asset management|amc\b|fund launch|etf|aum|inflows?|outflows?|acquisition|merger|regulatory)\b/i,
    requireLocal: ASIA_MARKET,
    fallback: "site:reuters.com asset management (Singapore OR Japan OR Australia) -India when:1d",
    gapFill: [
      "site:scmp.com fund management Singapore OR Hong Kong when:3d",
      "site:ft.com asset manager Asia Pacific -India when:3d",
      "(Singapore OR Hong Kong OR Japan OR Australia) asset management fund -India when:3d",
    ],
  },
  {
    id: "wealth-management",
    name: "Wealth Management",
    queries: [
      "site:reuters.com wealth management private banking (Singapore OR Hong Kong OR Japan) -India when:1d",
      "site:scmp.com wealth management OR private banking when:1d",
      "site:ft.com private banking wealth Singapore OR Hong Kong when:1d",
      "site:cnbc.com wealth management Asia Pacific -India when:1d",
      "UBS DBS OCBC wealth management Singapore when:1d -India",
      "family office Singapore Hong Kong when:1d -India",
      "site:afr.com wealth management OR private banking Australia when:1d",
    ],
    feeds: ASIA_GLOBAL_FEEDS,
    keywords:
      /\b(wealth management|private bank|private banking|family office|hnwi|uhni|pms\b|portfolio management|wealth advisor|private client|assets under management|assets under advisory)\b/i,
    exclude: /\b(mutual fund|etf launch only|brokerage reco|buy rating|share price today|us wealth|india only)\b/i,
    highSignal:
      /\b(wealth|private bank|family office|wealth management).{0,80}(aum|milestone|billion|launch|acqui|platform)/i,
    requireLocal: ASIA_MARKET,
    fallback: "site:reuters.com private banking Singapore OR Hong Kong -India when:1d",
    gapFill: [
      "wealth management Singapore Hong Kong when:3d -India",
      "site:scmp.com family office wealth when:3d",
    ],
  },
  {
    id: "insurance",
    name: "Insurance",
    queries: [
      "site:reuters.com insurance (Singapore OR Japan OR Australia OR Hong Kong) -India when:1d",
      "site:scmp.com life insurance OR general insurance when:1d",
      "site:ft.com insurance Asia Pacific -India when:1d",
      "site:asia.nikkei.com insurance when:1d",
      "AIA Group Tokio Marine QBE insurance when:1d -India",
      "MAS insurance regulation Singapore when:1d -India",
      "site:cnbc.com insurance Singapore OR Japan OR Australia -India when:1d",
    ],
    feeds: ASIA_GLOBAL_FEEDS,
    keywords: /\b(insur|life insurance|general insurance|health insurance|policy premium|underwrit|insurtech|insurance regulator)\b/i,
    requireStrong:
      /\b(insur|life insurance|general insurance|health insurance|insurtech|insurance (?:policy|regulator|licen[cs]e|sector|industry|premium))\b/i,
    exclude: /\b(stock price|share price|brokerage reco|buy rating|irdai|prudential hcl|pension policy|retirement age|governance rules|tipranks)\b/i,
    highSignal: /\b(regulat|licence|license|product launch|merger|acquisition|mas\b|apra|approval)\b/i,
    requireLocal: ASIA_MARKET,
    fallback: "site:reuters.com insurance Asia Pacific -India when:1d",
    gapFill: [
      "insurance regulator Singapore OR Japan OR Australia when:3d -India",
      "site:scmp.com insurance Hong Kong OR Singapore when:3d",
      "(Singapore OR Japan OR Australia OR Hong Kong) life insurance -India when:3d",
    ],
  },
  {
    id: "retail-banking",
    name: "Retail Banking",
    queries: [
      "site:reuters.com retail banking (Singapore OR Hong Kong OR Japan OR Australia) -India when:1d",
      "site:scmp.com retail banking OR consumer banking when:1d",
      "site:ft.com banking Singapore OR Hong Kong OR Japan when:1d",
      "DBS OCBC UOB retail banking Singapore when:1d -India",
      "digital banking neobank Singapore OR Australia when:1d -India",
      "MAS HKMA banking regulation when:1d -India",
      "site:cnbc.com banking Singapore OR Hong Kong -India when:1d",
      "Trust Bank ANZ Commonwealth retail banking when:1d -India",
    ],
    feeds: ASIA_GLOBAL_FEEDS,
    keywords:
      /\b(retail bank|retail banking|consumer bank|deposit|loan|home loan|personal loan|savings account|credit card|digital bank|digital banking|neobank|casa|npa|payments)\b/i,
    exclude: /\b(forex reserves|brokerage reco|mutual fund|share price today|us bank only|europe only|real estate loan|property developer)\b/i,
    highSignal:
      /\b(retail bank|retail banking|digital banking|neobank|deposit|loan|credit card|branch|merger|acquisition|regulatory|casa|interest rate)\b/i,
    requireLocal: ASIA_MARKET,
    fallback: "site:reuters.com consumer banking Singapore OR Australia -India when:1d",
    gapFill: [
      "digital bank Singapore OR Australia when:3d -India",
      "site:scmp.com banking Hong Kong OR Singapore when:3d",
      "DBS OCBC UOB retail banking Singapore when:3d -India",
      "Trust Bank digital banking Singapore when:3d",
    ],
  },
];

export const REGIONS = {
  india: {
    id: "india",
    label: "India",
    title: "India FIG Bytes",
    hl: "en-IN",
    gl: "IN",
    ceid: "IN:en",
    timezone: "Asia/Kolkata",
    emptyRegionLabel: "India",
    preferredSources: INDIA_PREFERRED_SOURCES,
    sourceList: [
      "Moneycontrol",
      "Livemint",
      "Economic Times",
      "Business Standard",
      "Reuters",
      "CNBC-TV18",
      "Morningstar",
      "Google News",
      ...INSIGHT_SOURCE_LIST,
    ],
    sectors: INDIA_SECTORS,
    insightRegionId: "india",
  },
  asia: {
    id: "asia",
    label: "Asia",
    title: "Asia FIG Bytes",
    hl: "en-US",
    gl: "US",
    ceid: "US:en",
    timezone: "Asia/Singapore",
    emptyRegionLabel: "Asia-Pacific (ex-India)",
    excludeIndia: ASIA_EXCLUDE_INDIA,
    preferredSources: ASIA_PREFERRED_SOURCES,
    sourceList: [
      "Reuters",
      "Bloomberg",
      "Financial Times",
      "Nikkei Asia",
      "SCMP",
      "CNBC",
      "Business Times",
      "CNA",
      "AFR",
      "Morningstar",
      "Google News",
      "McKinsey",
      "BCG",
      "Bain",
      "Deloitte",
      "PwC",
      "EY",
      "KPMG",
      "Oliver Wyman",
    ],
    sectors: ASIA_SECTORS,
    insightRegionId: "asia",
  },
};

export function getRegionConfig(regionId = "india") {
  const config = REGIONS[regionId];
  if (!config) throw new Error(`Unknown region: ${regionId}`);
  return config;
}

export function dashboardPath(root, regionId = "india") {
  return `${root}/public/dashboard-${regionId}.json`;
}
