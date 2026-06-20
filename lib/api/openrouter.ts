// =============================================================================
// SyncFit by Synclat — OpenRouter adapter (AI reasoning layer)
// =============================================================================
// Runs SERVER-SIDE only. The OPENROUTER_API_KEY is read from process.env and
// never exposed to the browser.
//
// Takes the user brief + normalized Musixmatch metadata (+ optional Songstats
// and market signals) and returns a validated SyncFitAnalysis object.
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
  GeoInfluence,
  GeoRegion,
  MarketSignal,
  NormalizedTrack,
  RankedTrack,
  ScoreBreakdown,
  SyncFitAnalysis,
  TrackQAContext,
  TrackQAMessage,
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
      // Low reasoning effort keeps latency well under Vercel's 60s function cap
      // (gpt-5-nano/Gemini are reasoning models; ignored by non-reasoning models).
      reasoning: { effort: "low" },
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

  const brand =
    raw?.brand &&
    typeof raw.brand.name === "string" &&
    typeof raw.brand.domain === "string" &&
    raw.brand.name.trim() &&
    raw.brand.domain.trim()
      ? {
          name: raw.brand.name.trim(),
          domain: raw.brand.domain
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .replace(/\/.*$/, ""),
          blurb:
            typeof raw.brand.blurb === "string" ? raw.brand.blurb.trim() : "",
        }
      : null;

  return {
    briefName:
      typeof raw?.briefName === "string" ? raw.briefName.trim() : "",
    brand,
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

export type RunDiscoveryInput = { brief: Brief; model?: string; exclude?: string[] };

/**
 * Ask OpenRouter for the 10 best-fitting tracks for a brief, ranked
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
      // Low reasoning effort keeps latency well under Vercel's 60s function cap
      // (gpt-5-nano/Gemini are reasoning models; ignored by non-reasoning models).
      reasoning: { effort: "low" },
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: DISCOVER_SYSTEM_PROMPT },
        { role: "user", content: buildDiscoverUserPrompt(input.brief, input.exclude) },
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

// =============================================================================
// Lyric translation + brief-keyword highlighting (used on the full report).
// Operates ONLY on a SHORT lyric snippet (never full lyrics); nothing stored.
// =============================================================================

export type LyricMatch = {
  /** The matching word/short phrase (as it reads in the translation). */
  phrase: string;
  /** What the phrase means or refers to, in plain language. */
  meaning: string;
  /** Why it matches the creative brief (mood/theme/placement fit). */
  why: string;
};

export type LyricTranslation = {
  sourceLang: string;
  translation: string;
  keywords: string[];
  /** Explained brief-matching highlights — what each is and why it fits. */
  matches: LyricMatch[];
  /** One- to two-sentence overall read of how the lyric fits the brief. */
  matchSummary: string;
  /** Overall mood/tone of the lyric (1–3 words). */
  mood: string;
  /** Up to 5 short theme tags drawn from the lyric. */
  themes: string[];
  /** 1–2 sentence interpretation of what the lyric conveys (independent of brief). */
  analysis: string;
};

export async function runLyricTranslation(input: {
  snippet: string;
  brief: string;
  target?: string;
  model?: string;
}): Promise<LyricTranslation> {
  if (!isConfigured.openrouter()) throw new OpenRouterNotConfiguredError();

  const target = input.target || "English";
  const model = isAllowedModel(input.model) ? input.model : env.openrouterModel();

  const system = `You help music supervisors judge whether a song's lyric fits a creative brief. You receive a SHORT lyric snippet (NOT full lyrics) and a creative brief. Return ONLY a single JSON object:
{
  "sourceLang": string,        // language of the snippet, e.g. "Spanish"
  "translation": string,       // faithful, concise ${target} translation of the snippet
  "keywords": string[],        // up to 6 words/short phrases (as they read in the ${target} translation) that align with the brief's mood/theme — used to highlight the text
  "matches": [                 // explain up to 4 of those highlights
    {
      "phrase": string,        // the highlighted word/phrase (matching a keyword above)
      "meaning": string,       // what it means or refers to, in plain language (one short sentence)
      "why": string            // why it fits THIS brief — mood, theme, or placement (one short sentence)
    }
  ],
  "matchSummary": string,      // 1-2 sentences: overall, how well this lyric's theme fits the brief
  "mood": string,              // the lyric's overall mood/tone in 1-3 words, e.g. "celebratory, defiant"
  "themes": string[],          // up to 5 short theme tags drawn from the lyric, e.g. ["heartbreak","nightlife"]
  "analysis": string           // 1-2 sentences interpreting what the lyric conveys — imagery, narrative, tone — INDEPENDENT of the brief
}
The "keywords" and each "phrase" MUST be substrings of the translation so they can be highlighted. No commentary, no markdown, no extra fields. Do not expand beyond the snippet or invent lyrics.`;

  const user = `SNIPPET (short context, not full lyrics):
"""${input.snippet}"""

CREATIVE BRIEF:
${input.brief}

Translate the snippet to ${target}; analyse what the lyric conveys (mood, themes, meaning) on its own; then highlight the brief-matching keywords, explain what each highlight means and why it fits the brief, and give an overall match read.`;

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
      // Low reasoning effort keeps latency well under Vercel's 60s function cap
      // (gpt-5-nano/Gemini are reasoning models; ignored by non-reasoning models).
      reasoning: { effort: "low" },
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
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

  const raw: any = parseAnalysisJson(content);
  const matches: LyricMatch[] = Array.isArray(raw?.matches)
    ? raw.matches
        .filter((m: unknown) => m && typeof m === "object")
        .map((m: any) => ({
          phrase: typeof m?.phrase === "string" ? m.phrase : "",
          meaning: typeof m?.meaning === "string" ? m.meaning : "",
          why: typeof m?.why === "string" ? m.why : "",
        }))
        .filter((m: LyricMatch) => m.phrase && (m.meaning || m.why))
        .slice(0, 4)
    : [];
  return {
    sourceLang: typeof raw?.sourceLang === "string" ? raw.sourceLang : "Unknown",
    translation: typeof raw?.translation === "string" ? raw.translation : "",
    keywords: Array.isArray(raw?.keywords)
      ? raw.keywords.filter((k: unknown) => typeof k === "string").slice(0, 6)
      : [],
    matches,
    matchSummary: typeof raw?.matchSummary === "string" ? raw.matchSummary : "",
    mood: typeof raw?.mood === "string" ? raw.mood : "",
    themes: Array.isArray(raw?.themes)
      ? raw.themes.filter((t: unknown) => typeof t === "string" && t.trim()).slice(0, 5)
      : [],
    analysis: typeof raw?.analysis === "string" ? raw.analysis : "",
  };
}

// =============================================================================
// BRAND DNA — brands + placements a track naturally fits (from the track's
// metadata + a short Musixmatch lyric context). Pure AI recommendation.
// =============================================================================

export type BrandDNA = {
  /** One vivid sentence describing the track's brand personality / energy. */
  dna: string;
  /** Brands / brand archetypes the track fits. */
  brands: string[];
  /** Concrete placement / use cases. */
  uses: string[];
};

export async function runBrandDNA(input: {
  title: string;
  artist: string;
  genre?: string;
  snippet?: string;
  model?: string;
}): Promise<BrandDNA> {
  if (!isConfigured.openrouter()) throw new OpenRouterNotConfiguredError();
  const model = isAllowedModel(input.model) ? input.model : env.openrouterModel();

  const system = `You are a music-sync brand strategist for music from any country or genre. Given a track's metadata and a SHORT lyric context (NOT full lyrics), infer its "Brand DNA" — the kinds of brands and placements the track naturally fits for sync licensing. Return ONLY a single JSON object:
{
  "dna": string,        // one vivid sentence describing the track's brand personality and energy
  "brands": string[],   // exactly 6 recognizable brands or clear brand archetypes the track fits, e.g. "Corona", "Nike", "GoPro", "Sportswear", "Travel & tourism"
  "uses": string[]      // exactly 6 concrete placement / use cases, e.g. "Summer beach campaign", "Sports highlight reel", "Nightlife promo", "Road-trip travel ad"
}
No commentary, no markdown, no extra fields. Keep each brand and use short (1-4 words).`;

  const user = `TRACK: "${input.title}" by ${input.artist}${input.genre ? ` — genre: ${input.genre}` : ""}
${
    input.snippet
      ? `LYRIC CONTEXT (short, not full lyrics):\n"""${input.snippet}"""`
      : "No lyric context available — infer from the track title, artist, and genre."
  }

Give this track's Brand DNA: its brand personality, the brands it fits, and the placements it works for.`;

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
      // Low reasoning effort keeps latency well under Vercel's 60s function cap
      // (gpt-5-nano/Gemini are reasoning models; ignored by non-reasoning models).
      reasoning: { effort: "low" },
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
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

  const raw: any = parseAnalysisJson(content);
  const strList = (v: unknown): string[] =>
    Array.isArray(v)
      ? v.filter((x: unknown) => typeof x === "string" && x.trim()).slice(0, 6)
      : [];
  return {
    dna: typeof raw?.dna === "string" ? raw.dna : "",
    brands: strList(raw?.brands),
    uses: strList(raw?.uses),
  };
}

// =============================================================================
// GEO INFLUENCE — where in the world a track resonates, anchored on its LANGUAGE
// (from Musixmatch) plus genre / diaspora / cultural & religious context.
// =============================================================================

export const GEO_REGION_IDS = [
  "north_america",
  "latin_america",
  "caribbean",
  "western_europe",
  "iberia",
  "eastern_europe",
  "mena",
  "subsaharan_africa",
  "south_asia",
  "east_asia",
  "southeast_asia",
  "oceania",
] as const;

export async function runGeoInfluence(input: {
  title: string;
  artist: string;
  language?: string;
  genre?: string;
  model?: string;
}): Promise<GeoInfluence> {
  if (!isConfigured.openrouter()) throw new OpenRouterNotConfiguredError();
  const model = isAllowedModel(input.model) ? input.model : env.openrouterModel();

  const system = `You are a music-market analyst. Given a track plus its LANGUAGE and genre, estimate where in the WORLD it has real cultural/commercial influence or resonance for a sync placement, and WHY.

Anchor your reasoning on the song's LANGUAGE first (where that language is natively spoken AND its diaspora communities), then layer genre popularity, cultural or religious themes, and the artist's known reach. Be specific and honest — only include regions with genuine influence.

Return ONLY a single JSON object:
{
  "summary": string,    // one sentence on the track's global footprint
  "regions": [          // 3 to 8 regions, strongest first
    {
      "id": one of: ${GEO_REGION_IDS.join(", ")},
      "strength": number,   // 0-100 influence
      "reason": string      // short WHY — language spoken, diaspora, genre, culture, religion
    }
  ]
}
Use ONLY those exact region ids. No markdown, no commentary, no extra fields.`;

  const user = `TRACK: "${input.title}" by ${input.artist}${input.genre ? ` — genre: ${input.genre}` : ""}${input.language ? ` — language: ${input.language}` : ""}

Map this track's worldwide influence by region, with a short reason for each (lead with the language).`;

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
      reasoning: { effort: "low" },
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
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

  const raw: any = parseAnalysisJson(content);
  const allowed = new Set<string>(GEO_REGION_IDS);
  const regions: GeoRegion[] = Array.isArray(raw?.regions)
    ? raw.regions
        .filter((r: any) => r && allowed.has(r.id))
        .map((r: any) => ({
          id: String(r.id),
          strength: Math.max(0, Math.min(100, Math.round(Number(r.strength) || 0))),
          reason: typeof r.reason === "string" ? r.reason : "",
        }))
        // de-dup by id, strongest first
        .filter(
          (r: GeoRegion, i: number, arr: GeoRegion[]) =>
            arr.findIndex((x) => x.id === r.id) === i,
        )
        .sort((a: GeoRegion, b: GeoRegion) => b.strength - a.strength)
    : [];
  return {
    summary: typeof raw?.summary === "string" ? raw.summary : "",
    regions,
  };
}

// =============================================================================
// TRACK Q&A — per-card "Ask AI": answer a supervisor's questions about ONE track
// for a sync placement. Plain-text answers (not JSON), short and practical.
// =============================================================================

export async function runTrackQA(input: {
  context: TrackQAContext;
  messages: TrackQAMessage[];
  model?: string;
}): Promise<string> {
  if (!isConfigured.openrouter()) throw new OpenRouterNotConfiguredError();
  const model = isAllowedModel(input.model) ? input.model : env.openrouterModel();
  const c = input.context;

  const facts = [
    `TRACK: "${c.title}" by ${c.artist}`,
    c.genre ? `Genre: ${c.genre}` : "",
    c.language ? `Language: ${c.language}` : "",
    c.brief ? `Creative brief: ${c.brief}` : "",
    c.syncFitScore != null
      ? `SyncFit score: ${c.syncFitScore}/100${c.scoreLabel ? ` (${c.scoreLabel})` : ""}`
      : "",
    c.brandSafety ? `Brand safety read: ${c.brandSafety}` : "",
    c.reason ? `Why it fits: ${c.reason}` : "",
    c.bestUse ? `Best use: ${c.bestUse}` : "",
    c.pitchSummary ? `Pitch summary: ${c.pitchSummary}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const system = `You are SyncFit's music-supervision assistant. A music supervisor is evaluating ONE specific track for a sync placement (film, TV, ad, trailer, game, or branded content) and is asking you about it. Answer ONLY about this track and its fit for sync. Be concrete and practical — mood/energy, fit for the brief, brand safety, best scene or use case, audience, comparable tracks, and licensing considerations. Keep answers tight: 2–4 sentences unless asked to expand. NEVER reproduce full song lyrics. If you don't know a fact, say so plainly rather than inventing it.

CONTEXT:
${facts}`;

  // Keep only the recent turns to stay cheap and on-topic.
  const history = input.messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && m.content?.trim())
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content }));

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
      // Low reasoning effort keeps latency well under Vercel's 60s function cap
      // (gpt-5-nano/Gemini are reasoning models; ignored by non-reasoning models).
      reasoning: { effort: "low" },
      temperature: 0.5,
      messages: [{ role: "system", content: system }, ...history],
    }),
  });

  if (!res.ok) {
    const detail = await safeText(res);
    throw new Error(`OpenRouter HTTP ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  const json = await res.json();
  const content: string | undefined = json?.choices?.[0]?.message?.content;
  if (!content || !content.trim()) throw new Error("OpenRouter returned an empty response");
  return content.trim();
}

// =============================================================================
// Section assistant — a per-page chatbot about whatever section the user is on
// =============================================================================

export async function runSectionChat(input: {
  section: string;
  context: string;
  messages: { role: "user" | "assistant"; content: string }[];
  model?: string;
}): Promise<string> {
  if (!isConfigured.openrouter()) throw new OpenRouterNotConfiguredError();
  const model = isAllowedModel(input.model) ? input.model : env.openrouterModel();

  const system = `You are SyncFit's in-app assistant. SyncFit by Synclat is a worldwide music-sync research tool for music supervisors: it scores a track against a creative brief (a 0–100 SyncFit Score with a 7-part breakdown, a brand-safety read, and a pitch summary), discovers the 10 best-fitting tracks for a brief, lets users chat to research, star tracks, build shareable pitch projects (single track or multi-track swipeable), and benchmark up to 3 tracks head-to-head in Track Arena. Compliance: only short lyric context is ever used — never full lyrics.

The user is currently on the "${input.section}" section. ${input.context}

Help the user understand and use THIS section, and answer questions about SyncFit generally. Be concrete, friendly, and concise (2–4 sentences unless asked to expand). If you don't know something, say so rather than inventing it. NEVER reproduce full song lyrics.`;

  const history = input.messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && m.content?.trim())
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content }));

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
      reasoning: { effort: "low" },
      temperature: 0.6,
      messages: [{ role: "system", content: system }, ...history],
    }),
  });

  if (!res.ok) {
    const detail = await safeText(res);
    throw new Error(`OpenRouter HTTP ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  const json = await res.json();
  const content: string | undefined = json?.choices?.[0]?.message?.content;
  if (!content || !content.trim()) throw new Error("OpenRouter returned an empty response");
  return content.trim();
}
