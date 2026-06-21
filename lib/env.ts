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
  spotifyClientId: () => process.env.SPOTIFY_CLIENT_ID?.trim() || "",
  spotifyClientSecret: () => process.env.SPOTIFY_CLIENT_SECRET?.trim() || "",
  elevenlabs: () => process.env.ELEVENLABS_API_KEY?.trim() || "",
  // Default ElevenLabs voice ("Rachel"); override with ELEVENLABS_VOICE_ID.
  elevenlabsVoice: () =>
    process.env.ELEVENLABS_VOICE_ID?.trim() || "21m00Tcm4TlvDq8ikWAM",
};

export const isConfigured = {
  musixmatch: () => has(process.env.MUSIXMATCH_API_KEY),
  openrouter: () => has(process.env.OPENROUTER_API_KEY),
  songstats: () => has(process.env.SONGSTATS_API_KEY),
  // Spotify uses app-level Client Credentials — both id AND secret are required.
  spotify: () =>
    has(process.env.SPOTIFY_CLIENT_ID) && has(process.env.SPOTIFY_CLIENT_SECRET),
  elevenlabs: () => has(process.env.ELEVENLABS_API_KEY),
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
      key: "spotify",
      label: "Spotify",
      state: isConfigured.spotify() ? "connected" : "optional",
      note: isConfigured.spotify()
        ? "Connected — metadata/BPM fallback + full-track playback (Premium · Connect Spotify)."
        : "Optional — set SPOTIFY_CLIENT_ID & SPOTIFY_CLIENT_SECRET for metadata + full-track playback.",
    },
    {
      key: "elevenlabs",
      label: "ElevenLabs",
      state: isConfigured.elevenlabs() ? "connected" : "optional",
      note: isConfigured.elevenlabs()
        ? "Connected — read the pitch & results aloud (text-to-speech)."
        : "Optional — set ELEVENLABS_API_KEY to read the pitch & results aloud.",
    },
    {
      key: "musicbrainz",
      label: "MusicBrainz",
      state: "connected",
      note: "Connected — writers, producers & label credits.",
    },
    {
      key: "previews",
      label: "Previews & artwork",
      state: "connected",
      note: "Connected — keyless iTunes / Deezer for in-app playback & cover art.",
    },
    {
      key: "logos",
      label: "Brand logos",
      state: "connected",
      note: "Connected — keyless brand logos from the brief (DuckDuckGo / Google).",
    },
  ];
}
