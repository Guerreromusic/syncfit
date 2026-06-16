# Demo Script — SyncFit by Synclat

## 90-second pitch (read aloud)

> "Hi, this is **SyncFit by Synclat**. It helps music supervisors score how well
> a Latin track fits a creative brief. I enter a brief for a Colombian football
> commercial, search for a track using **Musixmatch**, and SyncFit generates a
> score, brand-safety notes, best-use cases, and a pitch-ready summary. Optional
> partner APIs can add **market signal** and **audio readiness**. SyncFit helps
> Synclat move from catalog search to intelligent sync recommendations."

---

## Step-by-step walkthrough (for recording)

**0:00 — Dashboard (`/`)**
- Show the hero: "SyncFit by Synclat — Score, explain, and pitch Latin tracks for
  global sync."
- Point at the three feature cards: Lyric & Context Fit, Brand Safety,
  Pitch-Ready Summary.
- Point at the **API Status** panel — "everything routes through secure server
  routes; missing keys fall back to clearly-labeled demo mode."
- Click **Run SyncFit**.

**0:20 — Analyzer (`/analyzer`): enter the brief**
- Brief: _"30-second spot for a Colombian football brand — energetic,
  celebratory, stadium-crowd feel, family-friendly."_
- Project type: **Ad** · Region: **Colombia** · Mood: **Celebration** ·
  Language: **Spanish** · Brand safety: **Medium** · License tier: **Micro**.

**0:40 — Add the track**
- Type a song title (e.g. _"La Noche Latina"_) and optional artist. No separate
  search step — SyncFit finds it on Musixmatch as part of the run.

**0:55 — Run SyncFit (one step)**
- Click **Run SyncFit** once. A friendly loader narrates the single process
  (looking up the track on Musixmatch → reading its context → scoring with AI).
  (If no Musixmatch key is set, the "Demo data" badge appears — call this out as
  honest demo mode.)
- The right column fills in:
  - **SyncFit Score** gauge (0–100) and label.
  - **Score Breakdown** across the seven weighted categories.
  - **Pitch Summary**, **Best Use**, and **Supervisor Notes**.
  - **Brand Safety** read.
  - **Partner Signals** (market signal + audio readiness, with clear
    "not configured" notes if optional keys are missing).
  - **Suggested Alternatives**.

**1:15 — Open the full report**
- Click **Open full report** → `/report/[id]`.
- Show the export-style **pitch card**: track info, brief, score, breakdown,
  pitch, brand-safety notes, and recommended use cases.

**1:25 — Compliance close**
- "SyncFit uses Musixmatch in real time only. It never stores or displays full
  lyrics — saved reports contain only Synclat-generated scores and summaries."

---

## Tips for a clean recording

- Run with **no keys** first to show demo mode works, then (optionally) add keys
  to `.env.local` and restart to show live Musixmatch + OpenRouter.
- The **API Status** panel is the best single shot to explain the architecture
  to judges.
- Keep the brief specific — specific briefs produce more convincing scores.
