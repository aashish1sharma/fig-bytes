import { readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const [bookmarksPath, url, name] = process.argv.slice(2);

if (!bookmarksPath || !url || !name) {
  console.error("Usage: node add-chrome-bookmark.mjs <bookmarks-file> <url> <name>");
  process.exit(1);
}

const raw = readFileSync(bookmarksPath, "utf8");
const data = JSON.parse(raw);
const bar = data.roots?.bookmark_bar;

if (!bar?.children) {
  console.error("Could not find Chrome bookmark bar.");
  process.exit(1);
}

const exists = bar.children.some((item) => item.type === "url" && item.url === url);
if (exists) {
  console.log(`Bookmark already exists: ${name} -> ${url}`);
  process.exit(0);
}

const maxId = bar.children.reduce((max, item) => {
  const id = Number(item.id);
  return Number.isFinite(id) ? Math.max(max, id) : max;
}, 0);

const chromeTime = String((Date.now() + 11644473600000) * 1000);

bar.children.unshift({
  date_added: chromeTime,
  date_last_used: "0",
  guid: randomUUID(),
  id: String(maxId + 1),
  name,
  type: "url",
  url,
});

writeFileSync(bookmarksPath, JSON.stringify(data, null, 3) + "\n");
console.log(`Added Chrome bookmark: ${name} -> ${url}`);
console.log("Restart Chrome if the bookmark does not appear immediately.");
