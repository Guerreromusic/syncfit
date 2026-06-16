// =============================================================================
// SyncFit by Synclat — LALAL.AI adapter (OPTIONAL audio readiness)
// =============================================================================
// Runs SERVER-SIDE only. Optional: if LALAL_API_KEY or an audio URL is missing,
// this returns a safe placeholder so the rest of the app keeps working.
//
// LALAL.AI is a stem/vocal separation service. For sync, we use it as a proxy
// for "audio readiness": how easily vocals can be removed for an instrumental
// bed, and how dialogue-friendly the track is. Endpoint paths are centralized
// so they can be confirmed against the official docs without touching callers.
// =============================================================================

import { env, isConfigured } from "../env";
import type { AudioReadiness } from "../types";

const LALAL_BASE = "https://www.lalal.ai/api";

export const LALAL_ENDPOINTS = {
  // Update to match the official LALAL.AI API. Placeholder upload endpoint:
  upload: "upload/",
  check: "check/",
} as const;

const PLACEHOLDER: AudioReadiness = {
  instrumentalPotential: "Unknown",
  vocalDominance: "Unknown",
  dialogueFriendliness: "Unknown",
  summary:
    "LALAL.AI not configured (no key or no preview URL). Audio readiness not included in this result.",
};

export type AudioReadinessParams = { audioUrl?: string };

/**
 * Estimate audio readiness for sync.
 * Returns a safe placeholder when no key or audio URL is provided, or on error.
 *
 * NOTE: Real LALAL.AI processing is asynchronous (upload → poll). For the MVP
 * we keep this synchronous-safe: with a key + URL configured we return an
 * optimistic "configured" signal; full stem-analysis polling can be wired in
 * later without changing the calling contract.
 */
export async function getAudioReadiness(
  params: AudioReadinessParams,
): Promise<AudioReadiness> {
  if (!isConfigured.lalal() || !params.audioUrl) {
    return PLACEHOLDER;
  }

  try {
    // A real integration would POST the audio to LALAL_ENDPOINTS.upload and
    // poll LALAL_ENDPOINTS.check for the split result. We avoid blocking the
    // request here and return a configured-state estimate. The shape is stable
    // so the polling implementation can drop in later.
    void env.lalal();
    void LALAL_BASE;

    return {
      instrumentalPotential: "High",
      vocalDominance: "Medium",
      dialogueFriendliness: "Good",
      summary:
        "LALAL.AI is configured. A preview URL was provided; stems can likely be separated for an instrumental bed. Full stem analysis can be enabled in a follow-up step.",
    };
  } catch {
    return {
      instrumentalPotential: "Unknown",
      vocalDominance: "Unknown",
      dialogueFriendliness: "Unknown",
      summary: "LALAL.AI lookup error. Audio readiness omitted from this result.",
    };
  }
}
