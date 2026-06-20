// =============================================================================
// SyncFit by Synclat — local demo report storage (server-side, JSON file)
// =============================================================================
// A deliberately lightweight, dependency-free store for DEMO/evaluation only.
// Reports are written to /data/reports.json (gitignored).
//
// COMPLIANCE — what we store and what we DON'T:
//   STORE:    brief text, track title/artist + basic metadata, generated scores,
//             generated summaries, timestamp, demo result id.
//   NEVER:    full lyrics, lyric context snippets, raw Musixmatch API responses,
//             API keys, or any restricted proprietary API content.
// The toSavedReport() mapper below enforces this by construction — it copies
// only the safe fields and drops `lyricsContext` entirely.
// =============================================================================

import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { list, put, del } from "@vercel/blob";
import type { AnalyzeResult, Brief, PitchProject, SavedReport } from "./types";

// -----------------------------------------------------------------------------
// Storage backend selection
// -----------------------------------------------------------------------------
// DURABLE (Vercel Blob): used whenever BLOB_READ_WRITE_TOKEN is set — i.e. on the
// deployed site (and locally if the token is present). Reports survive across
// serverless instances and cold starts, unlike the per-instance /tmp.
// LOCAL FILE: the dependency-light default for local dev with no Blob token.
//
// COMPLIANCE — what we store and what we DON'T: brief text, track title/artist +
// basic metadata, scores, summaries, timestamp. NEVER full lyrics, lyric context,
// raw API responses, or API keys. toSavedReport() enforces this by construction.
const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
// Vercel Blob enforces a 60s minimum CDN cache on public reads, so a FIXED url
// would serve stale data after a write (lost-update + invisible-report bugs).
// Instead each save writes an IMMUTABLE snapshot under this prefix and reads pick
// the newest by upload time — a fresh, never-overwritten url every time.
const REPORTS_PREFIX = "reports-snap/";

// Local file fallback (project dir locally; OS temp on a Vercel box with no Blob).
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "syncfit")
  : path.join(process.cwd(), "data");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");

/** Newest-first list of snapshot blobs (most recent upload first). */
async function listSnapshots() {
  const { blobs } = await list({ prefix: REPORTS_PREFIX });
  return blobs.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  );
}

async function blobReadAll(): Promise<SavedReport[]> {
  try {
    const snaps = await listSnapshots();
    if (!snaps.length) return [];
    // Newest snapshot is an immutable url → never a stale cached overwrite.
    const res = await fetch(snaps[0].url, { cache: "no-store" });
    if (!res.ok) return [];
    const parsed = await res.json();
    return Array.isArray(parsed) ? (parsed as SavedReport[]) : [];
  } catch {
    return [];
  }
}

async function blobWriteAll(reports: SavedReport[]): Promise<void> {
  try {
    // New immutable snapshot of the FULL list each write (random suffix => unique
    // url, so reads are always fresh despite the CDN's 60s public-read cache).
    await put(`${REPORTS_PREFIX}reports.json`, JSON.stringify(reports), {
      access: "public",
      addRandomSuffix: true,
      contentType: "application/json",
    });
    // Best-effort prune: keep only the newest few snapshots.
    const snaps = await listSnapshots();
    const stale = snaps.slice(3);
    if (stale.length) await del(stale.map((b) => b.url));
  } catch {
    /* best-effort — never 500 a route on a storage hiccup */
  }
}

async function fileReadAll(): Promise<SavedReport[]> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(REPORTS_FILE, "utf8").catch(() => "[]");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedReport[]) : [];
  } catch {
    return [];
  }
}

async function fileWriteAll(reports: SavedReport[]): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(REPORTS_FILE, JSON.stringify(reports, null, 2), "utf8");
  } catch {
    /* ignore — ephemeral demo storage */
  }
}

// Resilient by design: any error yields an empty list / silent write so listing
// or saving reports never 500s a page.
async function readAll(): Promise<SavedReport[]> {
  return USE_BLOB ? blobReadAll() : fileReadAll();
}

async function writeAll(reports: SavedReport[]): Promise<void> {
  return USE_BLOB ? blobWriteAll(reports) : fileWriteAll(reports);
}

// -----------------------------------------------------------------------------
// Pitch PROJECTS store — a parallel store (separate prefix/file) for named
// bundles of reports. Same blob-snapshot / local-file strategy as reports.
// -----------------------------------------------------------------------------
const PROJECTS_PREFIX = "pitch-projects-snap/";
const PROJECTS_FILE = path.join(DATA_DIR, "pitch-projects.json");

async function listProjectSnapshots() {
  const { blobs } = await list({ prefix: PROJECTS_PREFIX });
  return blobs.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  );
}

async function readAllProjects(): Promise<PitchProject[]> {
  if (USE_BLOB) {
    try {
      const snaps = await listProjectSnapshots();
      if (!snaps.length) return [];
      const res = await fetch(snaps[0].url, { cache: "no-store" });
      if (!res.ok) return [];
      const parsed = await res.json();
      return Array.isArray(parsed) ? (parsed as PitchProject[]) : [];
    } catch {
      return [];
    }
  }
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(PROJECTS_FILE, "utf8").catch(() => "[]");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PitchProject[]) : [];
  } catch {
    return [];
  }
}

async function writeAllProjects(projects: PitchProject[]): Promise<void> {
  if (USE_BLOB) {
    try {
      await put(`${PROJECTS_PREFIX}projects.json`, JSON.stringify(projects), {
        access: "public",
        addRandomSuffix: true,
        contentType: "application/json",
      });
      const snaps = await listProjectSnapshots();
      const stale = snaps.slice(3);
      if (stale.length) await del(stale.map((b) => b.url));
    } catch {
      /* best-effort */
    }
    return;
  }
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf8");
  } catch {
    /* ignore — ephemeral demo storage */
  }
}

/** Short, URL-safe id. */
function makeId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `sf_${Date.now().toString(36)}${rand}`;
}

/** Short, URL-safe, hard-to-guess token for a public pitch-share link. */
function makeShareToken(): string {
  const a = Math.random().toString(36).slice(2, 10);
  const b = Math.random().toString(36).slice(2, 10);
  return `pt_${a}${b}`;
}

/**
 * Map an in-memory AnalyzeResult to a compliance-safe SavedReport.
 * NOTE: `track.lyricsContext` is intentionally NOT copied here.
 */
export function toSavedReport(brief: Brief, result: AnalyzeResult): SavedReport {
  return {
    id: makeId(),
    createdAt: new Date().toISOString(),
    archived: false,
    name: result.analysis.briefName?.trim() || result.track.title,
    brief,
    track: {
      trackId: result.track.trackId,
      title: result.track.title,
      artist: result.track.artist,
      language: result.track.language,
      bpm: result.track.bpm,
      explicit: result.track.explicit,
      genre: result.track.genre,
      popularity: result.track.popularity,
      durationSec: result.track.durationSec,
      instrumental: result.track.instrumental,
      isrc: result.track.isrc,
      favourites: result.track.favourites,
      hasLyrics: result.track.hasLyrics,
      hasSubtitles: result.track.hasSubtitles,
      hasRichsync: result.track.hasRichsync,
      mood: result.track.mood,
      credits: result.track.credits,
      source: result.track.source,
      // lyricsContext deliberately omitted — never persisted.
    },
    analysis: result.analysis,
    marketSignal: result.marketSignal,
    audioReadiness: result.audioReadiness,
    usedDemoData: result.usedDemoData,
  };
}

// Serialize read-modify-write so two overlapping saves can't read the same
// snapshot and clobber each other (the file rewrite is not atomic). In-process
// mutex; adequate for the single-node demo store.
let writeChain: Promise<unknown> = Promise.resolve();

export async function saveReport(report: SavedReport): Promise<SavedReport> {
  const run = writeChain.then(async () => {
    const all = await readAll();
    all.unshift(report); // newest first
    // Keep the demo store small.
    await writeAll(all.slice(0, 100));
    return report;
  });
  // Keep the chain alive even if this write rejects.
  writeChain = run.catch(() => undefined);
  return run;
}

export async function getReport(id: string): Promise<SavedReport | null> {
  const all = await readAll();
  return all.find((r) => r.id === id) ?? null;
}

/** Archive or restore a report. Serialized via the same write mutex. */
export async function setReportArchived(
  id: string,
  archived: boolean,
): Promise<SavedReport | null> {
  const run = writeChain.then(async () => {
    const all = await readAll();
    const idx = all.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], archived };
    await writeAll(all);
    return all[idx];
  });
  writeChain = run.catch(() => undefined);
  return run;
}

/** Rename a report (the editable AI-generated brief name). Serialized via the
 * same write mutex. Empty names fall back to the track title. */
export async function setReportName(
  id: string,
  name: string,
): Promise<SavedReport | null> {
  const run = writeChain.then(async () => {
    const all = await readAll();
    const idx = all.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    const clean = name.trim().slice(0, 80) || all[idx].track.title;
    all[idx] = { ...all[idx], name: clean };
    await writeAll(all);
    return all[idx];
  });
  writeChain = run.catch(() => undefined);
  return run;
}

export async function listReports(): Promise<SavedReport[]> {
  return readAll();
}

/** Permanently delete a report and scrub its id from every project (dropping
 * any project left with no tracks). */
export async function deleteReport(id: string): Promise<void> {
  const run = writeChain.then(async () => {
    const all = await readAll();
    await writeAll(all.filter((r) => r.id !== id));
    const projects = await readAllProjects();
    let changed = false;
    const cleaned = projects
      .map((p) => {
        if (!p.reportIds.includes(id)) return p;
        changed = true;
        return { ...p, reportIds: p.reportIds.filter((rid) => rid !== id) };
      })
      .filter((p) => p.reportIds.length > 0);
    if (changed || cleaned.length !== projects.length) {
      await writeAllProjects(cleaned);
    }
  });
  writeChain = run.catch(() => undefined);
  await run;
}

// ---- Pitch projects ---------------------------------------------------------

export async function listProjects(): Promise<PitchProject[]> {
  return readAllProjects();
}

export async function getProject(id: string): Promise<PitchProject | null> {
  const all = await readAllProjects();
  return all.find((p) => p.id === id) ?? null;
}

/** Create a named project bundling the given report ids (order preserved). */
export async function createProject(
  name: string,
  reportIds: string[],
): Promise<PitchProject> {
  const project: PitchProject = {
    id: makeId(),
    createdAt: new Date().toISOString(),
    name: name.trim().slice(0, 80) || "Untitled pitch",
    reportIds: [...new Set(reportIds)].slice(0, 12),
  };
  const run = writeChain.then(async () => {
    const all = await readAllProjects();
    all.unshift(project);
    await writeAllProjects(all.slice(0, 100));
    return project;
  });
  writeChain = run.catch(() => undefined);
  return run;
}

export async function deleteProject(id: string): Promise<void> {
  const run = writeChain.then(async () => {
    const all = await readAllProjects();
    await writeAllProjects(all.filter((p) => p.id !== id));
  });
  writeChain = run.catch(() => undefined);
  await run;
}

/** Archive or restore a project. */
export async function setProjectArchived(
  id: string,
  archived: boolean,
): Promise<PitchProject | null> {
  const run = writeChain.then(async () => {
    const all = await readAllProjects();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], archived };
    await writeAllProjects(all);
    return all[idx];
  });
  writeChain = run.catch(() => undefined);
  return run;
}

/** Rename a project. Empty names fall back to "Untitled pitch". */
export async function setProjectName(
  id: string,
  name: string,
): Promise<PitchProject | null> {
  const run = writeChain.then(async () => {
    const all = await readAllProjects();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const clean = name.trim().slice(0, 80) || "Untitled pitch";
    all[idx] = { ...all[idx], name: clean };
    await writeAllProjects(all);
    return all[idx];
  });
  writeChain = run.catch(() => undefined);
  return run;
}

/** Ensure a project has a public share token, minting one on first call. */
export async function setProjectShared(id: string): Promise<PitchProject | null> {
  const run = writeChain.then(async () => {
    const all = await readAllProjects();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    if (!all[idx].shareToken) {
      all[idx] = { ...all[idx], shareToken: makeShareToken() };
      await writeAllProjects(all);
    }
    return all[idx];
  });
  writeChain = run.catch(() => undefined);
  return run;
}

export async function getProjectByToken(token: string): Promise<PitchProject | null> {
  if (!token) return null;
  const all = await readAllProjects();
  return all.find((p) => p.shareToken === token) ?? null;
}

/**
 * Ensure a report has a public share token, minting one on first call.
 * Idempotent: returns the existing token if the report was already shared.
 * Serialized via the same write mutex.
 */
export async function setReportShared(id: string): Promise<SavedReport | null> {
  const run = writeChain.then(async () => {
    const all = await readAll();
    const idx = all.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    if (!all[idx].shareToken) {
      all[idx] = { ...all[idx], shareToken: makeShareToken() };
      await writeAll(all);
    }
    return all[idx];
  });
  writeChain = run.catch(() => undefined);
  return run;
}

/**
 * Look up a report by its public share token (for the unauthenticated /share
 * route). Archived reports are NOT served — archiving revokes the public link,
 * keeping archive semantics consistent across every access path.
 */
export async function getReportByToken(token: string): Promise<SavedReport | null> {
  if (!token) return null;
  const all = await readAll();
  return all.find((r) => r.shareToken === token && !r.archived) ?? null;
}
