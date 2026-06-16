// =============================================================================
// SyncFit by Synclat — Songstats adapter (OPTIONAL market signal)
// =============================================================================
// Runs SERVER-SIDE only. Optional: if SONGSTATS_API_KEY is not configured, this
// returns demo-safe placeholder data so the rest of the app keeps working.
//
// Verified against the official Songstats Enterprise API + Python SDK:
//   • Base URL : https://api.songstats.com/enterprise/v1
//   • Auth     : `apikey` request header
//   • Search   : GET tracks/search?q=<text>   → { result, results: [...] }
//   • Stats    : GET tracks/stats?songstats_track_id=<id>  (or isrc / spotify_track_id)
//   • Errors   : { result: "error", message } with a non-200 status
// (If a future plan moves the host to data.songstats.com, only SONGSTATS_BASE
//  needs to change.)
// =============================================================================

import { env, isConfigured } from "../env";
import type { MarketSignal } from "../types";

const SONGSTATS_BASE = "https://api.songstats.com/enterprise/v1";

export const SONGSTATS_ENDPOINTS = {
  search: "tracks/search",
  stats: "tracks/stats",
} as const;

const PLACEHOLDER: MarketSignal = {
  status: "Unknown",
  summary:
    "Songstats API key not configured. Market signal not included in this demo result.",
  confidence: 0,
};

export type MarketSignalParams = { artist: string; title: string };

function songstatsUrl(
  endpoint: string,
  params: Record<string, string | number | undefined>,
): string {
  const url = new URL(`${SONGSTATS_BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && `${v}`.length > 0) url.searchParams.set(k, `${v}`);
  }
  return url.toString();
}

async function songstatsGet(url: string): Promise<any> {
  // Never cache (freshness + we don't persist provider responses).
  const res = await fetch(url, {
    cache: "no-store",
    headers: { apikey: env.songstats(), Accept: "application/json" },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.result === "error") {
    const msg = json?.message || `HTTP ${res.status}`;
    throw new Error(`Songstats ${msg}`);
  }
  return json;
}

/**
 * Best-effort extraction of a Spotify-ish stream total from a `tracks/stats`
 * response. The stats payload shape varies by plan/source, so we walk it
 * defensively for any numeric value under a stream-like key and take the max.
 * Returns null if nothing stream-like is found.
 */
function extractStreams(statsJson: any): number | null {
  let best: number | null = null;
  const visit = (node: any, keyHint = ""): void => {
    if (node == null) return;
    if (typeof node === "number") {
      if (/stream/i.test(keyHint) && Number.isFinite(node)) {
        best = best === null ? node : Math.max(best, node);
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((n) => visit(n, keyHint));
      return;
    }
    if (typeof node === "object") {
      for (const [k, v] of Object.entries(node)) visit(v, k);
    }
  };
  visit(statsJson);
  return best;
}

function statusFromStreams(streams: number | null): {
  status: MarketSignal["status"];
  confidence: number;
} {
  if (streams === null) return { status: "Emerging", confidence: 45 };
  if (streams >= 50_000_000) return { status: "Established", confidence: 90 };
  if (streams >= 2_000_000) return { status: "Rising", confidence: 75 };
  if (streams > 0) return { status: "Emerging", confidence: 60 };
  return { status: "Emerging", confidence: 40 };
}

/**
 * Get a normalized market signal for a track.
 * Two-step: search by title/artist → fetch current stats for the top match.
 * Returns a safe placeholder when no key is configured, and degrades gracefully
 * (never throws) on any error — SyncFit never fails because an optional API does.
 */
export async function getMarketSignal(
  params: MarketSignalParams,
): Promise<MarketSignal> {
  if (!isConfigured.songstats()) return PLACEHOLDER;

  try {
    // 1) Resolve the track in the Songstats catalogue.
    const q = `${params.title} ${params.artist}`.trim();
    const searchJson = await songstatsGet(
      songstatsUrl(SONGSTATS_ENDPOINTS.search, { q, limit: 1 }),
    );
    const top =
      searchJson?.results?.[0] ?? searchJson?.tracks?.[0] ?? null;

    if (!top) {
      return {
        status: "Unknown",
        summary:
          "Track not found in the Songstats catalogue — no market signal available.",
        confidence: 0,
      };
    }

    const trackId: string | undefined =
      top.songstats_track_id ?? top.id ?? undefined;
    const isrc: string | undefined = top.isrc ?? undefined;

    // 2) Pull current stats for the matched track.
    let streams: number | null = null;
    if (trackId || isrc) {
      try {
        const statsJson = await songstatsGet(
          songstatsUrl(SONGSTATS_ENDPOINTS.stats, {
            songstats_track_id: trackId,
            isrc: trackId ? undefined : isrc,
          }),
        );
        streams = extractStreams(statsJson);
      } catch {
        // Found the track but stats unavailable on this plan — still a signal.
      }
    }

    const { status, confidence } = statusFromStreams(streams);
    const streamsNote =
      streams !== null
        ? ` (~${Intl.NumberFormat("en-US", { notation: "compact" }).format(streams)} streams)`
        : "";
    return {
      status,
      summary: `Songstats: "${top.title ?? params.title}" is present in the catalogue${streamsNote}. Market status assessed as ${status}.`,
      confidence,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "lookup error";
    return {
      status: "Unknown",
      summary: `Songstats lookup failed (${msg}). Market signal omitted from this result.`,
      confidence: 0,
    };
  }
}
