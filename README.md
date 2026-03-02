<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Cologne Museum Monitor

Cologne museum dashboard with a synthetic data engine, daily snapshot history, local NLP analysis, and manual/automatic refresh flows.

## Features

- Deterministic synthetic ratings and review counts per museum
- Synthetic review samples with sentiment + keyword extraction
- Daily history snapshots for trend charts (backfill included)
- Auto refresh on page load (30-minute throttle)
- Manual refresh button in UI
- Optional Google Places mode (provider switch via env)

## Environment

Create `.env.local` for frontend/backend dev (or set env vars in your shell):

```bash
PORT=8787
SYNC_MIN_INTERVAL_MINUTES=30
DATA_PROVIDER=synthetic_engine
# Optional only if you switch to Google mode:
# GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Run locally

1. Install dependencies:
   `npm install`
2. Start web + API together:
   `npm run dev`
3. Open:
   `http://localhost:3000`

## Data sync commands

- Manual sync job:
  `npm run sync:data -- --reason=manual --force=true`
- Start API only:
  `npm run start:api`

## Daily automation

GitHub workflow `.github/workflows/daily-sync.yml` runs every day at `03:00 UTC`.
In default synthetic mode no API key is required.

## Quality checks

- Type check: `npm run typecheck`
- Tests: `npm test`
- Build: `npm run build`
