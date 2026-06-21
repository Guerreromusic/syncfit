// =============================================================================
// SyncFit by Synclat — shared TypeScript types
// =============================================================================

/** Project / placement types a brief can target. */
export type ProjectType = "Ad" | "Film" | "TV" | "Trailer" | "Game" | "Social";

export type Region =
  | "Colombia"
  | "Mexico"
  | "Brazil"
  | "Argentina"
  | "Chile"
  | "Peru"
  | "Venezuela"
  | "Dominican Republic"
  | "Puerto Rico"
  | "Central America"
  | "Caribbean"
  | "Spain"
  | "US Latin"
  | "Europe"
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
/** Lyric mood/emotion (Musixmatch `track.lyrics.mood.get`, premium plans only). */
export type TrackMood = { label?: string; valence?: number; arousal?: number };

/** Where a track has cultural/commercial influence, anchored on its language. */
export type GeoRegion = { id: string; strength: number; reason: string };
export type GeoInfluence = {
  summary: string;
  regions: GeoRegion[];
};

/** Aggregate LISTENER demographics for a track (AI estimate, anchored on the
 * Musixmatch language/genre) — used for a minimal audience-analytics card. */
export type AgeBand = { label: string; share: number };
export type Demographics = {
  summary: string;
  /** Age distribution; shares roughly sum to 100. */
  ageBands: AgeBand[];
  /** One respectful, aggregate note on cultural / faith resonance for placement
   * context. Empty when not notable. */
  faithResonance: string;
  /** 3–5 short points on who the track appeals to and why. */
  appeal: string[];
};

export type RegionDetail = {
  id: string;
  strength: number;
  reason: string;
  religion: string;
  ageSkew: string;
  topBrands: string[];
  competitors: string[];
  marketNotes: string;
};

export type WorldIntelligence = {
  available: boolean;
  summary: string;
  regions: RegionDetail[];
  ageBands: AgeBand[];
  faithResonance: string;
  appeal: string[];
};

/** Credits & rights (MusicBrainz, keyless) — not available via Spotify's API. */
export type TrackCredits = {
  writers?: string[]; // composers / lyricists / songwriters
  producers?: string[];
  label?: string;
  releaseDate?: string;
};

export type NormalizedTrack = {
  trackId: string;
  title: string;
  artist: string;
  album?: string;
  language?: string;
  explicit?: boolean;
  bpm?: number;
  genre?: string;
  // Richer Musixmatch metadata (all read from the track node, no premium needed
  // except `mood`). Each is optional — demo/manual tracks won't carry them.
  genres?: string[]; // full genre list (extended names)
  popularity?: number; // track_rating, 0–100
  durationSec?: number; // track_length
  instrumental?: boolean;
  isrc?: string; // recording id supervisors use for licensing
  spotifyId?: string; // track_spotify_id (direct from Musixmatch)
  artworkUrl?: string; // album cover art
  favourites?: number; // num_favourite
  hasLyrics?: boolean;
  hasSubtitles?: boolean; // line-synced lyrics available
  hasRichsync?: boolean; // word-synced (karaoke) lyrics available
  mood?: TrackMood | null; // premium; null/absent when not on plan
  credits?: TrackCredits | null; // writers / producers / label (MusicBrainz)
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
/** Cross-platform streaming + popularity metrics pulled live from Songstats. */
export type StreamMetrics = {
  totalStreams?: number | null;
  spotifyPopularity?: number | null; // 0-100
  spotifyStreams?: number | null;
  playlists?: number | null;
  playlistReach?: number | null;
  shazams?: number | null;
  youtubeViews?: number | null;
  tiktokViews?: number | null;
};

export type MarketSignal = {
  status: "Unknown" | "Emerging" | "Rising" | "Established";
  summary: string;
  confidence: number;
  /** Cover artwork URL (Songstats `avatar`), when available. */
  artworkUrl?: string | null;
  /** Spotify track id (from Songstats links) for an embedded 30s preview. */
  spotifyTrackId?: string | null;
  /** Total streams (Songstats), when available — shown next to the artwork. */
  streams?: number | null;
  /** Full Songstats streaming + popularity metrics, when available. */
  metrics?: StreamMetrics | null;
};

/** Internal audio-readiness placeholder (not surfaced in the UI). */
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
  /** Short AI-generated name for the brief/placement (the report title). */
  briefName: string;
  /** Brand named in the brief, for showing its logo. Null when none is mentioned. */
  brand?: { name: string; domain: string; blurb?: string } | null;
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
  // ---- Enriched by the API team so results are REAL + accurate, not guesses ----
  /** Confirmed to exist in the Musixmatch catalogue (false = unverified). */
  verified?: boolean;
  genre?: string; // Musixmatch
  explicit?: boolean; // Musixmatch
  popularity?: number; // Musixmatch track rating 0–100
  streams?: number | null; // Songstats
  marketStatus?: MarketSignal["status"]; // Songstats
  spotifyTrackId?: string | null;
  artworkUrl?: string | null;
};

/** Result of TrackFit discovery: up to 10 tracks ranked highest → lowest. */
export type DiscoverResult = {
  tracks: RankedTrack[];
  openrouterError?: string | null;
  modelUsed?: string | null;
  usedDemoData: { openrouter: boolean };
};

/** One turn in the per-card "Ask AI" conversation about a track. */
export type TrackQAMessage = { role: "user" | "assistant"; content: string };

/** Everything the LLM needs to answer questions about a specific result card. */
export type TrackQAContext = {
  title: string;
  artist: string;
  brief?: string;
  language?: string;
  genre?: string;
  syncFitScore?: number;
  scoreLabel?: string;
  reason?: string;
  bestUse?: string;
  brandSafety?: string;
  pitchSummary?: string;
};

/** A trending Latin track card (curated seed enriched with live Songstats data). */
export type TrendingTrack = {
  title: string;
  artist: string;
  artworkUrl: string | null;
  streams: number | null;
  status: MarketSignal["status"];
  /** Latin sub-genre this track represents (Reggaeton, Salsa, …). */
  genre?: string;
  /** Spotify track id (from Songstats links) for inline playback. */
  spotifyTrackId?: string | null;
};

/** Whether each provider is wired up. Shown in the API Status panel. */
export type ApiKey =
  | "musixmatch"
  | "openrouter"
  | "songstats"
  | "spotify"
  | "elevenlabs"
  | "musicbrainz"
  | "previews"
  | "logos";

export type ApiStatusState =
  | "connected"
  | "missing"
  | "optional"
  | "demo";

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
  /** Public pitch-share token. Set when the user generates a share link. */
  shareToken?: string;
  /** AI-generated brief name (the report title). Editable; falls back to the
   * analysis briefName, then the track title for older reports. */
  name?: string;
  /** Campaign banner image URL (generated for the pitch by Higgsfield). */
  bannerUrl?: string;
  brief: Brief;
  track: {
    trackId: string;
    title: string;
    artist: string;
    language?: string;
    bpm?: number;
    explicit?: boolean;
    genre?: string;
    popularity?: number;
    durationSec?: number;
    instrumental?: boolean;
    isrc?: string;
    favourites?: number;
    hasLyrics?: boolean;
    hasSubtitles?: boolean;
    hasRichsync?: boolean;
    mood?: TrackMood | null;
    credits?: TrackCredits | null;
    source: NormalizedTrack["source"];
  };
  analysis: SyncFitAnalysis;
  marketSignal: MarketSignal;
  audioReadiness: AudioReadiness;
  usedDemoData: AnalyzeResult["usedDemoData"];
};

/**
 * A pitch PROJECT — a named bundle of saved reports pitched together. The
 * project view shows each track as a swipeable tab.
 */
export type PitchProject = {
  id: string;
  name: string;
  createdAt: string; // ISO timestamp
  /** Archived projects are hidden from the default Projects list (restorable). */
  archived?: boolean;
  /** Ordered report ids that make up the project's tabs. */
  reportIds: string[];
  /** Public share token for the /share/project/[token] link. */
  shareToken?: string;
};
