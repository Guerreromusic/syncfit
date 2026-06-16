// =============================================================================
// SyncFit by Synclat — OpenRouter adapter (AI reasoning layer)
// =============================================================================
// Runs SERVER-SIDE only. The OPENROUTER_API_KEY is read from process.env and
// never exposed to the browser.
//
// Takes the user brief + normalized Musixmatch metadata (+ optional Songstats
// and LALAL.AI signals) and returns a validated SyncFitAnalysis object.
//
// If no key is configured, callers should fall back to the local heuristic in
// lib/scoring.ts (demo mode) — this adapter throws a typed error so the caller
// can decide.
// =============================================================================

import { env, isConfigured } from "../env";
import { labelForScore } from "../scoring";
import { isAllowedModel } from "../models";
import {
  SYNCFIT_SYSTEM_PROMPT,
  buildSyncFitUserPrompt,
} from "../prompts/syncfitPrompt";
import {
  DISCOVER_SYSTEM_PROMPT,
  buildDiscoverUserPrompt,
} from "../prompts/discoverPrompt";
import type {
  AudioReadiness,
  Brief,
  MarketSignal,
  NormalizedTrack,
  RankedTrack,
  ScoreBreakdown,
  SyncFitAnalysis,
} from "../types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export class OpenRouterNotConfiguredError extends Error {
  constructor() {
    super("OPENROUTER_API_KEY is not configured");
    this.name = "OpenRouterNotConfiguredError";
  }
}

export type RunAnalysisInput = {
  brief: Brief;
  track: NormalizedTrack;
  marketSignal: MarketSignal;
  audioReadiness: AudioReadiness;
  /** Resolved, validated OpenRouter model slug (caller resolves; we guard too). */
  model?: string;
};

/**
 * Call OpenRouter and return a validated SyncFitAnalysis.
 * Throws OpenRouterNotConfiguredError when no key is set so the caller can fall
 * back to the demo heuristic.
 */
export async function runSyncFitAnalysis(
  input: RunAnalysisInput,
): Promise<SyncFitAnalysis> {
  if (!isConfigured.openrouter()) {
    throw new OpenRouterNotConfiguredError();
  }

  const userPrompt = buildSyncFitUserPrompt(input);
  // Use the caller's validated model, or fall back to the env/default model.
  const model = isAllowedModel(input.model) ? input.model : env.openrouterModel();

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${env.openrouter()}`,
      "Content-Type": "application/json",
      // Optional attribution headers recommended by OpenRouter.
      "HTTP-Referer": "https://synclat.com",
      "X-Title": "SyncFit by Synclat",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      // Ask for a JSON object back where supported.
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYNCFIT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await safeText(res);
    throw new Error(`OpenRouter HTTP ${res.status}${detail ? `: ${detail}` : ""}`);
  }

  const json = await res.json();
  const content: string | undefined = json?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned an empty response");
  }

  const parsed = parseAnalysisJson(content);
  return normalizeAnalysis(parsed);
}

async function safeText(res: Response): Promise<string> {
  try {
    const t = await res.text();
    return t.slice(0, 300);
  } catch {
    return "";
  }
}

/**
 * Parse the model output into an object. Tolerant of stray text/code fences by
 * extracting the first balanced JSON object. Throws if no valid JSON is found —
 * the caller surfaces a friendly "AI output not valid JSON" message.
 */
export function parseAnalysisJson(content: string): unknown {
  const trimmed = content.trim();
  // Fast path.
  try {
    return JSON.parse(trimmed);
  } catch {
    // Strip code fences if present.
    const fenced = trimmed
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();
    try {
      return JSON.parse(fenced);
    } catch {
      // Last resort: extract first {...} block.
      const start = fenced.indexOf("{");
      const end = fenced.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        return JSON.parse(fenced.slice(start, end + 1));
      }
      throw new Error("AI output was not valid JSON");
    }
  }
}

/** Clamp + coerce the parsed object into a safe SyncFitAnalysis. */
function normalizeAnalysis(raw: any): SyncFitAnalysis {
  const clamp = (n: unknown, max: number): number => {
    const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
    return Math.max(0, Math.min(max, Math.round(v)));
  };

  const breakdown: ScoreBreakdown = {
    briefMatch: clamp(raw?.breakdown?.briefMatch, 25),
    lyricContextFit: clamp(raw?.breakdown?.lyricContextFit, 20),
    moodEnergyFit: clamp(raw?.breakdown?.moodEnergyFit, 15),
    brandSafety: clamp(raw?.breakdown?.brandSafety, 15),
    licenseReadiness: clamp(raw?.breakdown?.licenseReadiness, 10),
    marketSignal: clamp(raw?.breakdown?.marketSignal, 10),
    audioReadiness: clamp(raw?.breakdown?.audioReadiness, 5),
  };

  // Always derive the headline score from the (already clamped) breakdown so the
  // gauge and the breakdown bars can never visibly disagree.
  const syncFitScore = Math.max(
    0,
    Math.min(100, Object.values(breakdown).reduce((a, b) => a + b, 0)),
  );

  // Always derive the label from the final score; its bands match the prompt.
  const scoreLabel = labelForScore(syncFitScore);

  const toStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 6) : [];

  const bsLevelRaw = raw?.brandSafety?.level;
  const brandSafetyLevel = ["Low", "Medium", "High"].includes(bsLevelRaw)
    ? bsLevelRaw
    : "Medium";

  const suggestedAlternatives = Array.isArray(raw?.suggestedAlternatives)
    ? raw.suggestedAlternatives
        .filter((a: any) => a && typeof a.title === "string")
        .slice(0, 3)
        .map((a: any) => ({
          title: String(a.title),
          artist: String(a.artist ?? "Unknown"),
          reason: String(a.reason ?? ""),
          matchScore: Math.max(0, Math.min(100, Math.round(Number(a.matchScore) || 0))),
        }))
    : [];

  return {
    syncFitScore,
    scoreLabel,
    breakdown,
    bestUseCases: toStringArray(raw?.bestUseCases),
    brandSafety: {
      level: brandSafetyLevel,
      notes: toStringArray(raw?.brandSafety?.notes),
    },
    pitchSummary:
      typeof raw?.pitchSummary === "string" ? raw.pitchSummary : "",
    supervisorNotes: toStringArray(raw?.supervisorNotes),
    suggestedAlternatives,
  };
}

// =============================================================================
// TrackFit discovery — recommend & rank 10 tracks for a brief (no track given)
// =============================================================================

export type RunDiscoveryInput = { brief: Brief; model?: string };

/**
 * Ask OpenRouter for the 10 best-fitting Latin tracks for a brief, ranked
 * highest → lowest. Throws OpenRouterNotConfiguredError when no key is set so
 * the caller can fall back to the demo heuristic.
 */
export async function runTrackDiscovery(
  input: RunDiscoveryInput,
): Promise<RankedTrack[]> {
  if (!isConfigured.openrouter()) {
    throw new OpenRouterNotConfiguredError();
  }

  const model = isAllowedModel(input.model) ? input.model : env.openrouterModel();

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${env.openrouter()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://synclat.com",
      "X-Title": "SyncFit by Synclat",
    },
    body: JSON.stringify({
      model,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: DISCOVER_SYSTEM_PROMPT },
        { role: "user", content: buildDiscoverUserPrompt(input.brief) },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await safeText(res);
    throw new Error(`OpenRouter HTTP ${res.status}${detail ? `: ${detail}` : ""}`);
  }

  const json = await res.json();
  const content: string | undefined = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned an empty response");

  const parsed = parseAnalysisJson(content);
  return normalizeRankedTracks(parsed);
}

/** Validate, clamp, sort (desc) and cap the discovery list at 10 tracks. */
export function normalizeRankedTracks(raw: any): RankedTrack[] {
  const list: any[] = Array.isArray(raw?.tracks)
    ? raw.tracks
    : Array.isArray(raw)
      ? raw
      : [];

  const validBrandSafety = ["Low", "Medium", "High"];

  const tracks: RankedTrack[] = list
    .filter((t) => t && typeof t.title === "string")
    .map((t) => {
      const score = Math.max(
        0,
        Math.min(100, Math.round(Number(t.syncFitScore) || 0)),
      );
      return {
        title: String(t.title),
        artist: String(t.artist ?? "Unknown artist"),
        syncFitScore: score,
        scoreLabel: labelForScore(score),
        reason: typeof t.reason === "string" ? t.reason : "",
        bestUse: typeof t.bestUse === "string" ? t.bestUse : undefined,
        language: typeof t.language === "string" ? t.language : undefined,
        brandSafety: validBrandSafety.includes(t.brandSafety)
          ? t.brandSafety
          : undefined,
      };
    });

  tracks.sort((a, b) => b.syncFitScore - a.syncFitScore);
  return tracks.slice(0, 10);
}
