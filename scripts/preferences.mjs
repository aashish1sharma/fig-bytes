import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PREFS_DIR = join(ROOT, "data");
const PREFS_PATH = join(PREFS_DIR, "user-preferences.json");

const DECAY_PER_DAY = 0.92;
const MIN_EVENTS_FOR_PERSONALIZATION = 2;

function emptyProfile() {
  return {
    events: 0,
    lastEventAt: null,
    sectors: {},
    tags: {},
    sources: {},
    companies: {},
    contentTypes: {},
    regions: {},
  };
}

function loadStore() {
  if (!existsSync(PREFS_PATH)) return { users: {} };
  try {
    return JSON.parse(readFileSync(PREFS_PATH, "utf8"));
  } catch {
    return { users: {} };
  }
}

function saveStore(store) {
  mkdirSync(PREFS_DIR, { recursive: true });
  writeFileSync(PREFS_PATH, JSON.stringify(store, null, 2));
}

function normalizeKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function decayProfile(profile, now = Date.now()) {
  if (!profile.lastEventAt) return profile;
  const days = (now - profile.lastEventAt) / (24 * 60 * 60 * 1000);
  if (days < 1) return profile;

  const factor = DECAY_PER_DAY ** days;
  for (const bucket of ["sectors", "tags", "sources", "companies", "contentTypes", "regions"]) {
    for (const [key, weight] of Object.entries(profile[bucket])) {
      const next = weight * factor;
      if (next < 0.05) delete profile[bucket][key];
      else profile[bucket][key] = next;
    }
  }
  return profile;
}

function bump(bucket, key, amount = 1) {
  if (!key) return;
  bucket[key] = (bucket[key] ?? 0) + amount;
}

export function recordEvent(event) {
  const userId = event?.userId;
  if (!userId) throw new Error("userId is required");

  const store = loadStore();
  const profile = decayProfile(store.users[userId] ?? emptyProfile());

  bump(profile.sectors, event.sectorId);
  bump(profile.tags, event.tag);
  bump(profile.sources, normalizeKey(event.source));
  bump(profile.contentTypes, event.contentType);
  bump(profile.regions, event.regionId);
  if (event.company) bump(profile.companies, normalizeKey(event.company));

  profile.events += 1;
  profile.lastEventAt = event.ts ?? Date.now();
  store.users[userId] = profile;
  saveStore(store);
  return profile;
}

export function getUserPreferences(userId, regionId = null) {
  if (!userId) return emptyProfile();
  const store = loadStore();
  const profile = decayProfile(store.users[userId] ?? emptyProfile());
  if (!regionId) return profile;

  const regionWeight = profile.regions[regionId] ?? 0;
  const scale = regionWeight > 0 ? 1 + Math.min(regionWeight / 10, 0.5) : 1;
  return {
    ...profile,
    regionBoost: scale,
    activeRegion: regionId,
  };
}

function hasSignificantPreferences(prefs) {
  return (prefs.events ?? 0) >= MIN_EVENTS_FOR_PERSONALIZATION;
}

function scoreBullet(bullet, sectorId, prefs) {
  let score = 0;
  score += (prefs.sectors[sectorId] ?? 0) * 2;
  score += (prefs.tags[bullet.tag] ?? 0) * 1.5;
  score += (prefs.sources[normalizeKey(bullet.source)] ?? 0) * 1.25;
  score *= prefs.regionBoost ?? 1;
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

export function personalizeDashboard(data, userId, regionId = data.regionId) {
  if (!userId) return { ...data, personalized: false };

  const prefs = getUserPreferences(userId, regionId);
  if (!hasSignificantPreferences(prefs)) {
    return { ...data, personalized: false, personalization: { events: prefs.events ?? 0 } };
  }

  const sectors = data.sectors.map((sector) => {
    const pool = sector.candidates?.length ? sector.candidates : sector.bullets ?? [];
    const bullets = pickPersonalizedBullets(pool, sector.id, prefs, 3);
    return { ...sector, bullets };
  });

  sectors.sort((a, b) => (prefs.sectors[b.id] ?? 0) - (prefs.sectors[a.id] ?? 0));

  const favoredSectors = topPreferences(prefs, "sectors");
  const favoredTags = topPreferences(prefs, "tags");

  return {
    ...data,
    sectors,
    personalized: true,
    personalization: {
      events: prefs.events,
      favoredSectors,
      favoredTags,
      message: favoredSectors.length
        ? `Prioritizing ${favoredSectors.map((id) => id.replace(/-/g, " ")).join(", ")} based on your reading`
        : "Tailored to your reading habits",
    },
  };
}
