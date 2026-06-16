// =============================================================================
// SyncFit by Synclat — scoring model
// =============================================================================
// SyncFit Score / 100
//
//   Brief Match ............. 25
//   Lyric & Context Fit ..... 20
//   Mood / Energy Fit ....... 15
//   Brand Safety ............ 15
//   License Readiness ....... 10
//   Market Signal ........... 10
//   Audio Readiness .........  5
//                            ----
//                            100
//
// The FINAL score and breakdown are produced by the OpenRouter reasoning layer
// (see lib/api/openrouter.ts). This module defines the weights so the UI can
// render the categories clearly, and provides a deterministic local heuristic
// used in demo mode (when no OpenRouter key is configured).
// =============================================================================

import type {
  AudioReadiness,
  Brief,
  MarketSignal,
  NormalizedTrack,
  ScoreBreakdown,
  ScoreLabel,
  SyncFitAnalysis,
} from "./types";

export type ScoreCategory = {
  key: keyof ScoreBreakdown;
  label: string;
  max: number;
  description: string;
};

/** The weighted categories, in display order. Total = 100. */
export const SCORE_MODEL: ScoreCategory[] = [
  {
    key: "briefMatch",
    label: "Brief Match",
    max: 25,
    description: "How well the track fits the project type, region, and brief.",
  },
  {
    key: "lyricContextFit",
    label: "Lyric & Context Fit",
    max: 20,
    description: "Lyric theme/language alignment with the creative intent.",
  },
  {
    key: "moodEnergyFit",
    label: "Mood / Energy Fit",
    max: 15,
    description: "Emotional tone and energy vs. the requested mood.",
  },
  {
    key: "brandSafety",
    label: "Brand Safety",
    max: 15,
    description: "Content suitability for the requested safety level.",
  },
  {
    key: "licenseReadiness",
    label: "License Readiness",
    max: 10,
    description: "Fit for the chosen license tier and clearance ease.",
  },
  {
    key: "marketSignal",
    label: "Market Signal",
    max: 10,
    description: "Momentum / recognition (Songstats, when available).",
  },
  {
    key: "audioReadiness",
    label: "Audio Readiness",
    max: 5,
    description: "Stem/dialogue suitability (LALAL.AI, when available).",
  },
];

export const MAX_TOTAL = SCORE_MODEL.reduce((sum, c) => sum + c.max, 0); // 100

/** Map a 0–100 score to its label band. */
export function labelForScore(score: number): ScoreLabel {
  if (score >= 85) return "Excellent Fit";
  if (score >= 70) return "Strong Fit";
  if (score >= 50) return "Possible Fit";
  return "Weak Fit";
}

/** Clamp helper. */
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function includesAny(haystack: string, needles: string[]): boolean {
  const h = haystack.toLowerCase();
  return needles.some((n) => h.includes(n.toLowerCase()));
}

/**
 * Deterministic local heuristic analysis used in DEMO MODE only (no OpenRouter
 * key). It is intentionally transparent and rule-based so judges can see the
 * app working end-to-end without any external AI call. It never reproduces
 * lyrics — it only reasons over short metadata/context.
 */
export function heuristicAnalysis(input: {
  brief: Brief;
  track: NormalizedTrack;
  marketSignal: MarketSignal;
  audioReadiness: AudioReadiness;
}): SyncFitAnalysis {
  const { brief, track, marketSignal, audioReadiness } = input;
  const briefText = brief.brief || "";

  // --- Brief Match (25) ---
  let briefMatch = 14;
  if (briefText.trim().length > 40) briefMatch += 4;
  // Region heuristic: track language hints at region alignment.
  const lang = (track.language || "").toLowerCase();
  if (brief.region === "Brazil" && lang.startsWith("pt")) briefMatch += 5;
  else if (
    ["Colombia", "Mexico", "Caribbean", "LATAM"].includes(brief.region) &&
    lang.startsWith("es")
  )
    briefMatch += 5;
  else if (brief.region === "Global") briefMatch += 3;
  if (
    includesAny(briefText, [
      track.genre || "____",
      "latin",
      "fútbol",
      "futbol",
      "football",
      "celebrat",
      "fiesta",
      "party",
      "dance",
    ])
  )
    briefMatch += 3;
  briefMatch = clamp(briefMatch, 6, 25);

  // --- Lyric & Context Fit (20) ---
  let lyricContextFit = 11;
  const wantLang = brief.language;
  if (wantLang === "Any") lyricContextFit += 4;
  else if (wantLang === "Instrumental")
    lyricContextFit += track.lyricsContext ? -2 : 6;
  else if (
    (wantLang === "Spanish" && lang.startsWith("es")) ||
    (wantLang === "Portuguese" && lang.startsWith("pt")) ||
    (wantLang === "English" && lang.startsWith("en"))
  )
    lyricContextFit += 6;
  if (track.lyricsContext && track.lyricsContext.length > 0) lyricContextFit += 2;
  lyricContextFit = clamp(lyricContextFit, 4, 20);

  // --- Mood / Energy Fit (15) ---
  let moodEnergyFit = 9;
  const moodTokens: Record<string, string[]> = {
    Energetic: ["energ", "upbeat", "dance", "fiesta", "party", "celebrat"],
    Emotional: ["emotion", "balada", "ballad", "heart", "corazón", "corazon"],
    Romantic: ["roman", "love", "amor", "corazón", "corazon"],
    Dark: ["dark", "tense", "noir", "trap", "drill"],
    Celebration: ["celebrat", "fiesta", "party", "festiv"],
    Luxury: ["luxury", "premium", "lujo", "smooth"],
    Tension: ["tension", "suspense", "dark", "drama"],
  };
  const moodHints = moodTokens[brief.mood] || [];
  const moodHaystack = `${track.genre || ""} ${track.lyricsContext || ""} ${track.title}`;
  if (includesAny(moodHaystack, moodHints)) moodEnergyFit += 5;
  if (track.bpm) {
    if (
      (["Energetic", "Celebration"].includes(brief.mood) && track.bpm >= 110) ||
      (["Emotional", "Romantic"].includes(brief.mood) && track.bpm <= 100)
    )
      moodEnergyFit += 1;
  }
  moodEnergyFit = clamp(moodEnergyFit, 4, 15);

  // --- Brand Safety (15) ---
  let brandSafety = 13;
  if (track.explicit) {
    if (brief.brandSafety === "Strict") brandSafety = 4;
    else if (brief.brandSafety === "Medium") brandSafety = 8;
    else brandSafety = 11;
  }
  brandSafety = clamp(brandSafety, 3, 15);

  // --- License Readiness (10) ---
  let licenseReadiness = 6;
  if (brief.licenseTier === "Nano") licenseReadiness += 3;
  else if (brief.licenseTier === "Micro") licenseReadiness += 2;
  else licenseReadiness += 1; // Bespoke = more negotiation
  licenseReadiness = clamp(licenseReadiness, 3, 10);

  // --- Market Signal (10) ---
  const marketByStatus: Record<MarketSignal["status"], number> = {
    Unknown: 4,
    Emerging: 6,
    Rising: 8,
    Established: 9,
  };
  const marketSignalScore = clamp(marketByStatus[marketSignal.status] ?? 4, 0, 10);

  // --- Audio Readiness (5) ---
  const audioByDialogue: Record<AudioReadiness["dialogueFriendliness"], number> = {
    Unknown: 2,
    Poor: 1,
    Good: 4,
    Excellent: 5,
  };
  const audioReadinessScore = clamp(
    audioByDialogue[audioReadiness.dialogueFriendliness] ?? 2,
    0,
    5,
  );

  const breakdown: ScoreBreakdown = {
    briefMatch,
    lyricContextFit,
    moodEnergyFit,
    brandSafety,
    licenseReadiness,
    marketSignal: marketSignalScore,
    audioReadiness: audioReadinessScore,
  };

  const syncFitScore = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const scoreLabel = labelForScore(syncFitScore);

  // Best use cases derived from project type + mood.
  const bestUseCases = buildBestUseCases(brief);

  const brandSafetyLevel: SyncFitAnalysis["brandSafety"]["level"] = track.explicit
    ? brief.brandSafety === "Strict"
      ? "Low"
      : "Medium"
    : "High";

  const brandSafetyNotes: string[] = [];
  if (track.explicit) {
    brandSafetyNotes.push(
      "Track is flagged explicit by metadata — review against the requested brand safety level.",
    );
    if (brief.brandSafety === "Strict")
      brandSafetyNotes.push(
        "Strict brief: consider a clean edit/radio version before pitching.",
      );
  } else {
    brandSafetyNotes.push("No explicit flag detected in available metadata.");
  }
  brandSafetyNotes.push(
    "SyncFit does not store or display full lyrics; verify final content with the rights holder.",
  );

  const pitchSummary = buildPitchSummary({
    brief,
    track,
    syncFitScore,
    scoreLabel,
    marketSignal,
  });

  const supervisorNotes = [
    `Best aligned with ${brief.projectType.toLowerCase()} placements targeting ${brief.region}.`,
    track.bpm
      ? `Tempo ~${track.bpm} BPM supports a ${brief.mood.toLowerCase()} edit.`
      : `Tempo not available from metadata — confirm before locking to picture.`,
    marketSignal.status === "Unknown"
      ? "Market signal not included (Songstats not configured)."
      : `Market status: ${marketSignal.status}.`,
    "Demo heuristic result — add an OpenRouter key for full AI reasoning.",
  ];

  return {
    syncFitScore,
    scoreLabel,
    breakdown,
    bestUseCases,
    brandSafety: { level: brandSafetyLevel, notes: brandSafetyNotes },
    pitchSummary,
    supervisorNotes,
    suggestedAlternatives: [], // populated by AI layer; placeholder in demo mode
  };
}

function buildBestUseCases(brief: Brief): string[] {
  const base: Record<Brief["projectType"], string[]> = {
    Ad: ["Brand spot / commercial", "Product launch reel", "Retail in-store"],
    Film: ["Needle-drop scene", "End-credits cue", "Montage sequence"],
    TV: ["Episodic underscore", "Reality-show bed", "Promo / bumper"],
    Trailer: ["Hype build / drop", "Logo sting", "Teaser cut-down"],
    Game: ["Menu / lobby loop", "Race / action level", "Victory screen"],
    Social: ["Short-form hook", "Creator campaign", "Vertical ad"],
  };
  const cases = [...base[brief.projectType]];
  if (brief.mood === "Celebration" || brief.mood === "Energetic")
    cases.push("Sports / matchday moment");
  if (brief.mood === "Romantic" || brief.mood === "Emotional")
    cases.push("Emotional brand storytelling");
  return cases.slice(0, 4);
}

function buildPitchSummary(args: {
  brief: Brief;
  track: NormalizedTrack;
  syncFitScore: number;
  scoreLabel: ScoreLabel;
  marketSignal: MarketSignal;
}): string {
  const { brief, track, syncFitScore, scoreLabel } = args;
  const langPart = track.language ? ` (${track.language})` : "";
  const article = /^[aeiou]/i.test(scoreLabel) ? "an" : "a"; // "an Excellent Fit"
  return (
    `"${track.title}" by ${track.artist}${langPart} scores ${syncFitScore}/100 — ` +
    `${article} ${scoreLabel} for this ${brief.region} ${brief.projectType.toLowerCase()} brief. ` +
    `Its ${brief.mood.toLowerCase()} character and Latin sound make it a practical option for ` +
    `${brief.projectType === "Ad" ? "brand and campaign work" : "the requested placement"}. ` +
    `Pitch with the ${brief.licenseTier} license tier in mind and confirm clearance with the rights holder.`
  );
}
