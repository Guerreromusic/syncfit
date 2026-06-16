# Submission — SyncFit by Synclat

## Project title

**SyncFit by Synclat**

## One-liner

SyncFit helps music supervisors instantly understand whether a Latin track fits
a creative brief for film, TV, ads, games, and branded content.

## Description

SyncFit is an AI-powered **sync-fit engine for Latin music**. It helps music
supervisors, agencies, brands, and the Synclat team understand how well a song
fits a creative brief for film, TV, advertising, games, trailers, and social
campaigns.

A user enters a music brief and selects or searches for a track. SyncFit then
generates a clear result card with:

- **SyncFit Score** (0–100) with a transparent weighted breakdown
- **Lyric & context fit** (from Musixmatch, real-time, no full lyrics)
- **Brand safety** notes and a Low / Medium / High read
- **Best use** cases tailored to the project type and mood
- **Mood / energy** interpretation
- **Market signal** (if Songstats is configured)
- **Audio readiness** (if LALAL.AI is configured)
- A **pitch-ready summary** and supervisor notes
- **Suggested alternatives**

The result is rendered as a polished, export-style pitch card and saved locally
as a shareable report (scores and summaries only — never lyrics).

## APIs used

| API            | Role                          | Status in V1                |
| -------------- | ----------------------------- | --------------------------- |
| **Musixmatch** | Required music data layer     | Implemented (real-time)     |
| **OpenRouter** | AI reasoning layer            | Implemented                 |
| Songstats      | Market signal (optional)      | Implemented (graceful stub) |
| LALAL.AI       | Audio readiness (optional)    | Implemented (graceful stub) |
| Cyanite        | Advanced sonic tagging        | Planned (not in V1)         |

The app is fully functional with **no keys** via clearly-labeled demo mode, so
judges can evaluate it immediately.

## How Musixmatch is used (meaningfully)

Musixmatch is the **required, central music data layer**. SyncFit uses it for:

- **Track search / matching** — `searchTrack({ title, artist })`
- **Artist & song metadata** — `getTrackMetadata(trackId)` (title, artist,
  album, genre, explicit flag)
- **Lyric context** — `getTrackLyricsContext(trackId)` returns only a **short,
  non-reproducible context snippet** used in-memory by the analysis layer
- **Explicit / content indicators** — fed directly into the Brand Safety score
- **Language / lyric-language context** — informs Lyric & Context Fit

**Compliance is enforced in code:** responses are fetched with `cache: "no-store"`,
any returned text is truncated by `toShortContext()`, and the saved-report mapper
(`toSavedReport()`) drops the lyric context entirely. Full lyrics are never
stored, cached, displayed, or committed.

## What problem it solves

Music supervisors and agencies sift through huge Latin catalogs by hand to find
tracks that fit a brief. It's slow, subjective, and hard to justify to clients.
SyncFit replaces "search and gut-feel" with an explainable, scored
recommendation: a number, a breakdown, brand-safety flags, and a pitch summary —
in seconds.

## Why it matters

Latin music is one of the fastest-growing categories in global sync, but tooling
is built around English-language catalogs. SyncFit gives Synclat a defensible,
AI-assisted way to move **from catalog search to intelligent sync
recommendations** — pitching the right Latin track, for the right brief, with
the right justification, faster than anyone doing it manually.

## Future roadmap

- **Cyanite** integration for advanced sonic tagging (mood, genre, energy,
  tempo, instrumentation) and similarity-based alternatives.
- Full **LALAL.AI** stem analysis (async upload + poll) for true dialogue/bed
  readiness.
- Deeper **Songstats** market analytics (territory-level momentum, playlists).
- Catalog ingestion + batch scoring against a saved brief.
- Team workspaces, shareable client-facing pitch links, and export to PDF.
- Persisted database (Postgres) for multi-user, multi-tenant Synclat usage.

---

_See [`README.md`](./README.md) for setup and [`ARCHITECTURE.md`](./ARCHITECTURE.md)
for the data flow._
