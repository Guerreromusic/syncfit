"use client";

import * as React from "react";
import { StepHeader } from "./StepHeader";

export type TrackInput = {
  title: string;
  artist: string;
  trackId: string;
  previewUrl: string;
};

/**
 * Track input for the single-run flow. No separate "Search" button — Run SyncFit
 * does the Musixmatch lookup server-side as part of the one request.
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
  return (
    <div className={bare ? "" : "sf-card sf-card-pad"}>
      <StepHeader
        step={2}
        title="Track (optional)"
        subtitle="Name a song to score it — or leave blank and SyncFit finds the 10 best fits."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

      {/* Optional fields tucked away to keep the form minimal */}
      <details className="group mt-3">
        <summary className="cursor-pointer select-none text-xs font-medium text-soft transition hover:text-white">
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
    </div>
  );
}
