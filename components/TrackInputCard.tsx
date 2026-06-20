"use client";

import * as React from "react";

export type TrackInput = {
  title: string;
  artist: string;
  trackId: string;
  previewUrl: string;
};

/**
 * Optional track input, collapsed into a dropdown so the Research console stays
 * focused on the brief. Expand it to score a specific song instead of running
 * open-ended discovery. No "Search" button — Run does the Musixmatch lookup
 * server-side as part of the one request.
 */
export function TrackInputCard({
  input,
  onField,
  bare = false,
}: {
  input: TrackInput;
  onField: (field: keyof TrackInput, value: string) => void;
  /** Render without the card shell (for use inside a single glass card). */
  bare?: boolean;
}) {
  const hasValue = Boolean(
    input.title.trim() || input.artist.trim() || input.trackId.trim(),
  );

  return (
    <details className={"group" + (bare ? "" : " sf-card sf-card-pad")} open={hasValue}>
      <summary className="flex cursor-pointer list-none select-none items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold leading-tight text-white">
            Name a specific track{" "}
            <span className="font-normal text-soft">(optional)</span>
          </h2>
          <p className="text-xs text-soft">
            Leave closed to discover the 10 best fits — or open it to score one song.
          </p>
        </div>
        <span
          aria-hidden
          className="shrink-0 rounded-lg border border-white/10 px-2 py-1 text-[11px] font-medium text-soft transition-transform duration-200 group-open:rotate-180"
        >
          ▾
        </span>
      </summary>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="sf-label">Song title</span>
          <input
            className="sf-input"
            placeholder="La Noche Latina"
            value={input.title}
            onChange={(e) => onField("title", e.target.value)}
          />
        </label>
        <label className="block">
          <span className="sf-label">Artist name</span>
          <input
            className="sf-input"
            placeholder="Demo Artist"
            value={input.artist}
            onChange={(e) => onField("artist", e.target.value)}
          />
        </label>
      </div>

      {/* Advanced fields tucked away to keep the form minimal */}
      <details className="group/adv mt-3">
        <summary className="cursor-pointer select-none list-none text-xs font-medium text-soft transition hover:text-white">
          Advanced — Musixmatch track ID &amp; preview URL
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="sf-label">Musixmatch track ID</span>
            <input
              className="sf-input"
              placeholder="e.g. 12345678"
              value={input.trackId}
              onChange={(e) => onField("trackId", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="sf-label">Preview URL</span>
            <input
              className="sf-input"
              placeholder="https://…/preview.mp3"
              value={input.previewUrl}
              onChange={(e) => onField("previewUrl", e.target.value)}
            />
          </label>
        </div>
      </details>
    </details>
  );
}
