# Architecture — SyncFit by Synclat

## Data flow

```txt
Creative Brief
   ↓
Musixmatch API
   ↓
Optional Partner APIs: Songstats / LALAL.AI
   ↓
OpenRouter AI Reasoning
   ↓
SyncFit Score + Pitch Summary
   ↓
Report Card / Demo Output
```

## How it fits together

```txt
┌──────────────────────────────────────────────────────────────────────┐
│ Browser (client components)                                            │
│   Dashboard (/)   ·   Analyzer (/analyzer)   ·   Report (/report/[id]) │
│   BriefForm · TrackInputCard · ModelSwitch · ScoreGauge · ...          │
└───────────────┬───────────────────────────────────────────────────────┘
                │  fetch() — JSON only, never API keys
                ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Next.js server routes (app/api/*)   ← all keys live here, server-side  │
│   /api/analyze   → one request: Musixmatch lookup + AI (lib/analyze.ts)│
│   /api/search    → Musixmatch search (helper; lookup now runs in       │
│                    /api/analyze, so the UI no longer calls this)        │
│   /api/status    → API key presence only (never values)               │
│   /api/reports   → local JSON report store                            │
└───────────────┬───────────────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Adapters (lib/api/*)                                                   │
│   musixmatch.ts  (required)  — search / metadata / SHORT lyric context │
│   songstats.ts   (optional)  — market signal, safe placeholder if off  │
│   lalal.ts       (optional)  — audio readiness, safe placeholder if off│
│   openrouter.ts  (AI)        — SyncFit analysis JSON (validated)       │
│   cyanite.ts     (planned)   — not implemented in V1                   │
└───────────────┬───────────────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Scoring + storage                                                      │
│   scoring.ts   — weighted model + transparent demo heuristic           │
│   prompts/syncfitPrompt.ts — system + user prompt for OpenRouter       │
│   storage.ts   — local JSON store; toSavedReport() drops lyric context │
└────────────────────────────────────────────────────────────────────────┘
```

## Request lifecycle (an analysis)

1. The **Analyzer** page collects the brief + track input and `POST`s to
   `/api/analyze` (with `save: true`).
2. `lib/analyze.ts` orchestrates:
   - Resolve the track via **Musixmatch** (`getTrackMetadata`) or demo data.
   - Pull a **short lyric context** in real time (`getTrackLyricsContext`) —
     truncated, never stored.
   - Fetch optional **Songstats** + **LALAL.AI** signals in parallel (safe
     placeholders if not configured).
   - Call **OpenRouter** (`runSyncFitAnalysis`) for the scored JSON analysis. If
     no key (or the call fails / returns invalid JSON), fall back to the local
     **heuristic** in `scoring.ts`.
3. The result is mapped via `toSavedReport()` (which **drops lyric context**) and
   written to `/data/reports.json`.
4. The client renders the result and links to `/report/[id]`.

## Scoring model (/100)

| Category            | Weight | Source signal                          |
| ------------------- | -----: | -------------------------------------- |
| Brief Match         |     25 | Brief + project/region/track metadata  |
| Lyric & Context Fit |     20 | Musixmatch language + short context     |
| Mood / Energy Fit   |     15 | Brief mood vs. genre/BPM/context        |
| Brand Safety        |     15 | Musixmatch explicit flag vs. brief level|
| License Readiness   |     10 | Chosen license tier                     |
| Market Signal       |     10 | Songstats (optional)                    |
| Audio Readiness     |      5 | LALAL.AI (optional)                     |

The AI produces the final score + breakdown; the UI always renders the weighted
categories so the number is explainable.

## Compliance boundaries (Musixmatch)

- **Real-time only:** all Musixmatch fetches use `cache: "no-store"`.
- **Short context only:** `toShortContext()` strips footers and hard-truncates.
- **Never persisted:** `SavedReport` has no lyrics field; `toSavedReport()` omits
  `lyricsContext` by construction.
- **Never displayed:** the UI shows scores, summaries, and metadata — not lyrics.
- **Never committed:** `.gitignore` excludes `.env*.local` and `/data/*.json`.

## Tech choices

- **Next.js App Router + server routes** keep every API key server-side; the
  browser only ever sees JSON results and presence booleans.
- **Custom Tailwind design system** (no UI-kit dependency) for a fast, premium,
  consistent dark dashboard.
- **Local JSON storage** keeps the MVP dependency-free and easy to deploy on
  Replit/Vercel; swappable for Postgres later.
