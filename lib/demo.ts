// =============================================================================
// SyncFit by Synclat — demo mode data
// =============================================================================
// These demo tracks let the entire app run end-to-end BEFORE any real API keys
// are added. They are 100% Synclat-authored placeholders — NOT Musixmatch data
// and NOT real lyrics. The short `lyricsContext` strings are original,
// synthetic descriptions written for the demo only.
// =============================================================================

import type { NormalizedTrack } from "./types";

export const DEMO_TRACKS: NormalizedTrack[] = [
  {
    trackId: "demo-1",
    title: "La Noche Latina",
    artist: "Demo Artist",
    album: "Synclat Demo Sessions",
    language: "es",
    explicit: false,
    bpm: 122,
    genre: "Latin Pop / Tropical",
    // Synthetic, original context written by Synclat for the demo — not lyrics.
    lyricsContext:
      "Celebratory, festive theme about a vibrant Latin night out — uplifting and inclusive.",
    source: "demo",
  },
  {
    trackId: "demo-2",
    title: "Ritmo del Barrio",
    artist: "Caribe Solar",
    album: "Synclat Demo Sessions",
    language: "es",
    explicit: false,
    bpm: 96,
    genre: "Urban / Reggaetón",
    lyricsContext:
      "Upbeat urban groove rooted in neighborhood pride and street energy — confident and rhythmic.",
    source: "demo",
  },
  {
    trackId: "demo-3",
    title: "Corazón de Oro",
    artist: "Luna Mar",
    album: "Synclat Demo Sessions",
    language: "es",
    explicit: false,
    bpm: 84,
    genre: "Latin Ballad",
    lyricsContext:
      "Emotional, romantic theme centered on devotion and a 'heart of gold' — warm and tender.",
    source: "demo",
  },
];

/** Find a demo track by id. */
export function getDemoTrack(trackId: string): NormalizedTrack | undefined {
  return DEMO_TRACKS.find((t) => t.trackId === trackId);
}

/**
 * Naive demo search: case-insensitive match on title/artist. If the query is
 * empty, returns all demo tracks. If nothing matches, returns all demo tracks
 * so the demo is never a dead end.
 */
export function searchDemoTracks(title?: string, artist?: string): NormalizedTrack[] {
  const q = `${title || ""} ${artist || ""}`.trim().toLowerCase();
  if (!q) return DEMO_TRACKS;
  const matches = DEMO_TRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      (title && t.title.toLowerCase().includes(title.toLowerCase())) ||
      (artist && t.artist.toLowerCase().includes(artist.toLowerCase())),
  );
  return matches.length > 0 ? matches : DEMO_TRACKS;
}
