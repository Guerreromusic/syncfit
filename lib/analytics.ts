// =============================================================================
// SyncFit — Analytics server-side storage (mirrors lib/storage.ts pattern)
// SERVER ONLY — imports Node.js built-ins. Never import this from client code.
// For shared types/constants safe in both environments: lib/analytics-shared.ts
// =============================================================================

import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { list, put, del } from "@vercel/blob";
import type { AnalyticsSession, AnalyticsStore } from "./analytics-shared";
import {
  generateMusicalName,
  getPuzzlePieceIndex,
  isOnline as isOnlineShared,
} from "./analytics-shared";

// Re-export shared symbols so callers can use a single import path when they
// only need server-side functions (API routes, etc.).
export type { PageVisit, AnalyticsSession, AnalyticsStore } from "./analytics-shared";
export { PUZZLE_PIECES, generateMusicalName, getPuzzlePieceIndex } from "./analytics-shared";

// -----------------------------------------------------------------------------
// Storage backend selection
// -----------------------------------------------------------------------------

const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const ANALYTICS_PREFIX = "analytics-snap/";

const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "syncfit")
  : path.join(process.cwd(), "data");
const ANALYTICS_FILE = path.join(DATA_DIR, "analytics.json");

// -----------------------------------------------------------------------------
// Blob helpers
// -----------------------------------------------------------------------------

async function listAnalyticsSnapshots() {
  const { blobs } = await list({ prefix: ANALYTICS_PREFIX });
  return blobs.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  );
}

async function blobReadAnalytics(): Promise<AnalyticsStore> {
  try {
    const snaps = await listAnalyticsSnapshots();
    if (!snaps.length) return { sessions: [] };
    const res = await fetch(snaps[0].url, { cache: "no-store" });
    if (!res.ok) return { sessions: [] };
    const parsed = await res.json() as unknown;
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "sessions" in parsed &&
      Array.isArray((parsed as AnalyticsStore).sessions)
    ) {
      return parsed as AnalyticsStore;
    }
    return { sessions: [] };
  } catch {
    return { sessions: [] };
  }
}

async function blobWriteAnalytics(store: AnalyticsStore): Promise<void> {
  try {
    await put(
      `${ANALYTICS_PREFIX}snap-${Date.now()}.json`,
      JSON.stringify(store),
      { access: "public", addRandomSuffix: false, contentType: "application/json" },
    );
    const snaps = await listAnalyticsSnapshots();
    const stale = snaps.slice(5);
    if (stale.length) await del(stale.map((b) => b.url));
  } catch {
    /* best-effort */
  }
}

// -----------------------------------------------------------------------------
// File helpers
// -----------------------------------------------------------------------------

async function fileReadAnalytics(): Promise<AnalyticsStore> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(ANALYTICS_FILE, "utf8").catch(() => "{}");
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "sessions" in parsed &&
      Array.isArray((parsed as AnalyticsStore).sessions)
    ) {
      return parsed as AnalyticsStore;
    }
    return { sessions: [] };
  } catch {
    return { sessions: [] };
  }
}

async function fileWriteAnalytics(store: AnalyticsStore): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(ANALYTICS_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch {
    /* ignore */
  }
}

// -----------------------------------------------------------------------------
// Public read/write
// -----------------------------------------------------------------------------

export async function readAnalytics(): Promise<AnalyticsStore> {
  return USE_BLOB ? blobReadAnalytics() : fileReadAnalytics();
}

async function writeAnalytics(store: AnalyticsStore): Promise<void> {
  return USE_BLOB ? blobWriteAnalytics(store) : fileWriteAnalytics(store);
}

// Re-export isOnline for callers that import from this module
export const isOnline = isOnlineShared;

// -----------------------------------------------------------------------------
// Prune
// -----------------------------------------------------------------------------

function pruneOldSessions(sessions: AnalyticsSession[]): AnalyticsSession[] {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return sessions.filter((s) => new Date(s.firstSeen).getTime() > cutoff);
}

// -----------------------------------------------------------------------------
// Write mutex
// -----------------------------------------------------------------------------

let analyticsWriteChain: Promise<unknown> = Promise.resolve();

// -----------------------------------------------------------------------------
// upsertSession
// -----------------------------------------------------------------------------

export type SessionPatch = {
  ip: string;
  country: string;
  city: string;
  lastSeen: string;
  seconds?: number;
  path?: string;
};

export async function upsertSession(
  sessionId: string,
  patch: SessionPatch,
): Promise<AnalyticsSession> {
  const run = analyticsWriteChain.then(async () => {
    const store = await readAnalytics();
    const existingIdx = store.sessions.findIndex((s) => s.sessionId === sessionId);

    let session: AnalyticsSession;

    if (existingIdx >= 0) {
      const existing = store.sessions[existingIdx];
      const newTotal = existing.totalSeconds + (patch.seconds ?? 0);
      let pages = [...existing.pages];
      if (patch.path) {
        const alreadyHas = pages.some((p) => p.path === patch.path);
        if (!alreadyHas) {
          pages.push({ path: patch.path, time: patch.lastSeen });
        }
      }
      session = {
        ...existing,
        ip: patch.ip,
        country: patch.country || existing.country,
        city: patch.city || existing.city,
        lastSeen: patch.lastSeen,
        totalSeconds: newTotal,
        pages,
      };
      store.sessions[existingIdx] = session;
    } else {
      const musicalName = generateMusicalName(sessionId);
      const puzzlePieceIndex = getPuzzlePieceIndex(sessionId);
      const pages = patch.path
        ? [{ path: patch.path, time: patch.lastSeen }]
        : [];
      session = {
        sessionId,
        musicalName,
        puzzlePieceIndex,
        ip: patch.ip,
        country: patch.country || "Unknown",
        city: patch.city || "Unknown",
        firstSeen: patch.lastSeen,
        lastSeen: patch.lastSeen,
        totalSeconds: patch.seconds ?? 0,
        pages,
      };
      store.sessions.unshift(session);
    }

    store.sessions = pruneOldSessions(store.sessions);
    await writeAnalytics(store);
    return session;
  });

  analyticsWriteChain = run.catch(() => undefined);
  return run as Promise<AnalyticsSession>;
}
