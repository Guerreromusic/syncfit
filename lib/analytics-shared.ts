// =============================================================================
// SyncFit — Analytics shared types, constants, and pure helpers
// Safe to import from both server and client code (no Node.js built-ins).
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type PageVisit = { path: string; time: string };

export type AnalyticsSession = {
  sessionId: string;
  musicalName: string;
  puzzlePieceIndex: number;
  ip: string;
  country: string;
  city: string;
  firstSeen: string;
  lastSeen: string;
  totalSeconds: number;
  pages: PageVisit[];
};

export type AnalyticsStore = { sessions: AnalyticsSession[] };

// -----------------------------------------------------------------------------
// Puzzle pieces
// -----------------------------------------------------------------------------

export const PUZZLE_PIECES = [
  { color: "#a3e635", sound: "Boing",  bgClass: "bg-lime-400/15"    },
  { color: "#818cf8", sound: "Zap",    bgClass: "bg-indigo-400/15"  },
  { color: "#f472b6", sound: "Pop",    bgClass: "bg-pink-400/15"    },
  { color: "#fb923c", sound: "Ping",   bgClass: "bg-orange-400/15"  },
  { color: "#34d399", sound: "Ding",   bgClass: "bg-emerald-400/15" },
  { color: "#60a5fa", sound: "Whoosh", bgClass: "bg-blue-400/15"    },
  { color: "#facc15", sound: "Click",  bgClass: "bg-yellow-400/15"  },
  { color: "#f87171", sound: "Buzz",   bgClass: "bg-red-400/15"     },
];

// -----------------------------------------------------------------------------
// Musical names
// -----------------------------------------------------------------------------

const ADJECTIVES = [
  "Vibrant", "Melodic", "Harmonic", "Synced", "Dynamic", "Electric",
  "Resonant", "Chromatic", "Rhythmic", "Lyrical", "Forte", "Vivace",
  "Staccato", "Legato", "Allegro", "Pianissimo", "Cadent", "Modal",
  "Tremolo", "Reverb",
];

const NOUNS = [
  "Bassline", "Crescendo", "Motif", "Riff", "Cadence", "Chord", "Bridge",
  "Verse", "Chorus", "Tempo", "Groove", "Vibe", "Frequency", "Wave",
  "Pulse", "Downbeat", "Sustain", "Timbre", "Arpeggio", "Overdrive",
];

function hashSessionId(sessionId: string): number {
  let h = 0;
  for (let i = 0; i < sessionId.length; i++) {
    h = (h * 31 + sessionId.charCodeAt(i)) & 0x7fffffff;
  }
  return h;
}

export function generateMusicalName(sessionId: string): string {
  const h = hashSessionId(sessionId);
  const adj = ADJECTIVES[h % 20];
  const noun = NOUNS[Math.floor(h / 20) % 20];
  return `${adj} ${noun}`;
}

export function getPuzzlePieceIndex(sessionId: string): number {
  const h = hashSessionId(sessionId);
  return h % 8;
}

export function isOnline(session: AnalyticsSession): boolean {
  const cutoff = Date.now() - 2 * 60 * 1000;
  return new Date(session.lastSeen).getTime() > cutoff;
}

/**
 * Active seconds a visitor spent, bounded by physical reality: time on the
 * platform can never exceed the wall-clock span between firstSeen and lastSeen.
 * This sanitizes legacy records inflated by an old cumulative-heartbeat bug
 * (which could report hundreds of "hours") without needing a data migration —
 * both new reads and existing Blob records get clamped on the way out.
 */
export function activeSeconds(session: {
  totalSeconds: number;
  firstSeen: string;
  lastSeen: string;
}): number {
  const span = Math.max(
    0,
    Math.round(
      (new Date(session.lastSeen).getTime() -
        new Date(session.firstSeen).getTime()) /
        1000,
    ),
  );
  const total = Number.isFinite(session.totalSeconds) ? session.totalSeconds : 0;
  return Math.max(0, Math.min(total, span));
}

/** Routes that are internal probes or no longer exist — hidden from public analytics. */
const HIDDEN_PATHS = new Set(["/test-probe", "/agent"]);
export function isPublicPath(path: string): boolean {
  return !HIDDEN_PATHS.has(path) && !path.startsWith("/test");
}
