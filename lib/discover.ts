// =============================================================================
// SyncFit by Synclat — TrackFit discovery orchestration
// =============================================================================
// Runs when the user submits a brief WITHOUT naming a track: returns up to 10
// ranked track recommendations. Uses OpenRouter when configured, otherwise a
// local heuristic over the demo catalogue. Runs SERVER-SIDE only.
// =============================================================================

import { runTrackDiscovery, OpenRouterNotConfiguredError } from "./api/openrouter";
import { heuristicAnalysis } from "./scoring";
import { DEMO_TRACKS } from "./demo";
import { env } from "./env";
import { isAllowedModel } from "./models";
import type {
  AudioReadiness,
  Brief,
  DiscoverResult,
  MarketSignal,
  RankedTrack,
} from "./types";

const PLACEHOLDER_MARKET: MarketSignal = {
  status: "Unknown",
  summary: "",
  confidence: 0,
};
const PLACEHOLDER_AUDIO: AudioReadiness = {
  instrumentalPotential: "Unknown",
  vocalDominance: "Unknown",
  dialogueFriendliness: "Unknown",
  summary: "",
};

export async function discover(input: {
  brief: Brief;
  model?: string;
}): Promise<DiscoverResult> {
  const resolvedModel = isAllowedModel(input.model)
    ? input.model
    : env.openrouterModel();

  try {
    const tracks = await runTrackDiscovery({
      brief: input.brief,
      model: resolvedModel,
    });
    return {
      tracks,
      modelUsed: resolvedModel,
      openrouterError: null,
      usedDemoData: { openrouter: false },
    };
  } catch (err) {
    // Not configured → ordinary demo mode. A real failure → surface the message.
    const openrouterError =
      err instanceof OpenRouterNotConfiguredError
        ? null
        : err instanceof Error
          ? err.message
          : "AI discovery failed";
    return {
      tracks: heuristicDiscover(input.brief),
      modelUsed: null,
      openrouterError,
      usedDemoData: { openrouter: true },
    };
  }
}

/** Demo fallback: rank the built-in demo catalogue against the brief. */
function heuristicDiscover(brief: Brief): RankedTrack[] {
  return DEMO_TRACKS.map((t) => {
    const a = heuristicAnalysis({
      brief,
      track: t,
      marketSignal: PLACEHOLDER_MARKET,
      audioReadiness: PLACEHOLDER_AUDIO,
    });
    return {
      title: t.title,
      artist: t.artist,
      syncFitScore: a.syncFitScore,
      scoreLabel: a.scoreLabel,
      reason: a.pitchSummary,
      bestUse: a.bestUseCases[0],
      language: t.language,
      brandSafety: a.brandSafety.level,
    };
  }).sort((x, y) => y.syncFitScore - x.syncFitScore);
}
