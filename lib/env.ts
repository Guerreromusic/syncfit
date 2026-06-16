// =============================================================================
// SyncFit by Synclat — environment + API status helpers
// =============================================================================
// SECURITY: every function here runs SERVER-SIDE only. API keys are read from
// process.env and never returned to the client. The /api/status route returns
// only booleans/labels (presence), never the key values themselves.
// =============================================================================

import type { ApiStatus } from "./types";
import { DEFAULT_OPENROUTER_MODEL } from "./models";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "SyncFit by Synclat";

/** True when a key is present and non-empty. */
function has(key: string | undefined): boolean {
  return typeof key === "string" && key.trim().length > 0;
}

export const env = {
  musixmatch: () => process.env.MUSIXMATCH_API_KEY?.trim() || "",
  openrouter: () => process.env.OPENROUTER_API_KEY?.trim() || "",
  openrouterModel: () =>
    process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL,
  songstats: () => process.env.SONGSTATS_API_KEY?.trim() || "",
  lalal: () => process.env.LALAL_API_KEY?.trim() || "",
  cyanite: () => process.env.CYANITE_API_KEY?.trim() || "",
};

export const isConfigured = {
  musixmatch: () => has(process.env.MUSIXMATCH_API_KEY),
  openrouter: () => has(process.env.OPENROUTER_API_KEY),
  songstats: () => has(process.env.SONGSTATS_API_KEY),
  lalal: () => has(process.env.LALAL_API_KEY),
  cyanite: () => has(process.env.CYANITE_API_KEY),
};

/**
 * Build the API status list for the dashboard panel. Returns presence + state
 * only — NEVER the key values. Safe to send to the client.
 */
export function getApiStatuses(): ApiStatus[] {
  return [
    {
      key: "musixmatch",
      label: "Musixmatch",
      state: isConfigured.musixmatch() ? "connected" : "demo",
      note: isConfigured.musixmatch()
        ? "Connected — live track & metadata."
        : "Demo mode — using built-in demo tracks.",
    },
    {
      key: "openrouter",
      label: "AI Model",
      state: isConfigured.openrouter() ? "connected" : "demo",
      note: isConfigured.openrouter()
        ? "Connected — AI reasoning enabled."
        : "Demo mode — local heuristic analysis.",
    },
    {
      key: "songstats",
      label: "Songstats",
      state: isConfigured.songstats() ? "connected" : "optional",
      note: isConfigured.songstats()
        ? "Connected — market signal enabled."
        : "Optional — market signal not included.",
    },
    {
      key: "lalal",
      label: "LALAL.AI",
      state: isConfigured.lalal() ? "connected" : "optional",
      note: isConfigured.lalal()
        ? "Connected — audio readiness enabled."
        : "Optional — audio readiness not included.",
    },
    {
      key: "cyanite",
      label: "Cyanite",
      state: "later",
      note: "Planned — advanced sonic tagging (not in V1).",
    },
  ];
}
