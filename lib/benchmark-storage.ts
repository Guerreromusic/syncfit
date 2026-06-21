// =============================================================================
// SyncFit by Synclat — benchmark storage (server-side)
// Mirrors the blob-snapshot / local-file strategy from lib/storage.ts.
// =============================================================================

import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { randomBytes } from "crypto";
import { list, put, del } from "@vercel/blob";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type BenchmarkResult = {
  title: string;
  artist: string;
  score: number;
  scoreLabel: string;
  brandSafety: string;
  breakdown: Record<string, number>;
  artworkUrl?: string;
  spotifyTrackId?: string;
  genre?: string;
  pitchSummary?: string;
  bestUseCases?: string[];
};

export type BenchmarkRecord = {
  token: string;      // unique share token — 12 hex chars from crypto
  createdAt: string;  // ISO timestamp
  briefText: string;
  results: BenchmarkResult[];
};

// -----------------------------------------------------------------------------
// Storage backend
// -----------------------------------------------------------------------------

const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const BENCHMARK_PREFIX = "benchmarks-snap/";

// Local file fallback (project dir locally; OS temp on a Vercel box with no Blob).
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "syncfit")
  : path.join(process.cwd(), "data");
const BENCHMARKS_FILE = path.join(DATA_DIR, "benchmarks.json");

/** Newest-first list of snapshot blobs. */
async function listSnapshots() {
  const { blobs } = await list({ prefix: BENCHMARK_PREFIX });
  return blobs.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  );
}

async function blobReadAll(): Promise<BenchmarkRecord[]> {
  try {
    const snaps = await listSnapshots();
    if (!snaps.length) return [];
    const res = await fetch(snaps[0].url, { cache: "no-store" });
    if (!res.ok) return [];
    const parsed = await res.json();
    return Array.isArray(parsed) ? (parsed as BenchmarkRecord[]) : [];
  } catch {
    return [];
  }
}

async function blobWriteAll(records: BenchmarkRecord[]): Promise<void> {
  try {
    await put(`${BENCHMARK_PREFIX}benchmarks.json`, JSON.stringify(records), {
      access: "public",
      addRandomSuffix: true,
      contentType: "application/json",
    });
    // Keep only the newest 5 snapshots.
    const snaps = await listSnapshots();
    const stale = snaps.slice(5);
    if (stale.length) await del(stale.map((b) => b.url));
  } catch {
    /* best-effort */
  }
}

async function fileReadAll(): Promise<BenchmarkRecord[]> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(BENCHMARKS_FILE, "utf8").catch(() => "[]");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BenchmarkRecord[]) : [];
  } catch {
    return [];
  }
}

async function fileWriteAll(records: BenchmarkRecord[]): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(BENCHMARKS_FILE, JSON.stringify(records, null, 2), "utf8");
  } catch {
    /* ignore — ephemeral demo storage */
  }
}

async function readAll(): Promise<BenchmarkRecord[]> {
  return USE_BLOB ? blobReadAll() : fileReadAll();
}

async function writeAll(records: BenchmarkRecord[]): Promise<void> {
  return USE_BLOB ? blobWriteAll(records) : fileWriteAll(records);
}

// In-process write mutex — same approach as storage.ts.
let writeChain: Promise<unknown> = Promise.resolve();

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Save a new benchmark. Generates a token + createdAt, prepends to the list,
 * prunes entries older than 90 days, and persists.
 */
export async function saveBenchmark(
  record: Omit<BenchmarkRecord, "token" | "createdAt">,
): Promise<BenchmarkRecord> {
  const full: BenchmarkRecord = {
    token: randomBytes(6).toString("hex"),
    createdAt: new Date().toISOString(),
    ...record,
  };

  const run = writeChain.then(async () => {
    const all = await readAll();
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const pruned = all.filter((r) => new Date(r.createdAt).getTime() > cutoff);
    pruned.unshift(full);
    await writeAll(pruned);
    return full;
  });
  writeChain = run.catch(() => undefined);
  return run;
}

/** Look up a benchmark by token. Returns null if not found. */
export async function getBenchmark(token: string): Promise<BenchmarkRecord | null> {
  if (!token) return null;
  const all = await readAll();
  return all.find((r) => r.token === token) ?? null;
}
