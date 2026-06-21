# SyncFit by Synclat

**Score, explain, and pitch tracks for global sync.**

SyncFit is a worldwide music-sync research tool. It helps music supervisors and
sync teams instantly understand whether a track fits a creative brief for
**film, TV, ads, games, trailers, and branded content** — and turns the answer
into a pitch-ready report.

Built for the **Musixmatch Musicathon**. Musixmatch is the core music-data
layer, used in real time only — never stored or redistributed.

> **Runs with zero API keys.** Every surface falls back to a clearly-labeled
> demo mode, so the whole app works end-to-end out of the box. Add keys to go
> live.

---

## What it does

SyncFit turns a creative brief into intelligent, explainable sync
recommendations. You work in an **LLM-style Research console** — describe what
you need in plain language and get scored results back in the same chat.

There are **four ways to give SyncFit a brief**:

- ⌨️ **Type** a placement description ("upbeat summer ad, stadium energy, family-friendly").
- 🎙️ **Speak** it — built-in voice dictation in **English and 12 of the world's most-used languages** (Español, Português, Français, Deutsch, Italiano, 中文, 日本語, 한국어, हिन्दी, العربية, Русский).
- 🔗 **Paste a Spotify link** to score that exact song.
- 📎 **Attach a PDF or Word brief** — SyncFit extracts the text and reads it.

…and **two things can happen**:

1. **Describe a placement → discover tracks.** SyncFit surfaces the **10
   best-fitting tracks** worldwide, each with a quick fit score. Refresh for 10
   more, ⭐ star the ones you like, or send one straight to a full score.
2. **Name or link a track → score it.** SyncFit pulls real metadata, runs the
   analysis, and returns a complete **Score Report**.

After a track is scored you can keep chatting — ask *why* it fits, how brand-safe
it is, or how it compares — and SyncFit answers in context.

---

## The SyncFit Score (/100)

Every track is scored 0–100 against the brief, with a transparent breakdown:

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

The score is produced by the AI reasoning layer (OpenRouter). In demo mode (no
key) a transparent local heuristic produces the same shape, so the app always
works end-to-end.

---

## What's in a Score Report

Each report is a polished, export-style card you can hand to a client:

- **SyncFit Score** with the 7-part breakdown above.
- **Brand-safety read** — risk level + supervisor notes.
- **Pitch summary** — a ready-to-send paragraph for the placement.
- **Lyric translation & context** — a *short* Musixmatch context translated into
  any language, with the phrases that match the brief highlighted (never full
  lyrics, never stored).
- **Brand DNA** — the brands and placement types the track fits, with logos.
- **Worldwide influence map** — where the track resonates globally and why.
- **Credits** — writers, producers, and label (MusicBrainz).
- **Streaming & popularity** signals (Songstats / Spotify).
- **Suggested alternatives** — similar real tracks you can deploy into Research
  with one click.
- An **Ask AI** box to interrogate the result in plain language.

Reports can be **renamed** (AI-generated brief name), **archived/restored**, and
**shared** via a private public link.

---

## In-app playback

Every track across the app plays **inside SyncFit** — you never get bounced to
Spotify.

- **30-second previews for everyone** — keyless, resolved by title + artist
  through Deezer → iTunes and streamed same-origin through a proxy, so any track
  is instantly playable with no login.
- **Full tracks (optional)** — connect **Spotify Premium** once and the footer
  player streams the **complete song** via the Spotify Web Playback SDK. Anyone
  without Premium simply keeps the 30s preview. (Full commercial playback always
  requires the listener's own Premium account — a licensing rule, not a limit.)

The player pauses on navigation, so nothing ever auto-plays onto a page you
didn't ask it to.

---

## The product, section by section

- **Research** — the LLM-style console described above (type / speak / link / attach).
- **Dashboard** — trending music worldwide, your stats, and recent reports.
- **Starred** — tracks you saved from research; play them or send one back to score.
- **Score reports** — every saved evaluation, searchable, with archive + share.
- **Projects** — pitch a single track, or bundle several into one **swipeable,
  shareable multi-track pitch project** with liquid-glass cards.
- **Track Arena** — benchmark **up to 3 tracks head-to-head** against one brief.
- **Per-section assistant** — a chat-bot on every page that answers questions
  about whatever section you're on.
- **Settings** — live API connection status and how your data is handled.

---

## Built with

- **Musixmatch API** — core data layer (search, metadata, explicit flag, short
  lyric context & translation).
- **OpenRouter** — AI reasoning (the SyncFit analysis). Default model
  `openai/gpt-5-mini` (with `gpt-5-nano` as a cheaper option).
- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS** — a custom
  warm dark, premium music-tech design system.
- **Spotify** — optional metadata fallback (Client Credentials) **and** optional
  full-track playback (Web Playback SDK, user OAuth + Premium).
- **Songstats** — optional market signal + worldwide trending data.
- **MusicBrainz** — keyless writer/producer/label credits.
- **Deezer / iTunes** — keyless 30s previews + cover art.
- **Web Speech API** — keyless multi-language voice dictation.
- **Vercel Blob** — optional durable storage (falls back to a local JSON file).

---

## Hackathon & lyric compliance

> **SyncFit uses the Musixmatch API meaningfully** for track search, metadata,
> explicit/content indicators, and short lyric context + translation.

**Lyric & content policy — enforced in code:**

- ✅ Uses Musixmatch data in **real time only** (`cache: "no-store"`).
- 🚫 Never stores, caches, displays, or redistributes **full lyrics** — only a
  short, in-memory context string used for analysis/translation.
- ✅ Stores **only** Synclat-generated summaries, scores, the brief, basic
  title/artist metadata, and timestamps.
- ✅ API keys are server-side only and never reach the browser.

Where it's enforced: `lib/api/musixmatch.ts` (short context, never cached),
`lib/storage.ts` → `toSavedReport()` (copies only safe fields, drops
`lyricsContext` by construction), and `.gitignore` (ignores `.env*.local` and
the local data store).

---

## Security & privacy

- All provider keys are **server-side only**; the browser only ever receives a
  short-lived Spotify *user* token (required by the playback SDK).
- Public share links use **cryptographically-random** tokens, and archiving a
  report/project **revokes** its link.
- The Spotify share-link expander and the audio proxy are **host-allowlisted**
  (SSRF-hardened); the audio proxy re-validates every redirect hop.
- Public share pages expose **only** scores and summaries — never the private
  brief or any keys.

---

## Local setup

```bash
npm install
cp .env.example .env.local   # optional — the app runs with no keys
npm run dev
```

Then open <http://localhost:3000>. With no keys set, every surface is in
clearly-labeled demo mode.

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
`NEXT_PUBLIC_APP_NAME` are **server-side only**.

| Variable                  | Required | Purpose                                                                 |
| ------------------------- | :------: | ----------------------------------------------------------------------- |
| `MUSIXMATCH_API_KEY`      |  Core¹   | Track search, metadata, explicit flag, short lyric context.             |
| `OPENROUTER_API_KEY`      |  Core¹   | AI reasoning layer that produces the SyncFit analysis.                  |
| `OPENROUTER_MODEL`        | Optional | Override the default model (`openai/gpt-5-mini`).                        |
| `SONGSTATS_API_KEY`       | Optional | Market signal + worldwide trending data.                                |
| `SPOTIFY_CLIENT_ID`       | Optional | Metadata fallback **and** full-track playback (see below).              |
| `SPOTIFY_CLIENT_SECRET`   | Optional | Pairs with the client id (server-side only).                            |
| `BLOB_READ_WRITE_TOKEN`   | Optional | Durable Vercel Blob storage (else a local JSON file is used).           |
| `NEXT_PUBLIC_APP_NAME`    | Optional | Public app name. Defaults to `SyncFit by Synclat`.                      |

¹ _“Core” = unlocks live data. The app still runs fully in demo mode without them._

The live **Settings → API Status** panel shows exactly which providers are
connected vs. running in demo/optional mode.

### Enabling full-track playback (Spotify Premium)

1. Set `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`.
2. In your Spotify app dashboard → **Edit Settings → Redirect URIs**, add the URLs
   the app is served from:
   - `http://127.0.0.1:3000/api/spotify/callback` (local dev — use `127.0.0.1`, **not** `localhost`)
   - `https://<your-domain>/api/spotify/callback` (production)
3. In the app, click **Connect Spotify** in the footer player. Listeners need
   **Spotify Premium**; everyone else keeps the 30s preview.

---

## Project structure

```
SyncFit/
├── app/
│   ├── layout.tsx                 # Sidebar + Topbar shell, theme, player provider
│   ├── page.tsx                   # Dashboard
│   ├── analyzer/page.tsx          # Research console (chat + voice + attach)
│   ├── report/[id]/page.tsx       # Score report / export card
│   ├── projects/…                 # Pitch projects (single + multi-track)
│   ├── arena/page.tsx             # Track Arena (head-to-head)
│   ├── starred/ · settings/ · info/
│   ├── share/…                    # Public report / project share pages
│   └── api/
│       ├── analyze · ask · section-chat · lyrics · brand-dna · geo-influence
│       ├── preview/ · preview/audio/   # keyless 30s preview + streaming proxy
│       ├── spotify/{login,callback,token,logout,uri}  # full-track OAuth + SDK
│       ├── reports/ · pitch-projects/ · trending · status · extract
├── components/                    # Player, ResearchChat, MicDictation, ReportCard,
│                                  # PitchCard, ProjectPitchView, SectionChat, …
├── lib/
│   ├── api/                       # musixmatch, openrouter, songstats, spotify,
│   │                              # spotifyUser, deezer, itunes, musicbrainz
│   ├── analyze.ts · discover.ts · scoring.ts · storage.ts
│   ├── prompts/ · models.ts · env.ts · types.ts · keys.ts · scoreColor.ts
└── data/                          # local report store (gitignored)
```

---

_SyncFit by Synclat — built for the Musixmatch Musicathon._
