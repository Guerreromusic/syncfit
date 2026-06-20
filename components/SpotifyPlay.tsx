"use client";

import * as React from "react";
import { usePlayer, type PlayerTrack } from "./PlayerContext";

/**
 * Universal "play / pause this track" control. Plays IN the platform via the
 * docked mini-player — never navigates to Spotify. When this exact track is the
 * one loaded in the player, the button toggles PAUSE/RESUME and shows the right
 * icon; otherwise it starts the track. Any track is playable (keyless iTunes
 * preview resolution).
 *
 * `mode` / `compact` are accepted for call-site compatibility but no longer
 * change behaviour.
 */
export function SpotifyPlay({
  title,
  artist,
  spotifyId,
  className,
  label = "Play",
  queue,
  queueIndex,
}: {
  title: string;
  artist: string;
  spotifyId?: string | null;
  mode?: "embed" | "link";
  compact?: boolean;
  className?: string;
  label?: string;
  /** Optional play queue so the footer player's next/prev walk this list. */
  queue?: PlayerTrack[];
  queueIndex?: number;
}) {
  const { play, current, playing, togglePlayback } = usePlayer();

  const isCurrent =
    !!current &&
    current.title.toLowerCase() === title.toLowerCase() &&
    current.artist.toLowerCase() === artist.toLowerCase();
  const isPlaying = isCurrent && playing;

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isCurrent) {
      // This track is loaded → pause/resume it in place.
      togglePlayback();
    } else {
      play(
        { id: spotifyId || `${title}__${artist}`, title, artist },
        queue,
        queueIndex,
      );
    }
  }

  const base =
    "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-semibold text-soft transition hover:border-lime-400/50 hover:text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
      title={isPlaying ? `Pause ${title}` : `Play ${title}`}
      className={className ?? base}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
        {isPlaying ? (
          <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
        ) : (
          <path d="M8 5v14l11-7z" />
        )}
      </svg>
      {label ? (isPlaying && label === "Play" ? "Pause" : label) : null}
    </button>
  );
}
