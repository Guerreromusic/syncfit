// =============================================================================
// SyncFit by Synclat — shared TypeScript types
// =============================================================================

/** Project / placement types a brief can target. */
export type ProjectType = "Ad" | "Film" | "TV" | "Trailer" | "Game" | "Social";

export type Region =
  | "Colombia"
  | "Mexico"
  | "Brazil"
  | "Caribbean"
  | "LATAM"
  | "Global";

export type Mood =
  | "Energetic"
  | "Emotional"
  | "Romantic"
  | "Dark"
  | "Celebration"
  | "Luxury"
  | "Tension";

export type Language =
  | "Spanish"
  | "Portuguese"
  | "English"
  | "Instrumental"
  | "Any";

export type BrandSafetyLevel = "Low" | "Medium" | "Strict";

export type LicenseTier = "Nano" | "Micro" | "Bespoke";

/** The creative brief entered by the music supervisor. */
export type Brief = {
  brief: string;
  projectType: ProjectType;
  region: Region;
  mood: Mood;
  language: Language;
  brandSafety: BrandSafetyLevel;
  licenseTier: LicenseTier;
};

/**
 * Normalized track shape. This is the ONLY representation of a track that
 * SyncFit passes around the app.
 *
 * COMPLIANCE: `lyricsContext` may contain only a short, allowed snippet/context
 * for real-time analysis. Full lyrics are NEVER stored, cached, displayed, or
 * persisted. The stored report (see SavedReport) deliberately omits this field.
 */
export type NormalizedTrack = {
  trackId: string;
  title: string;
  artist: string;
  album?: string;
  language?: string;
  explicit?: boolean;
  bpm?: number;
  genre?: string;
  lyricsContext?: string; // only a short context/snippet if allowed, never full lyrics
  source: "musixmatch" | "demo" | "manual";
};

/**
 * Client-safe track shape. `lyricsContext` is SERVER-ONLY and is stripped before
 * any track crosses the network boundary, so the wire/UI types use this. Typing
 * API responses as ClientTrack makes the compiler enforce that the short lyric
 * context never leaves the server.
 */
export type ClientTrack = Omit<NormalizedTrack, "lyricsContext">;

/** Optional Songstats market signal. */
export type MarketSignal = {
  status: "Unknown" | "Emerging" | "Rising" | "Established";
  summary: string;
  confidence: number;
  /** Cover artwork URL (Songstats `avatar`), when available. */
  artworkUrl?: string | null;
  /** Spotify track id (from Songstats links) for an embedded 30s preview. */
  spotifyTrackId?: string | null;
};

/** Optional LALAL.AI audio readiness. */
export type AudioReadiness = {
  instrumentalPotential: "Unknown" | "Low" | "Medium" | "High";
  vocalDominance: "Unknown" | "Low" | "Medium" | "High";
  dialogueFriendliness: "Unknown" | "Poor" | "Good" | "Excellent";
  summary: string;
};

/** The breakdown matches the SyncFit scoring model weights. */
export type ScoreBreakdown = {
  briefMatch: number; // /25
  lyricContextFit: number; // /20
  moodEnergyFit: number; // /15
  brandSafety: number; // /15
  licenseReadiness: number; // /10
  marketSignal: number; // /10
  audioReadiness: number; // /5
};

export type ScoreLabel =
  | "Weak Fit"
  | "Possible Fit"
  | "Strong Fit"
  | "Excellent Fit";

export type SuggestedAlternative = {
  title: string;
  artist: string;
  reason: string;
  matchScore: number;
};

/** The full AI analysis returned by the OpenRouter reasoning layer. */
export type SyncFitAnalysis = {
  syncFitScore: number;
  scoreLabel: ScoreLabel;
  breakdown: ScoreBreakdown;
  bestUseCases: string[];
  brandSafety: {
    level: "Low" | "Medium" | "High";
    notes: string[];
  };
  pitchSummary: string;
  supervisorNotes: string[];
  suggestedAlternatives?: SuggestedAlternative[];
};

/**
 * A single AI-recommended track in TrackFit discovery mode (when the user runs
 * a brief WITHOUT naming a track). These are professional recommendations from
 * the model's knowledge — framed as suggestions, not a verified catalogue.
 */
export type RankedTrack = {
  title: string;
  artist: string;
  syncFitScore: number; // 0-100
  scoreLabel: ScoreLabel;
  reason: string;
  bestUse?: string;
  language?: string;
  brandSafety?: "Low" | "Medium" | "High";
};

/** Result of TrackFit discovery: up to 10 tracks ranked highest → lowest. */
export type DiscoverResult = {
  tracks: RankedTrack[];
  openrouterError?: string | null;
  modelUsed?: string | null;
  usedDemoData: { openrouter: boolean };
};

/** A trending Latin track card (curated seed enriched with live Songstats data). */
export type TrendingTrack = {
  title: string;
  artist: string;
  artworkUrl: string | null;
  streams: number | null;
  status: MarketSignal["status"];
};

/** Whether each provider is wired up. Shown in the API Status panel. */
export type ApiKey = "musixmatch" | "openrouter" | "songstats" | "lalal" | "cyanite";

export type ApiStatusState =
  | "connected"
  | "missing"
  | "optional"
  | "demo"
  | "later";

export type ApiStatus = {
  key: ApiKey;
  label: string;
  state: ApiStatusState;
  note: string;
};

/**
 * Result of a full analyze() call, combining the track, the optional signals,
 * and the AI analysis. `usedDemoData` flags any surface that fell back to demo.
 */
export type AnalyzeResult = {
  track: ClientTrack;
  marketSignal: MarketSignal;
  audioReadiness: AudioReadiness;
  analysis: SyncFitAnalysis;
  /**
   * Set when a CONFIGURED OpenRouter call actually failed (bad key, 5xx,
   * invalid JSON) and we fell back to the heuristic — distinct from the
   * not-configured demo case. Surfaced in the UI so a real outage isn't hidden.
   */
  openrouterError?: string | null;
  /** The OpenRouter model that actually produced this analysis (null in demo). */
  modelUsed?: string | null;
  usedDemoData: {
    musixmatch: boolean;
    openrouter: boolean;
    songstats: boolean;
    lalal: boolean;
  };
};

/**
 * What we persist locally for a saved demo report.
 *
 * COMPLIANCE: This intentionally stores ONLY Synclat-generated analysis,
 * scores, summaries, user brief text, and basic track title/artist metadata.
 * It NEVER stores full lyrics, raw Musixmatch API responses, lyric context
 * snippets, or API keys.
 */
export type SavedReport = {
  id: string;
  createdAt: string; // ISO timestamp
  /** Archived reports are hidden from the default Reports list (restorable). */
  archived?: boolean;
  brief: Brief;
  track: {
    trackId: string;
    title: string;
    artist: string;
    language?: string;
    bpm?: number;
    explicit?: boolean;
    source: NormalizedTrack["source"];
  };
  analysis: SyncFitAnalysis;
  marketSignal: MarketSignal;
  audioReadiness: AudioReadiness;
  usedDemoData: AnalyzeResult["usedDemoData"];
};
