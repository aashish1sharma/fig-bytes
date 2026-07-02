const STORAGE_KEY = "fig-bytes-prefs";
const MIN_EVENTS = 2;

function emptyProfile() {
  return {
    events: 0,
    sectors: {},
    tags: {},
    sources: {},
    companies: {},
    contentTypes: {},
    regions: {},
  };
}

function normalizeKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProfile();
    return { ...emptyProfile(), ...JSON.parse(raw) };
  } catch {
    return emptyProfile();
  }
}

function savePrefs(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function recordClick(event) {
  const profile = loadPrefs();
  const bump = (bucket, key) => {
    if (!key) return;
    bucket[key] = (bucket[key] ?? 0) + 1;
  };

  bump(profile.sectors, event.sectorId);
  bump(profile.tags, event.tag);
  bump(profile.sources, normalizeKey(event.source));
  bump(profile.contentTypes, event.contentType);
  bump(profile.regions, event.regionId);
  if (event.company) bump(profile.companies, normalizeKey(event.company));

  profile.events += 1;
  savePrefs(profile);
  return profile;
}

function scoreBullet(bullet, sectorId, prefs) {
  let score = 0;
  score += (prefs.sectors[sectorId] ?? 0) * 2;
  score += (prefs.tags[bullet.tag] ?? 0) * 1.5;
  score += (prefs.sources[normalizeKey(bullet.source)] ?? 0) * 1.25;
  const regionWeight = prefs.regions[prefs.activeRegion] ?? 0;
  if (regionWeight > 0) score *= 1 + Math.min(regionWeight / 10, 0.5);
  return score;
}

function pickPersonalizedBullets(pool, sectorId, prefs, limit = 3) {
  const scored = pool.map((bullet, order) => ({
    bullet,
    order,
    score: scoreBullet(bullet, sectorId, prefs),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.order - b.order;
  });

  const seen = new Set();
  const picked = [];
  for (const { bullet, score } of scored) {
    const key = bullet.url ?? bullet.headline;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    picked.push({ ...bullet, forYou: score > 0.5 });
    if (picked.length >= limit) break;
  }
  return picked;
}

function topPreferences(prefs, bucket, limit = 2) {
  return Object.entries(prefs[bucket] ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
}

export function personalize(data, regionId) {
  const prefs = { ...loadPrefs(), activeRegion: regionId };
  if ((prefs.events ?? 0) < MIN_EVENTS) {
    return {
      ...data,
      personalized: false,
      personalization: { events: prefs.events ?? 0 },
    };
  }

  const sectors = data.sectors.map((sector) => {
    const pool = sector.candidates?.length ? sector.candidates : sector.bullets ?? [];
    const bullets = pickPersonalizedBullets(pool, sector.id, prefs, 3);
    return { ...sector, bullets };
  });

  sectors.sort((a, b) => (prefs.sectors[b.id] ?? 0) - (prefs.sectors[a.id] ?? 0));

  const favoredSectors = topPreferences(prefs, "sectors");
  return {
    ...data,
    sectors,
    personalized: true,
    personalization: {
      events: prefs.events,
      favoredSectors,
      message: favoredSectors.length
        ? `Prioritizing ${favoredSectors.map((id) => id.replace(/-/g, " ")).join(", ")} based on your reading`
        : "Tailored to your reading habits",
    },
  };
}

export function stripCandidates(data) {
  return {
    ...data,
    sectors: data.sectors?.map(({ candidates, ...sector }) => sector) ?? [],
  };
}
