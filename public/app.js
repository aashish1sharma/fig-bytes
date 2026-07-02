import { personalize, recordClick } from "./personalize.mjs";

export function initDashboard(config) {
  const USER_ID_KEY = "fig-bytes-user-id";
  let lastRawData = null;

  function getUserId() {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
  }

  function trackClick(details) {
    recordClick(details);
    fetch("./api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: getUserId(),
        ts: Date.now(),
        regionId: config.regionId,
        ...details,
      }),
      keepalive: true,
    }).catch(() => {});

    if (lastRawData) {
      render(personalize(lastRawData, config.regionId));
      setStatus("Updated for your reading habits.", "success");
    }
  }

  function trackAttrs(details) {
    const attrs = {
      "data-track": "1",
      "data-content-type": details.contentType,
      "data-sector-id": details.sectorId ?? "",
      "data-tag": details.tag ?? "",
      "data-source": details.source ?? "",
    };
    if (details.company) attrs["data-company"] = details.company;
    return Object.entries(attrs)
      .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
      .join(" ");
  }

  const TAG_CLASS = {
    Leadership: "tag-leadership",
    Strategy: "tag-strategy",
    Product: "tag-product",
    Regulatory: "tag-regulatory",
    Earnings: "tag-earnings",
    Press: "tag-press",
    Premium: "tag-premium",
    Research: "tag-research",
    "Op-ed": "tag-oped",
    Presentation: "tag-presentation",
    Transcript: "tag-transcript",
    "Analyst Report": "tag-analyst",
  };

  const TAG_COLOR = {
    Leadership: "var(--tag-leadership)",
    Strategy: "var(--tag-strategy)",
    Product: "var(--tag-product)",
    Regulatory: "var(--tag-regulatory)",
    Earnings: "var(--tag-earnings)",
    Press: "var(--tag-press)",
  };

  const SECTOR_COLOR = {
    "asset-management": "var(--sector-am)",
    "wealth-management": "var(--sector-wm)",
    insurance: "var(--sector-ins)",
    "retail-banking": "var(--sector-rb)",
  };

  function escapeHtml(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatTime(iso, timezone) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("en-IN", {
      timeZone: timezone,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function renderBullet(b, timezone, sectorId) {
    const tagClass = TAG_CLASS[b.tag] ?? "tag-press";
    const forYou = b.forYou ? `<span class="for-you">For you</span>` : "";
    return `
      <li>
        <span class="tag ${tagClass}">${escapeHtml(b.tag)}</span>
        <div class="bullet-body">
          <a href="${escapeHtml(b.url)}" target="_blank" rel="noopener noreferrer" ${trackAttrs({
            contentType: "news",
            sectorId,
            tag: b.tag,
            source: b.source,
          })}>${escapeHtml(b.headline)}</a>
          ${forYou}
          <span class="source">${escapeHtml(b.source)}${b.published ? " · " + formatTime(b.published, timezone) : ""}</span>
        </div>
      </li>`;
  }

  function renderInsight(sector, timezone) {
    const barColor = SECTOR_COLOR[sector.id] ?? "var(--accent)";
    const insight = sector.insight;
    if (!insight) {
      return `
        <article class="card insight-card">
          <div class="card-header">
            <span class="sector-bar" style="background:${barColor}"></span>
            <h2>${escapeHtml(sector.name)}</h2>
          </div>
          <ul class="bullets">
            <li class="empty">No premium or research insight in the last 7 days.</li>
          </ul>
        </article>`;
    }
    const tagClass = TAG_CLASS[insight.tag] ?? "tag-research";
    const paywall = insight.paywalled
      ? `<span class="paywall-note">Subscriber login required for full article</span>`
      : "";
    const teaser = insight.teaser
      ? `<p class="insight-teaser">${escapeHtml(insight.teaser)}</p>`
      : "";
    return `
      <article class="card insight-card">
        <div class="card-header">
          <span class="sector-bar" style="background:${barColor}"></span>
          <h2>${escapeHtml(sector.name)}</h2>
        </div>
        <ul class="bullets">
          <li>
            <span class="tag ${tagClass}">${escapeHtml(insight.tag)}</span>
            <div class="bullet-body">
              <a href="${escapeHtml(insight.url)}" target="_blank" rel="noopener noreferrer" ${trackAttrs({
                contentType: "insight",
                sectorId: sector.id,
                tag: insight.tag,
                source: insight.source,
              })}>${escapeHtml(insight.headline)}</a>
              <span class="source">${escapeHtml(insight.source)}${insight.published ? " · " + formatTime(insight.published, timezone) : ""}</span>
              ${paywall}
              ${teaser}
            </div>
          </li>
        </ul>
      </article>`;
  }

  function renderInsights(data, timezone) {
    const section = document.getElementById("insights-section");
    if (!section) return;
    section.innerHTML = `
      <div class="insights-header">
        <h2>Research &amp; Premium Insights</h2>
        <p class="insights-note">Headlines from premium publishers, research firms, and op-eds. Full text opens on the publisher site.</p>
      </div>
      <div class="insights-legend">
        <span><i class="dot" style="background:var(--tag-premium)"></i> Premium</span>
        <span><i class="dot" style="background:var(--tag-research)"></i> Research</span>
        <span><i class="dot" style="background:var(--tag-oped)"></i> Op-ed</span>
      </div>
      <div class="insights-grid">${data.sectors.map((s) => renderInsight(s, timezone)).join("")}</div>`;
  }

  function renderCompanyUpdate(u, timezone, sectorId) {
    const tagClass = TAG_CLASS[u.tag] ?? "tag-presentation";
    return `
      <li>
        <span class="tag ${tagClass}">${escapeHtml(u.tag)}</span>
        <div class="bullet-body">
          <a href="${escapeHtml(u.url)}" target="_blank" rel="noopener noreferrer" ${trackAttrs({
            contentType: "ir",
            sectorId,
            tag: u.tag,
            source: u.company,
            company: u.company,
          })}>${escapeHtml(u.headline)}</a>
          <span class="source">${escapeHtml(u.company)} (${escapeHtml(u.ticker)})${u.published ? " · " + formatTime(u.published, timezone) : ""}</span>
        </div>
      </li>`;
  }

  function renderCompanySector(sector, timezone) {
    const barColor = SECTOR_COLOR[sector.id] ?? "var(--accent)";
    const updates = sector.companyUpdates ?? [];
    const count = updates.length;
    const bullets = count
      ? updates.map((u) => renderCompanyUpdate(u, timezone, sector.id)).join("")
      : `<li class="empty">No investor presentations, analyst reports, or earnings transcripts in the last 30 days.</li>`;

    return `
      <article class="card insight-card">
        <div class="card-header">
          <span class="sector-bar" style="background:${barColor}"></span>
          <h2>${escapeHtml(sector.name)}</h2>
          <span class="card-count">${count}/3</span>
        </div>
        <ul class="bullets">${bullets}</ul>
      </article>`;
  }

  function renderCompanyUpdates(data, timezone) {
    const section = document.getElementById("company-section");
    if (!section) return;
    section.innerHTML = `
      <div class="insights-header">
        <h2>Listed Company IR Updates</h2>
        <p class="insights-note">Investor presentations, analyst reports, and earnings call transcripts from top listed companies per sector (last 30 days).</p>
      </div>
      <div class="insights-legend">
        <span><i class="dot" style="background:var(--tag-strategy)"></i> Presentation</span>
        <span><i class="dot" style="background:var(--tag-analyst)"></i> Analyst Report</span>
        <span><i class="dot" style="background:var(--tag-transcript)"></i> Transcript</span>
      </div>
      <div class="insights-grid">${data.sectors.map((s) => renderCompanySector(s, timezone)).join("")}</div>`;
  }

  function renderCard(sector, timezone, emptyLabel) {
    const count = sector.bullets?.length ?? 0;
    const barColor = SECTOR_COLOR[sector.id] ?? "var(--accent)";
    const bullets = count
      ? sector.bullets.map((b) => renderBullet(b, timezone, sector.id)).join("")
      : `<li class="empty">No ${emptyLabel} headlines in the last 24 hours.</li>`;

    return `
      <article class="card">
        <div class="card-header">
          <span class="sector-bar" style="background:${barColor}"></span>
          <h2>${escapeHtml(sector.name)}</h2>
          <span class="card-count">${count}/3</span>
        </div>
        <ul class="bullets">${bullets}</ul>
      </article>`;
  }

  function renderSummary(data) {
    const all = data.sectors.flatMap((s) => s.bullets ?? []);
    const byTag = {};
    for (const b of all) byTag[b.tag] = (byTag[b.tag] ?? 0) + 1;

    const summary = document.getElementById("summary");
    if (!summary) return;
    if (!all.length) {
      summary.hidden = true;
      return;
    }

    const tagBits = Object.entries(byTag)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, n]) => `<span><i class="dot" style="background:${TAG_COLOR[tag] ?? "var(--tag-press)"}"></i>${n} ${tag}</span>`)
      .join("");

    const personalNote = data.personalized
      ? `<span class="summary-personal">${escapeHtml(data.personalization?.message ?? "Tailored to your reading habits")}</span>`
      : data.personalization?.events > 0
        ? `<span class="summary-personal muted">Learning your preferences (${data.personalization.events} clicks)</span>`
        : "";

    summary.innerHTML = `
      <span class="summary-count">${all.length} headlines · ${data.sectors.length} sectors</span>
      ${personalNote}
      <span class="summary-tags">${tagBits}</span>`;
    summary.hidden = false;
  }

  function render(data) {
    const timezone = data.timezone ?? config.timezone;
    const emptyLabel = data.region ?? config.emptyRegionLabel;
    const title = data.title ?? config.title;
    document.title = title;

    const titleEl = document.getElementById("dashboard-title");
    if (titleEl) titleEl.textContent = title;

    const regionEl = document.getElementById("region");
    if (regionEl && data.region) regionEl.textContent = data.region;

    const tzLabel = timezone === "Asia/Kolkata" ? "IST" : "SGT";
    const metaEl = document.getElementById("meta");
    if (metaEl) {
      metaEl.textContent =
        `Updated ${formatTime(data.generatedAt, timezone)} ${tzLabel} · Last ${data.windowHours ?? 24} hours · 3 bullets per sector`;
    }

    const footerEl = document.getElementById("footer");
    if (footerEl && data.sources?.length) {
      footerEl.textContent =
        `Sources: ${data.sources.join(", ")}. Auto-refresh daily at 7:00 AM ${tzLabel}.`;
    }

    renderSummary(data);
    const mainEl = document.getElementById("main");
    if (mainEl) {
      mainEl.innerHTML =
        `<div class="grid">${data.sectors.map((s) => renderCard(s, timezone, emptyLabel)).join("")}</div>`;
    }
    renderInsights(data, timezone);
    renderCompanyUpdates(data, timezone);
  }

  function setStatus(message, type = "") {
    const el = document.getElementById("status");
    if (!el) return;
    el.textContent = message;
    el.className = type ? `status ${type}` : "status";
  }

  function isStaticHost() {
    return config.staticMode || /\.github\.io$/i.test(window.location.hostname);
  }

  async function loadDashboard({ refresh = false } = {}) {
    const main = document.getElementById("main");
    const btn = document.getElementById("refresh-btn");
    const summary = document.getElementById("summary");
    if (summary) summary.hidden = true;

    if (btn) btn.disabled = true;
    if (main) {
      main.innerHTML = `<p class="loading">${refresh ? "Pulling latest headlines… (may take up to a minute)" : "Loading dashboard…"}</p>`;
    }
    const insights = document.getElementById("insights-section");
    const company = document.getElementById("company-section");
    if (insights) insights.innerHTML = "";
    if (company) company.innerHTML = "";
    setStatus(refresh ? "Fetching latest sector news…" : "");

    try {
      if (isStaticHost()) {
        const res = await fetch(`./dashboard-${config.regionId}.json`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load dashboard data");
        const data = await res.json();
        lastRawData = data;
        render(personalize(data, config.regionId));
        setStatus(
          refresh ? "Reloaded dashboard data." : "Static site — updates daily via GitHub Actions.",
          refresh ? "success" : "",
        );
        return;
      }

      const endpoint = refresh
        ? `./api/refresh/${config.regionId}`
        : `./api/dashboard/${config.regionId}`;
      const res = await fetch(endpoint, {
        method: refresh ? "POST" : "GET",
        cache: "no-store",
        headers: { "X-User-Id": getUserId() },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load dashboard");
      lastRawData = data;
      render(personalize(data, config.regionId));
      setStatus(refresh ? "Dashboard refreshed." : "", refresh ? "success" : "");
    } catch (err) {
      try {
        const fallback = await fetch(`./dashboard-${config.regionId}.json`, { cache: "no-store" });
        if (fallback.ok) {
          const data = await fallback.json();
          lastRawData = data;
          render(personalize(data, config.regionId));
          setStatus("Loaded cached dashboard. Start the server for live refresh.", "error");
          return;
        }
      } catch {
        // ignore fallback errors
      }
      if (main) main.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
      setStatus(err.message, "error");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  const refreshBtn = document.getElementById("refresh-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => loadDashboard({ refresh: true }));
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-track]");
    if (!link) return;
    trackClick({
      sectorId: link.dataset.sectorId || undefined,
      tag: link.dataset.tag || undefined,
      source: link.dataset.source || undefined,
      contentType: link.dataset.contentType || "news",
      company: link.dataset.company || undefined,
      url: link.href,
    });
  });

  loadDashboard();
}
