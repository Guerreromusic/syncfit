# SyncFit by Synclat

**Score, explain, and pitch Latin tracks for global sync.**

SyncFit helps music supervisors instantly understand whether a Latin track fits
a creative brief for **film, TV, ads, games, and branded content**.

Built for the **Musixmatch Musicathon**. Musixmatch is the required music data
layer — used in real time only, never stored or redistributed.

---

## What it does

SyncFit turns catalog search into intelligent sync recommendations:

1. **Enter a creative brief** — project type, region, mood, language, brand-safety
   level, and license tier.
2. **Enter a track** — type a song title (and optional artist). SyncFit resolves
   it on Musixmatch automatically as part of a single Run.
3. **SyncFit pulls track/lyric metadata from Musixmatch** in real time
   (artist/song metadata, explicit flag, short lyric *context* only).
4. **Optional partner APIs add signals** — Songstats (market signal) and
   LALAL.AI (audio readiness).
5. **AI generates a SyncFit Score and pitch-ready summary** via OpenRouter — a
   0–100 score with a transparent breakdown, brand-safety notes, best-use cases,
   supervisor notes, and suggested alternatives.

Every result is rendered as a polished, export-style **pitch card** you can hand
to a client or drop into a deck.

---

## The SyncFit Score (/100)

| Category              | Weight |
| --------------------- | -----: |
| Brief Match           |     25 |
| Lyric & Context Fit   |     20 |
| Mood / Energy Fit     |     15 |
| Brand Safety          |     15 |
| License Readiness     |     10 |
| Market Signal         |     10 |
| Audio Readiness       |      5 |
| **Total**             | **100** |

The final score is produced by the AI reasoning layer (OpenRouter). In demo mode
(no OpenRouter key) a transparent local heuristic produces the same shape so the
app always works end-to-end.

---

## Built with

- **Musixmatch API** — required music data layer (search, metadata, explicit
  flag, short lyric context)
- **OpenRouter** — AI reasoning layer (the SyncFit analysis)
- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** — custom dark, premium music-tech design system
- _Optional:_ **Songstats** (market signal)
- _Optional:_ **LALAL.AI** (audio readiness)
- _Future:_ **Cyanite** (advanced sonic tagging — not in V1)

No heavy database: saved demo reports are written to a local JSON file
(`/data/reports.json`, gitignored).

---

## Hackathon compliance

> **SyncFit uses the Musixmatch API meaningfully** for track search, artist/song
> metadata, explicit/content indicators, and short lyric context.

**Lyric & content policy (strictly enforced in code):**

- ✅ Uses Musixmatch data in **real time only**.
- 🚫 Does **not** store full lyrics.
- 🚫 Does **not** display full lyrics — only a short, non-reproducible context
  string used in-memory for analysis.
- 🚫 Does **not** bulk-download, cache, scrape, or redistribute Musixmatch
  content (responses are fetched with `cache: "no-store"`).
- 🚫 Does **not** commit API responses containing lyrics.
- ✅ Stores **only** Synclat-generated analysis summaries, scores, the user's
  brief, basic track title/artist metadata, and timestamps.
- ✅ Demo/evaluation use only. API keys are provided by the user via environment
  variables and are never committed or exposed to the browser.

Where this is enforced in the code:

- `lib/api/musixmatch.ts` — `toShortContext()` truncates any returned text to a
  short context and strips Musixmatch footers; responses are never cached.
- `lib/storage.ts` — `toSavedReport()` copies only safe fields and **drops
  `lyricsContext` by construction**.
- `lib/types.ts` — `SavedReport` has no lyrics field.
- `.gitignore` — ignores `.env*.local` and `/data/*.json`.

---

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open <http://localhost:3000>.

**The app runs with zero keys** — every surface falls back to clearly-labeled
demo mode. Add keys to `.env.local` to enable live data.

Useful scripts:

```bash
npm run dev        # start the dev server
npm run build      # production build
npm run start      # run the production build
npm run lint       # ESLint (next lint)
npm run typecheck  # tsc --noEmit
```

---

## Environment variables

Copy `.env.example` → `.env.local` and fill in what you have. All keys except
`NEXT_PUBLIC_APP_NAME` are **server-side only** and never reach the browser.

| Variable                | Required | Purpose                                                                 |
| ----------------------- | :------: | ----------------------------------------------------------------------- |
| `MUSIXMATCH_API_KEY`    |  Core¹   | Required hackathon data layer: track search, metadata, lyric context.   |
| `OPENROUTER_API_KEY`    |  Core¹   | AI reasoning layer that produces the SyncFit analysis JSON.             |
| `OPENROUTER_MODEL`      | Optional | Override the default model (`anthropic/claude-3.5-sonnet`).             |
| `SONGSTATS_API_KEY`     | Optional | Market signal (artist/track momentum).                                  |
| `LALAL_API_KEY`         | Optional | Audio readiness (stem/vocal separation potential).                      |
| `NEXT_PUBLIC_APP_NAME`  | Optional | Public app name. Defaults to `SyncFit by Synclat`.                      |
| `CYANITE_API_KEY`       |  Later   | Placeholder only — Cyanite is not implemented in V1.                    |

¹ _“Core” in the sense that they unlock live data. The app still runs fully in
demo mode without them._

The live **API Status** panel in the app shows, for judges, exactly which
providers are connected vs. running in demo/optional mode.

---

## Public GitHub submission checklist

- 🚫 Do **not** commit `.env.local`.
- 🚫 Do **not** commit API keys.
- 🚫 Do **not** commit proprietary API responses (lyrics, raw payloads).
- ✅ Keep the repo **public** for judging.
- ✅ Add a demo video or live demo URL to the submission.

`.gitignore` already excludes `.env*.local` and `/data/*.json`.

---

## 90-second demo script

> "Hi, this is SyncFit by Synclat. It helps music supervisors score how well a
> Latin track fits a creative brief. I enter a brief for a Colombian football
> commercial, search for a track using Musixmatch, and SyncFit generates a
> score, brand-safety notes, best-use cases, and a pitch-ready summary. Optional
> partner APIs can add market signal and audio readiness. SyncFit helps Synclat
> move from catalog search to intelligent sync recommendations."

See [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) for the full walkthrough and
[`ARCHITECTURE.md`](./ARCHITECTURE.md) for the data flow.

---

## Project structure

```
SyncFit/
├── app/
│   ├── layout.tsx              # Sidebar + Topbar shell, fonts, theme
│   ├── page.tsx                # Home / Dashboard
│   ├── analyzer/page.tsx       # SyncFit Analyzer (main product screen)
│   ├── report/page.tsx         # Saved reports list
│   ├── report/[id]/page.tsx    # Single report / export pitch card
│   └── api/
│       ├── search/route.ts     # Musixmatch search (server-side)
│       ├── analyze/route.ts    # Full SyncFit analysis (server-side)
│       ├── status/route.ts     # API status (presence only)
│       └── reports/…           # List / fetch saved reports
├── components/                 # Sidebar, Topbar, BriefForm, TrackSearchCard,
│                               # SyncFitScoreGauge, ScoreBreakdown,
│                               # BrandSafetyCard, PitchSummaryCard,
│                               # SuggestedAlternatives, ReportCard, ApiStatusBadge…
├── lib/
│   ├── api/                    # musixmatch, openrouter, songstats, lalal, cyanite
│   ├── prompts/syncfitPrompt.ts
│   ├── scoring.ts              # score model + demo heuristic
│   ├── analyze.ts              # orchestration
│   ├── storage.ts              # local JSON report store (compliance-safe)
│   ├── demo.ts                 # demo tracks
│   ├── env.ts                  # env + API status helpers
│   └── types.ts                # shared TypeScript types
└── data/                       # local report store (gitignored)
```

---

_SyncFit by Synclat — built for the Musixmatch Musicathon._
