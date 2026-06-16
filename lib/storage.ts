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
import path from "path";
import type { AnalyzeResult, Brief, SavedReport } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(REPORTS_FILE);
  } catch {
    await fs.writeFile(REPORTS_FILE, "[]", "utf8");
  }
}

async function readAll(): Promise<SavedReport[]> {
  await ensureFile();
  try {
    const raw = await fs.readFile(REPORTS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedReport[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(reports: SavedReport[]): Promise<void> {
  await ensureFile();
  await fs.writeFile(REPORTS_FILE, JSON.stringify(reports, null, 2), "utf8");
}

/** Short, URL-safe id. */
function makeId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `sf_${Date.now().toString(36)}${rand}`;
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
    brief,
    track: {
      trackId: result.track.trackId,
      title: result.track.title,
      artist: result.track.artist,
      language: result.track.language,
      bpm: result.track.bpm,
      explicit: result.track.explicit,
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

export async function listReports(): Promise<SavedReport[]> {
  return readAll();
}
