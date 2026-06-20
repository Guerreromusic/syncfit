"use client";

import * as React from "react";
import type { RankedTrack, TrackQAContext } from "@/lib/types";
import { DemoBadge } from "./DemoBadge";
import { SpotifyPlay } from "./SpotifyPlay";
import { AskAI } from "./AskAI";
import { modelLabel } from "@/lib/models";

function scoreColor(score: number): string {
  if (score >= 85) return "text-lime-300";
  if (score >= 70) return "text-lime-400";
  if (score >= 50) return "text-purple-200";
  return "text-red-300";
}

function formatStreams(n: number | null | undefined): string | null {
  if (n == null || n <= 0) return null;
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/**
 * TrackFit discovery output: up to 10 AI-recommended tracks ranked highest →
 * lowest, laid out as a full-width 3-column grid. Each card can be "scored"
 * (runs a full single-track analysis) and has an inline "Ask AI" chat so the user
 * can interrogate that specific track via OpenRouter.
 */
export function TrackFitResults({
  tracks,
  onPick,
  demo,
  modelUsed,
  openrouterError,
  brief,
  model,
}: {
  tracks: RankedTrack[];
  onPick: (t: RankedTrack) => void;
  demo: boolean;
  modelUsed?: string | null;
  openrouterError?: string | null;
  brief?: string;
  model?: string;
}) {
  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="sf-eyebrow">TrackFit · Top {tracks.length}</p>
          <h2 className="mt-1 text-xl font-bold text-white">
            Best-fitting tracks for your brief
          </h2>
          <p className="mt-1 text-sm text-soft">
            Ranked highest → lowest. Score one for a full breakdown, or ask the AI
            about any track.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {modelUsed && (
            <span className="sf-pill border-lime-500/40 text-lime-300">
              Model · {modelLabel(modelUsed)}
            </span>
          )}
          <DemoBadge musixmatch={false} openrouter={demo && !openrouterError} />
        </div>
      </div>

      {openrouterError && (
        <p role="alert" className="text-xs leading-relaxed text-amber-100">
          <span className="font-semibold">AI call failed:</span> {openrouterError}.
          Showing demo recommendations.
        </p>
      )}

      <ol className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
        {tracks.map((t, i) => {
          const ctx: TrackQAContext = {
            title: t.title,
            artist: t.artist,
            brief,
            language: t.language,
            syncFitScore: t.syncFitScore,
            scoreLabel: t.scoreLabel,
            reason: t.reason,
            bestUse: t.bestUse,
            brandSafety: t.brandSafety,
          };
          return (
            <li key={`${t.title}-${i}`} className="sf-glass-soft flex flex-col p-3.5">
              <div className="flex items-center gap-2.5">
                {t.artworkUrl ? (
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.artworkUrl}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover ring-1 ring-inset ring-white/10"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute -left-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[9px] font-bold text-white ring-2 ring-ink-900">
                      {i + 1}
                    </span>
                  </div>
                ) : (
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-600/25 text-[11px] font-bold text-purple-100 ring-1 ring-inset ring-purple-400/40">
                    {i + 1}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{t.title}</p>
                  <p className="truncate text-xs text-soft">
                    {t.artist}
                    {t.language ? ` · ${t.language}` : ""}
                  </p>
                </div>
                <span
                  className={
                    "shrink-0 text-lg font-bold tabular-nums " + scoreColor(t.syncFitScore)
                  }
                  title={t.scoreLabel}
                >
                  {t.syncFitScore}
                </span>
              </div>

              {t.reason && (
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-soft">
                  {t.reason}
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {t.verified && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-lime-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-lime-300"
                    title="Confirmed in the Musixmatch catalogue"
                  >
                    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    Real
                  </span>
                )}
                {t.bestUse && <span className="sf-pill text-[10px]">{t.bestUse}</span>}
                {t.brandSafety && (
                  <span className="sf-pill text-[10px]">Safety · {t.brandSafety}</span>
                )}
                {formatStreams(t.streams) && (
                  <span className="sf-pill text-[10px]" title="Streams (Songstats)">
                    ▶ {formatStreams(t.streams)}
                  </span>
                )}
              </div>

              {/* Footer: play · score · ask — Ask AI expands full-width below */}
              <div className="mt-3 flex items-center gap-1.5">
                <SpotifyPlay
                  title={t.title}
                  artist={t.artist}
                  spotifyId={t.spotifyTrackId}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-soft transition hover:border-lime-400/50 hover:text-white"
                  label=""
                />
                <button
                  type="button"
                  onClick={() => onPick(t)}
                  className="rounded-lg border border-white/15 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-soft transition hover:border-purple-400/50 hover:text-white"
                >
                  Score →
                </button>
              </div>
              <div className="mt-2">
                <AskAI context={ctx} model={model} />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
