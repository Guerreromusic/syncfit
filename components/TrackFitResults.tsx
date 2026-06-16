"use client";

import * as React from "react";
import type { RankedTrack } from "@/lib/types";
import { DemoBadge } from "./DemoBadge";
import { modelLabel } from "@/lib/models";

function scoreColor(score: number): string {
  if (score >= 85) return "text-lime-300";
  if (score >= 70) return "text-lime-400";
  if (score >= 50) return "text-purple-200";
  return "text-red-300";
}

/**
 * TrackFit discovery output: up to 10 AI-recommended tracks ranked highest →
 * lowest. Each row can be "scored" — clicking loads it into the form and runs a
 * full single-track analysis.
 */
export function TrackFitResults({
  tracks,
  onPick,
  demo,
  modelUsed,
  openrouterError,
}: {
  tracks: RankedTrack[];
  onPick: (t: RankedTrack) => void;
  demo: boolean;
  modelUsed?: string | null;
  openrouterError?: string | null;
}) {
  return (
    <div className="space-y-4 animate-fade-up">
      <div className="sf-glass-soft p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="sf-eyebrow">TrackFit · Top {tracks.length}</p>
            <h2 className="mt-1 text-xl font-bold text-white">
              Best-fitting tracks for your brief
            </h2>
            <p className="mt-1 text-sm text-soft">
              Ranked highest → lowest. Pick one to run a full SyncFit breakdown.
            </p>
          </div>
          {modelUsed && (
            <span className="sf-pill border-lime-500/40 text-lime-300">
              Model · {modelLabel(modelUsed)}
            </span>
          )}
        </div>
        {openrouterError && (
          <p role="alert" className="mt-3 text-xs leading-relaxed text-amber-100">
            <span className="font-semibold">AI call failed:</span> {openrouterError}.
            Showing demo recommendations.
          </p>
        )}
        <div className="mt-3">
          <DemoBadge musixmatch={false} openrouter={demo && !openrouterError} />
        </div>
      </div>

      <ol className="space-y-2.5">
        {tracks.map((t, i) => (
          <li key={`${t.title}-${i}`} className="sf-glass-soft p-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-600/25 text-xs font-bold text-purple-100 ring-1 ring-inset ring-purple-400/40">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{t.title}</p>
                <p className="truncate text-xs text-soft">
                  {t.artist}
                  {t.language ? ` · ${t.language}` : ""}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={
                    "text-xl font-bold tabular-nums " + scoreColor(t.syncFitScore)
                  }
                >
                  {t.syncFitScore}
                </span>
                <p className="text-[10px] text-soft">{t.scoreLabel}</p>
              </div>
            </div>

            {t.reason && (
              <p className="mt-2 text-xs leading-relaxed text-soft">{t.reason}</p>
            )}

            <div className="mt-2.5 flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap gap-1.5">
                {t.bestUse && <span className="sf-pill text-[11px]">{t.bestUse}</span>}
                {t.brandSafety && (
                  <span className="sf-pill text-[11px]">Safety · {t.brandSafety}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onPick(t)}
                className="shrink-0 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-soft transition hover:border-purple-400/50 hover:text-white"
              >
                Score this →
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
