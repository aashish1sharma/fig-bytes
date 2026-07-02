# FIG Bytes

Daily **Financial Institutions Group (FIG)** briefings in a scannable 5-minute format. Two regional dashboards:

- **[India FIG Bytes](public/index.html)** — India BFSI news from Moneycontrol, Livemint, Economic Times, Reuters, and more
- **[Asia FIG Bytes](public/asia.html)** — Southeast Asia, China, Japan, and Australia (ex-India) from Reuters, FT, SCMP, Nikkei Asia, and more

Each sector card shows **3 headlines** from the last **24 hours**, plus **Research/Premium Insights** and **Listed Company IR Updates**.

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20-green.svg)

## Features

| Feature | Description |
|---------|-------------|
| **4 sectors** | Asset Management, Wealth Management, Insurance, Retail Banking |
| **Tagged headlines** | Regulatory, Leadership, Strategy, Product, Earnings, Press |
| **Deduplication** | Same story from multiple outlets collapsed to one bullet |
| **Personalization** | Learns from your clicks; re-ranks sectors and stories after 2+ reads |
| **IR updates** | Investor presentations, analyst reports, earnings transcripts only |
| **No API keys** | Uses public RSS and Google News |

## Quick start (local)

**Requirements:** Node.js 20+

```bash
git clone https://github.com/YOUR_USERNAME/fig-bytes.git
cd fig-bytes
npm install
npm start
```

Open **http://localhost:3456** for India, **http://localhost:3456/asia.html** for Asia.

- **Refresh now** — fetches live headlines (~30 seconds)
- Click headlines to train personalization (stored in your browser)

## Share a live link

Pick one of these options to give others a URL:

### Option A — GitHub Pages (free, static)

Best for a **read-only** demo that auto-updates daily. No server; **Refresh now** reloads cached JSON.

1. Push this repo to GitHub (see [Publish to GitHub](#publish-to-github) below).
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The workflow [`.github/workflows/refresh-and-deploy.yml`](.github/workflows/refresh-and-deploy.yml) runs daily at ~7 AM IST, refreshes data, and deploys `public/`.
4. Your site will be at:

   `https://YOUR_USERNAME.github.io/fig-bytes/`

### Option B — Render (free tier, full server)

Best for **live refresh** and personalization API sync.

1. Push to GitHub.
2. [Create a new Blueprint on Render](https://render.com/deploy) and connect the repo (uses [`render.yaml`](render.yaml)).
3. Render deploys a web service plus a daily cron job to refresh headlines.
4. Share your Render URL, e.g. `https://fig-bytes.onrender.com`.

### Option C — Docker

```bash
docker build -t fig-bytes .
docker run -p 3456:3456 -e HOST=0.0.0.0 fig-bytes
```

Open **http://localhost:3456**.

## Publish to GitHub

From this directory (first time only):

```bash
git init
git add .
git commit -m "Initial release: India and Asia FIG Bytes dashboards"
gh repo create fig-bytes --public --source=. --remote=origin --push
```

Replace `YOUR_USERNAME` in the README and share:

- **Repo:** `https://github.com/YOUR_USERNAME/fig-bytes`
- **Live demo (Pages):** `https://YOUR_USERNAME.github.io/fig-bytes/`

## macOS daily automation (optional)

For a personal Mac setup with 7 AM refresh and login server:

```bash
npm run setup
```

## Project structure

```
scripts/
  fetch-news.mjs    # Aggregates RSS + Google News, writes dashboard JSON
  regions.mjs       # India vs Asia queries, filters, sources
  server.mjs        # Local / cloud HTTP server + API
  insights.mjs      # Premium & research insights
  company-ir.mjs    # Listed company IR updates
  preferences.mjs   # Server-side preference storage (optional)
public/
  index.html        # India dashboard
  asia.html         # Asia dashboard
  app.js            # UI + click tracking
  personalize.mjs   # Client-side personalization
```

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard/:region` | GET | Dashboard JSON (`india` or `asia`) |
| `/api/refresh/:region` | POST | Fetch fresh news, return updated JSON |
| `/api/events` | POST | Record click event for personalization |
| `/health` | GET | Health check for deploy platforms |

## Configuration

Copy [`.env.example`](.env.example) to `.env` to override:

- `HOST` — `127.0.0.1` locally, `0.0.0.0` in Docker/cloud
- `PORT` — default `3456`

## Contributing

Contributions welcome! Open an issue or PR for:

- Better sector filters or sources
- Additional regions
- Deployment improvements

Please do not commit `.env`, `data/`, or `logs/`.

## License

[MIT](LICENSE) — use, modify, and share freely with attribution.
