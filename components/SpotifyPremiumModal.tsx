"use client";

import * as React from "react";
import { usePlayer } from "./PlayerContext";

function SpotifyWaveIcon() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden>
      <circle cx="20" cy="20" r="20" fill="#1DB954" />
      <g stroke="white" strokeWidth="2.4" strokeLinecap="round" fill="none">
        <path d="M 10,23 Q 16,18 24,21 Q 31,23 36,20" />
        <path d="M 11,18 Q 17,14 24,16 Q 31,18 36,16" />
        <path d="M 13,13 Q 18,10 24,12 Q 30,13 34,12" />
      </g>
    </svg>
  );
}

/**
 * Shown once per device on the first track-play press.
 * Gives the user the choice to connect Spotify Premium (full tracks)
 * or continue with the 30-second preview. Controlled by PlayerContext.
 */
export function SpotifyPremiumModal() {
  const { showSpotifyPrompt, confirmSpotifyConnect, skipToPreview } = usePlayer();

  if (!showSpotifyPrompt) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="spotify-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) skipToPreview();
      }}
    >
      {/* Card */}
      <div className="relative mx-4 w-full max-w-sm rounded-3xl border border-white/10 bg-ink-900/95 p-8 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md">
        {/* Glow accent */}
        <div className="pointer-events-none absolute -top-12 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-[#1DB954]/25 blur-3xl" />

        {/* Spotify badge */}
        <div className="mb-5 flex justify-center">
          <div className="relative">
            <SpotifyWaveIcon />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-lime-400 text-[8px] font-black text-ink-950">
              ✓
            </span>
          </div>
        </div>

        <h2
          id="spotify-modal-title"
          className="mb-2 text-center text-xl font-bold text-white"
        >
          Hear the full track
        </h2>
        <p className="mb-6 text-center text-sm leading-relaxed text-soft">
          Connect <span className="font-semibold text-white">Spotify Premium</span>{" "}
          to play tracks in full — directly inside SyncFit.{" "}
          Without it, tracks play as 30-second previews.
        </p>

        {/* Feature list */}
        <ul className="mb-6 space-y-2">
          {[
            "Full-length playback, right here",
            "Queue up to 3 tracks side-by-side",
            "No redirects — stays in SyncFit",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-xs text-soft">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#1DB954]/20 text-[10px] text-[#1DB954]">
                ♪
              </span>
              {f}
            </li>
          ))}
        </ul>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={confirmSpotifyConnect}
          className="mb-3 w-full rounded-2xl bg-[#1DB954] py-3 text-sm font-bold text-white transition hover:bg-[#1ed760] active:scale-[0.98]"
        >
          Connect Spotify Premium
        </button>

        {/* Secondary */}
        <button
          type="button"
          onClick={skipToPreview}
          className="w-full rounded-2xl border border-white/10 py-2.5 text-sm font-medium text-soft transition hover:border-white/25 hover:text-white"
        >
          Play 30s preview
        </button>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-soft/60">
          Requires an active Spotify Premium subscription.
          <br />
          You&apos;ll only see this once per device.
        </p>
      </div>
    </div>
  );
}
