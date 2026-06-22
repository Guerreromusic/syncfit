# SyncFit by Synclat

**Score, explain, and pitch tracks for global sync.**

SyncFit is a worldwide music-sync research platform. It helps music supervisors and sync teams instantly understand whether a track fits a creative brief for **film, TV, ads, games, trailers, and branded content** — and turns that analysis into a beautiful, shareable pitch.

Built for the **Musixmatch Musicathon**. Musixmatch is the core music-data layer, used in real time only — never stored or redistributed.

> **Live at [syncfit-fawn.vercel.app](https://syncfit-fawn.vercel.app)**

> **Runs with zero API keys.** Every surface falls back to clearly-labeled demo mode so the app works end-to-end out of the box. Add keys to go live.

---

## What it does

SyncFit turns a creative brief into intelligent, explainable sync recommendations. You work in an **LLM-style Research console** — describe what you need in plain language and get scored results back in the same chat.

There are **four ways to give SyncFit a brief**:

- ⌨️ **Type** a placement description ("upbeat summer ad, stadium energy, family-friendly").
- 🎙️ **Speak** it — built-in voice dictation in English and 12 major languages (Español, Português, Français, Deutsch, Italiano, 中文, 日本語, 한국어, हिन्दी, العربية, Русский).
- 🔗 **Paste a Spotify link** to score that exact song.
- 📎 **Attach a PDF or Word brief** — SyncFit extracts the text and reads it.

…and **two things can happen**:

1. **Describe a placement → discover tracks.** SyncFit surfaces the **10 best-fitting tracks** worldwide, each with a quick fit score. Refresh for 10 more, ⭐ star the ones you like, or send one straight to a full score.
2. **Name or link a track → score it.** SyncFit pulls real metadata, runs the analysis, and returns a complete **Score Report**.

Scores are **deterministic and permanent** — the same track + brief always returns the same number, and once saved the score never changes (`temperature: 0, seed: 7` + report reuse).

---

## The SyncFit Score (/100)

Every track is scored 0–100 against the brief with a transparent breakdown:

| Category              | Weight |
| --------------------- | -----: |
| Brief Match           |     25 |
| Lyric & Context Fit   |     20 |
| Mood / Energy Fit     |     15 |
| Brand Safety          |     15 |
| License Readiness     |     10 |
| Market Signal         |     10 |
| Production Fit        |      5 |
| **Total**             | **100** |

---

## What's in a Score Report

Each report is a polished export-style card you can hand to a client:

- **SyncFit Score** with the 7-part breakdown above.
- **Campaign Banner** — generate a Higgsfield AI image tailored to the brand, brief, mood, and genre with one click. One per report, permanently saved.
- **Brand-safety read** — risk level + supervisor notes.
- **Pitch summary** — a ready-to-send paragraph for the placement.
- **Lyric translation & context** — a short Musixmatch context translated into any language (never full lyrics, never stored).
- **Brand DNA** — the brands and placement types the track fits, with logos.
- **Worldwide influence map** — a real d3-geo world map showing where the track resonates and why.
- **Audience demographics** — age distribution bars, appeal points, cultural/faith resonance (AI-estimated, anchored on Musixmatch language/genre).
- **Market spend by age** — per-capita ad-spend index and resonance across age bands (18–24 … 55+), the primary demo, total addressable market, and best verticals (OpenRouter).
- **Credits** — writers, producers, and label (MusicBrainz, keyless).
- **Streaming & popularity** signals (Songstats / Spotify).
- An **Ask AI** box to interrogate the result in plain language.

Reports can be renamed, archived/restored, and **pitched or shared**.

---

## Pitch system

Every score report can become a pitch:

1. **Generate a campaign banner** — one click on the report page triggers Higgsfield to generate a cinematic 16:9 marketing visual based on the brand, mood, brief, and genre. The image is stored permanently on the report.
2. **Open the Pitch page** — a beautiful themed page driven by the brief's mood (Energetic → orange, Luxury → gold, Emotional → purple, etc.). The Higgsfield banner fills the hero, followed by the full score breakdown, credits, worldwide map, and demographics.
3. **Share it** — the public `/share/[token]` link shows the complete pitch with hero banner, score badge, all analytics cards, and the mood-derived theme — no login required. The creative brief text is hidden; everything else is visible.

---

## Read Aloud (TTS)

**Read Aloud** powered by **ElevenLabs** is available on every pitch summary and result — tap the speaker icon to have the Synclat-generated pitch or result narrated, with an inline play/pause and progress bar. Only Synclat-generated text is ever sent for narration — never lyrics.

---

## In-app playback

Every track plays **inside SyncFit** — you never get bounced to Spotify.

- **30-second previews for everyone** — keyless, resolved via Deezer → iTunes and streamed same-origin through a proxy.
- **Full tracks (optional)** — connect Spotify Premium once and the footer player streams the complete song via the Web Playback SDK.

The player is **draggable**, never autoplays, and pauses on navigation.

---

## Live Audience (public analytics)

The Dashboard carries a real-time, public visitor board — anonymous, no personal data stored:

- **Online now / Today / Avg session** — live counts and average time on the platform.
- Every visitor is rendered as a **cartoon sound puzzle piece** with a generated **musical name** (e.g. "Synced Bassline"), their **city + country** (from IP geo), current page, and time online.
- **24-hour activity** bar chart, a **most-visited pages** chart, and a running **session log** table.
- Session time is bounded to the real first-seen→last-seen span, and internal/removed routes are filtered out. Updates every 30 s.

---

## The product, section by section

| Section | What it does |
|---|---|
| **Research** | LLM-style console — type, speak, link, or attach a brief |
| **Dashboard** | Trending music worldwide, your stats, recent reports, and the live public audience board |
| **Starred** | Playlist-style view of starred tracks — play or send back to score |
| **Score Reports** | Every saved evaluation, searchable, with archive + share |
| **Projects** | Pitch a single track or bundle several into a swipeable, shareable multi-track pitch project |
| **Track Arena** | Benchmark up to 3 tracks head-to-head against one brief |
| **How it works** | Platform explainer and API guide |
| **Settings** | Live API connection status and data policy |

---

## Built with

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript + Tailwind CSS v3 |
| Core music data | **Musixmatch API** — search, metadata, explicit flag, short lyric context & translation |
| AI reasoning | **OpenRouter** (`openai/gpt-5-mini` default) — SyncFit analysis, demographics, geo-influence |
| Voice AI | **ElevenLabs** — TTS read-aloud (narrates pitches & results) |
| Campaign banners | **Higgsfield** — AI-generated cinematic marketing visuals (`nano_banana_pro` model) |
| Market signals | **Songstats** — streaming data, Shazam counts, playlist reach |
| Full-track playback | **Spotify** — Web Playback SDK (Premium) + metadata via Client Credentials |
| Credits | **MusicBrainz** — writers / producers / label (keyless) |
| Preview audio | **Deezer / iTunes** — keyless 30s previews + cover art |
| Influence map | **d3-geo + world-atlas** — real SVG world map |
| Storage | **Vercel Blob** (prod) or local JSON file (dev) |
| Dictation | Web Speech API — keyless, multi-language |
| Deployment | Vercel (edge-compatible, `maxDuration: 60`) |

---

## Hackathon & lyric compliance

> **SyncFit uses the Musixmatch API meaningfully** for track search, metadata, explicit/content indicators, short lyric context & translation, and genre/language anchoring for demographics.

**Lyric & content policy — enforced in code:**

- ✅ Uses Musixmatch data in **real time only** (`cache: "no-store"`).
- 🚫 Never stores, caches, displays, or redistributes **full lyrics** — only a short in-memory context string used for analysis/translation.
- ✅ Stores **only** Synclat-generated summaries, scores, the brief, basic title/artist metadata, and timestamps.
- ✅ API keys are server-side only and never reach the browser.

Where enforced: `lib/api/musixmatch.ts` (short context, never cached), `lib/storage.ts → toSavedReport()` (drops `lyricsContext` by construction), and `.gitignore` (ignores `.env*.local` and the local data store).

---

## Security & privacy

- All provider keys are **server-side only**; the browser only ever receives a short-lived Spotify *user* token.
- Public share links use **cryptographically-random** tokens; archiving revokes the link.
- The Spotify link expander and audio proxy are **host-allowlisted** (SSRF-hardened).
- Public share pages expose **only** scores and summaries — never the private brief or any keys.

---

## Local setup

```bash
npm install
cp .env.example .env.local   # optional — the app runs with no keys
npm run dev
```

Open <http://localhost:3000>. With no keys, every surface is in clearly-labeled demo mode.

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

---

## Environment variables

| Variable | Required | Purpose |
|---|:---:|---|
| `MUSIXMATCH_API_KEY` | Core¹ | Track search, metadata, lyric context |
| `OPENROUTER_API_KEY` | Core¹ | AI analysis, demographics, geo-influence |
| `ELEVENLABS_API_KEY` | Optional | TTS read-aloud (narrates pitches & results) |
| `HIGGSFIELD_API_KEY` | Optional | AI campaign banner generation on pitches |
| `SONGSTATS_API_KEY` | Optional | Market signal + worldwide trending |
| `SPOTIFY_CLIENT_ID` | Optional | Metadata + full-track playback |
| `SPOTIFY_CLIENT_SECRET` | Optional | Pairs with client ID (server-side only) |
| `BLOB_READ_WRITE_TOKEN` | Optional | Durable Vercel Blob storage |
| `NEXT_PUBLIC_APP_NAME` | Optional | App name (default: `SyncFit by Synclat`) |

¹ _"Core" = unlocks live data. The app still runs fully in demo mode without them._

The live **Settings → API Status** panel shows which providers are connected vs. in demo/optional mode.

### Enabling Higgsfield campaign banners

1. Add `HIGGSFIELD_API_KEY` to your environment variables (Vercel dashboard → Settings → Environment Variables).
2. The **Generate banner** button appears on every score report page. One click → Higgsfield generates a cinematic 16:9 image → stored on the report → shown as the hero on the pitch page and public share link.

### Enabling full-track playback (Spotify Premium)

1. Set `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`.
2. In your Spotify app dashboard → **Edit Settings → Redirect URIs**, add:
   - `http://127.0.0.1:3000/api/spotify/callback` (local dev — use `127.0.0.1`, not `localhost`)
   - `https://<your-domain>/api/spotify/callback` (production)
3. In the app, click **Connect Spotify** in the footer player. Listeners need Spotify Premium; everyone else keeps the 30s preview.

---

## Project structure

```
SyncFit/
├── app/
│   ├── layout.tsx                 # Sidebar + Topbar shell, PlayerProvider
│   ├── page.tsx                   # Dashboard — trending, stats, recent reports
│   ├── analyzer/page.tsx          # Research console (chat + mic dictation + attach)
│   ├── report/[id]/page.tsx       # Score report — banner gen button + full analysis
│   ├── projects/…                 # Projects board/list + pitch pages
│   ├── arena/page.tsx             # Track Arena (head-to-head, up to 3 tracks)
│   ├── starred/page.tsx           # Starred tracks — playlist-style UI
│   ├── share/[token]/page.tsx     # Public pitch share — full themed pitch page
│   └── api/
│       ├── analyze · ask · discover · section-chat
│       ├── banner/                # Higgsfield campaign banner generation
│       ├── demographics/          # AI audience analytics (OpenRouter + Musixmatch)
│       ├── geo-influence/         # Worldwide influence map (OpenRouter)
│       ├── lyrics · brand-dna · credits
│       ├── analytics/session/      # Live Audience visitor tracking (public)
│       ├── preview/ · preview/audio/   # Deezer/iTunes 30s proxy
│       ├── spotify/{login,callback,token,logout}  # Full-track OAuth + SDK
│       ├── tts                    # ElevenLabs read-aloud TTS
│       └── reports/ · pitch-projects/ · trending · status · extract
├── components/
│   ├── ResearchChat.tsx           # LLM console — research + Q&A + deploy
│   ├── PitchView.tsx              # Full pitch — score breakdown, credits, map, demographics
│   ├── PitchCard.tsx              # Single-track pitch card (used in projects + share)
│   ├── CampaignBanner.tsx         # Higgsfield banner hero component
│   ├── GenerateBannerButton.tsx   # One-click Higgsfield banner generation
│   ├── GeoInfluenceCard.tsx       # d3-geo world influence map
│   ├── DemographicsCard.tsx       # Age bands + faith resonance + appeal
│   ├── MarketSpendCard.tsx        # Per-capita ad-spend index by age band
│   ├── LiveAudienceSection.tsx    # Dashboard public visitor board
│   ├── AnalyticsTracker.tsx       # Anonymous page/session heartbeat
│   ├── ReadAloud.tsx              # ElevenLabs TTS read-aloud player
│   ├── Sidebar.tsx                # Desktop nav (with research-pulse badge)
│   ├── Topbar.tsx                 # Mobile nav (with research-pulse badge)
│   └── …
├── lib/
│   ├── api/                       # musixmatch, openrouter, songstats, spotify,
│   │                              # deezer, itunes, musicbrainz
│   ├── analyze.ts · discover.ts · scoring.ts · storage.ts
│   ├── pitch-theme.ts             # Mood → accent color theme system
│   ├── research-state.ts          # Module-level research pulse (no provider needed)
│   └── types.ts · models.ts · env.ts · keys.ts · scoreColor.ts
└── data/                          # Local report store (gitignored in prod)
```

---

_SyncFit by Synclat — built for the Musixmatch Musicathon._
