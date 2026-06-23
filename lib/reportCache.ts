// Client-side report cache (localStorage). Lets a report open reliably even
// when the server store is unavailable (e.g. Vercel Blob suspended) and the
// serverless instance serving /report/[id] isn't the one that saved it.
// Browser-only — every function no-ops during SSR.
import type { SavedReport, AnalyzeResult, Brief } from "./types";

const KEY = "sf_report_cache_v1";
const CAP = 30; // keep the newest N reports; bounds localStorage growth

type CacheMap = Record<string, SavedReport>;

function readMap(): CacheMap {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    return parsed && typeof parsed === "object" ? (parsed as CacheMap) : {};
  } catch {
    return {};
  }
}

function writeMap(map: CacheMap): void {
  try {
    // Cap to the newest CAP reports by createdAt.
    const capped = Object.values(map)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .slice(0, CAP);
    const next: CacheMap = {};
    for (const r of capped) next[r.id] = r;
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota / unavailable — best-effort cache only */
  }
}

/** Store a report so it can be re-opened from this browser later. */
export function cacheReport(report: SavedReport): void {
  if (typeof window === "undefined" || !report?.id) return;
  const map = readMap();
  map[report.id] = report;
  writeMap(map);
}

/** Read a previously-cached report by id (null if not cached / SSR). */
export function readCachedReport(id: string): SavedReport | null {
  if (typeof window === "undefined") return null;
  return readMap()[id] ?? null;
}

/** Build a SavedReport from a fresh analyze result (mirrors storage.toSavedReport). */
export function reportFromResult(
  savedId: string,
  brief: Brief,
  result: AnalyzeResult,
  createdAt: string,
): SavedReport {
  return {
    id: savedId,
    createdAt,
    archived: false,
    name: result.analysis.briefName?.trim() || result.track.title,
    brief,
    track: result.track,
    analysis: result.analysis,
    marketSignal: result.marketSignal,
    audioReadiness: result.audioReadiness,
    usedDemoData: result.usedDemoData,
  } as SavedReport;
}
