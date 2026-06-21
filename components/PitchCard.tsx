import * as React from "react";
import type { SavedReport } from "@/lib/types";
import { SyncFitScoreGauge } from "./SyncFitScoreGauge";
import { TrackCover, StreamsBadge } from "./TrackCover";
import { SpotifyPlay } from "./SpotifyPlay";
import { BrandLogo } from "./BrandLogo";
import { StarButton } from "./favourites";
import { CheckIcon } from "./icons";

function MetaPill({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs">
      <span className="text-soft">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </span>
  );
}

const SAFETY_STYLE: Record<string, string> = {
  Low: "text-lime-300 bg-lime-500/10 ring-lime-500/30",
  Medium: "text-amber-200 bg-amber-500/10 ring-amber-500/30",
  High: "text-red-200 bg-red-500/10 ring-red-500/30",
};

/**
 * Single, self-contained pitch card — every key detail of a report presented in
 * one cohesive card. Used by the Pitch section and the public /share page.
 */
export function PitchCard({
  report,
  variant = "card",
  public: isPublic = false,
}: {
  report: SavedReport;
  variant?: "card" | "glass";
  /** On public /share surfaces, hide the verbatim creative brief (private input). */
  public?: boolean;
}) {
  const { track, brief, analysis, marketSignal } = report;
  const created = new Date(report.createdAt).toLocaleString("en-US", {
    dateStyle: "medium",
  });
  const safety = SAFETY_STYLE[analysis.brandSafety.level] ?? SAFETY_STYLE.Medium;

  return (
    <div
      className={
        variant === "glass"
          ? "sf-liquid overflow-hidden rounded-2xl"
          : "sf-card overflow-hidden"
      }
    >
      {/* Header — cover, track + inline Play, score */}
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <TrackCover url={marketSignal.artworkUrl} className="h-20 w-20" />
          <div className="min-w-0">
            <p className="sf-eyebrow">SyncFit Pitch</p>
            {/* Track name + Play side by side to save vertical space */}
            <div className="mt-0.5 flex items-center gap-2.5">
              <h1 className="min-w-0 line-clamp-2 break-words text-xl font-bold text-white sm:text-2xl">
                {track.title}
              </h1>
              <SpotifyPlay
                title={track.title}
                artist={track.artist}
                spotifyId={marketSignal.spotifyTrackId}
                label="Play"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-lime-400/40 bg-lime-400/10 px-3 py-1 text-xs font-semibold text-lime-200 transition hover:border-lime-400/70 hover:bg-lime-400/20 hover:text-lime-100"
              />
              <StarButton
                track={{
                  title: track.title,
                  artist: track.artist,
                  score: analysis.syncFitScore,
                  scoreLabel: analysis.scoreLabel,
                  genre: track.genre,
                  spotifyTrackId: marketSignal.spotifyTrackId,
                  artworkUrl: marketSignal.artworkUrl,
                }}
              />
            </div>
            <p className="truncate text-sm text-soft">{track.artist}</p>
            <div className="mt-1">
              <StreamsBadge
                streams={marketSignal.streams}
                status={
                  marketSignal.status !== "Unknown" ? marketSignal.status : undefined
                }
              />
            </div>
          </div>
        </div>
        <div className="w-full shrink-0 self-center sm:w-60">
          <SyncFitScoreGauge
            score={analysis.syncFitScore}
            label={analysis.scoreLabel}
          />
        </div>
      </div>

      {/* Brand capsule — logo · name · what they do (slick, minimal) */}
      {analysis.brand && (
        <div className="px-5 pb-4 sm:px-6">
          <div className="sf-liquid inline-flex max-w-full items-center gap-2.5 rounded-full border border-white/10 py-1.5 pl-1.5 pr-4">
            <BrandLogo brand={analysis.brand} className="h-9 w-9" />
            <span className="min-w-0 text-xs leading-tight">
              <span className="font-semibold text-white">{analysis.brand.name}</span>
              {analysis.brand.blurb ? (
                <span className="text-soft"> · {analysis.brand.blurb}</span>
              ) : null}
            </span>
          </div>
        </div>
      )}

      {/* Meta pills — track metadata only (brief fields kept internal) */}
      <div className="flex flex-wrap gap-2 px-5 pb-5 sm:px-6">
        <MetaPill label="Language" value={track.language || "—"} />
        {track.bpm != null && <MetaPill label="BPM" value={track.bpm} />}
        <MetaPill
          label="Explicit"
          value={track.explicit == null ? "—" : track.explicit ? "Yes" : "No"}
        />
      </div>

      {/* The pitch */}
      <div className="border-t border-white/[0.06] px-5 py-5 sm:px-6">
        <p className="sf-eyebrow mb-2">The pitch</p>
        <p className="text-sm leading-relaxed text-soft">{analysis.pitchSummary}</p>
        {analysis.bestUseCases?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {analysis.bestUseCases.map((u, i) => (
              <span key={i} className="sf-pill text-[11px]">
                {u}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Brand safety + brief (brief hidden on public share links) */}
      <div className={"grid grid-cols-1" + (isPublic ? "" : " sm:grid-cols-2")}>
        <div className="border-t border-white/[0.06] px-5 py-5 sm:px-6">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="sf-eyebrow">Brand safety</p>
            <span
              className={
                "rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset " +
                safety
              }
            >
              {analysis.brandSafety.level}
            </span>
          </div>
          <ul className="space-y-1.5">
            {analysis.brandSafety.notes.slice(0, 3).map((n, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-soft">
                <CheckIcon
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-300"
                  aria-hidden
                />
                {n}
              </li>
            ))}
          </ul>
        </div>
        {!isPublic && (
          <div className="border-t border-white/[0.06] px-5 py-5 sm:border-l sm:px-6">
            <p className="sf-eyebrow mb-2">Creative brief</p>
            <p className="line-clamp-4 text-xs leading-relaxed text-soft">
              {brief.brief || "—"}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] px-5 py-3 text-[11px] text-soft sm:px-6">
        <span>SyncFit by Synclat</span>
        <span>{created}</span>
      </div>
    </div>
  );
}
