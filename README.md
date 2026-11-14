# The Impossible SOLution

**Live:** https://yyn192.github.io/impossible-solution/

A browser game for kids aged 7–12: run an outpost, make trade-offs, see the consequences. Built for the NASA Space Apps Challenge 2026 ("Build a Junior Astronaut Mission Trainer"), team SoftUniors, Sofia.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test
npm run build
```

Optional: `cp .env.example .env` and add a free key from https://api.nasa.gov (only used by `npm run snapshot`).

## Credits & licence

Apache-2.0. Data sources, libraries and AI use: see `CREDITS.md` and `docs/ai-usage-log.md`.
Uses NASA open data. Not affiliated with or endorsed by NASA.
