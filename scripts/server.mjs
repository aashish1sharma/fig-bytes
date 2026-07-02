import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dashboardPath, REGIONS } from "./regions.mjs";
import { recordEvent } from "./preferences.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PUBLIC = join(__dirname, "..", "public");
const PORT = Number(process.env.PORT ?? 3456);
const HOST = process.env.HOST ?? "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
};

const refreshing = new Set();

async function loadFetcher() {
  const moduleUrl = `${pathToFileURL(join(__dirname, "fetch-news.mjs"))}?v=${Date.now()}`;
  return import(moduleUrl);
}

function readDashboardFile(regionId = "india") {
  const path = dashboardPath(join(__dirname, ".."), regionId);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

function serveDashboard(res, data) {
  sendJson(res, 200, data);
}

function parseRegionFromUrl(url) {
  const match = url.match(/^\/api\/(?:dashboard|refresh)\/([a-z]+)/);
  if (match && REGIONS[match[1]]) return match[1];
  return "india";
}

function serveStatic(req, res) {
  const path = req.url.split("?")[0];
  const file = path === "/" ? "/index.html" : path;
  const full = join(PUBLIC, file);

  if (!full.startsWith(PUBLIC) || !existsSync(full)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }

  const ext = extname(full);
  res.writeHead(200, {
    "Content-Type": MIME[ext] ?? "application/octet-stream",
    "Cache-Control": ext === ".html" ? "no-cache" : "no-store",
  });
  res.end(readFileSync(full));
}

const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { ok: true, service: "fig-bytes" });
    return;
  }

  if (req.method === "GET" && req.url.startsWith("/api/dashboard")) {
    try {
      const regionId = parseRegionFromUrl(req.url);
      const data = readDashboardFile(regionId) ?? await (await loadFetcher()).fetchDashboard(regionId);
      serveDashboard(res, data);
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  if (req.method === "POST" && req.url === "/api/events") {
    try {
      const body = JSON.parse((await readBody(req)) || "{}");
      const profile = recordEvent(body);
      sendJson(res, 200, { ok: true, events: profile.events });
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
    return;
  }

  if (req.method === "POST" && req.url.startsWith("/api/refresh")) {
    const regionId = parseRegionFromUrl(req.url);
    if (refreshing.has(regionId)) {
      sendJson(res, 409, { error: "Refresh already in progress" });
      return;
    }
    refreshing.add(regionId);
    try {
      const { fetchDashboard, writeDashboard } = await loadFetcher();
      const data = await fetchDashboard(regionId);
      writeDashboard(data, regionId);
      serveDashboard(res, data);
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    } finally {
      refreshing.delete(regionId);
    }
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }

  res.writeHead(405, { "Content-Type": "text/plain" });
  res.end("Method not allowed");
});

server.listen(PORT, HOST, () => {
  const base = HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`India FIG Bytes:  ${base}/`);
  console.log(`Asia FIG Bytes:   ${base}/asia.html`);
});
