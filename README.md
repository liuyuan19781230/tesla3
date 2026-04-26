# 0DTE Cockpit

A decision-support terminal for 0DTE options traders. MVP / design preview.

> **Status:** v0.1.0 · UI prototype with simulated data · No broker connection · No live market feed

This is the front-end shell for an "options trader's copilot" — a terminal-style interface that fuses signal aggregation, strategy construction, and forced risk discipline into one workflow. The goal is to productize the decision loop a discretionary 0DTE trader runs in their head all day.

## What's in this build

- **Strategy Dashboard** — Hero signal card with active recommendation, conviction score, max profit/loss, breakeven range, and live "watchlist" strip.
- **Gamma Exposure Chart** — Stacked call/put gamma by strike with spot overlay (the kind of view dealer-positioning traders want).
- **IV Term Structure** — 0DTE → 30D implied vol curve with IV rank and crush-risk callout.
- **Strategy Builder** — Five templates (Iron Condor, Broken Wing Butterfly, Short Straddle, Put Credit Spread, Call Credit Spread) with parameter inputs and live order preview.
- **Risk Guard** — Daily P&L limit, trade count cap, consecutive-loss circuit breaker, and an emergency flatten button. All pre-checks block staging when triggered.
- **Trade Journal** — Auto-tagged session log (discipline / FOMO / news / pattern).

All numbers are simulated. The point of this build is to nail the **interaction model and information density**, not to wire up a feed.

## Running locally

It's a single static page. Just open it.

```bash
# Option 1: open directly
open index.html

# Option 2: any static server
python3 -m http.server 8080
# → http://localhost:8080
```

No build step, no npm install, no framework runtime. Tailwind and Chart.js load from CDN.

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Repo → **Settings** → **Pages**.
3. Source: **Deploy from a branch**. Branch: `main` · Folder: `/ (root)`.
4. Save. Your site goes live at `https://<your-user>.github.io/<repo-name>/` in a minute or two.

Or use GitHub Actions with the included `.github/workflows/pages.yml` for automatic deploys on push.

## Tech

- HTML + Tailwind CSS (CDN) + vanilla JS — zero build
- Chart.js for visualizations
- JetBrains Mono + Bebas Neue for the terminal aesthetic

## Roadmap (the real product)

The MVP this prototype previews:

| Phase | Feature | Why |
|-------|---------|-----|
| 1 | Live data feed (Polygon.io / Databento) | Replace mocks with real options chain + greeks |
| 2 | Broker integration (IBKR / tastytrade) | One-click order staging → submission |
| 3 | Auto-flatten engine | Server-side risk daemon that fires even if browser closes |
| 4 | Multi-account view | Pro users running multiple sub-accounts |
| 5 | Backtester | Validate templates on historical 0DTE data |
| 6 | Mobile | Read-only mirror of positions + risk state |

## Disclaimer

Nothing in this repo is investment advice, a recommendation, or a solicitation. 0DTE options carry **substantial risk of total loss** and are unsuitable for most investors. This is a UI prototype published for design review.

## License

MIT
