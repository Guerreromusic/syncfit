import * as React from "react";
import type { AnalyzeResult, ScoreBreakdown } from "@/lib/types";
import { SCORE_MODEL } from "@/lib/scoring";
import { scoreColor } from "@/lib/scoreColor";
import { TrophyIcon, WaveIcon } from "./icons";
import { SpotifyPlay } from "./SpotifyPlay";

/** Side-by-side benchmark of up to 3 analyzed tracks against one brief. */
export function ArenaCompare({ results }: { results: AnalyzeResult[] }) {
  // Rank by SyncFit score (desc). Stable for ties.
  const ranked = results
    .map((r, i) => ({ r, i }))
    .sort((a, b) => b.r.analysis.syncFitScore - a.r.analysis.syncFitScore);
  const winnerScore = ranked[0]?.r.analysis.syncFitScore ?? 0;

  // Per-category best value (for highlighting), keyed by breakdown field.
  const bestByCat: Record<string, number> = {};
  for (const cat of SCORE_MODEL) {
    bestByCat[cat.key] = Math.max(
      ...results.map((r) => r.analysis.breakdown[cat.key as keyof ScoreBreakdown] ?? 0),
    );
  }

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Leaderboard */}
      <div
        className={
          "grid grid-cols-1 gap-3 " +
          (results.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")
        }
      >
        {ranked.map(({ r }, rank) => {
          // Guard on a positive score so an all-zero comparison shows no winner
          // (matches the breakdown table's `s > 0` highlight rule below).
          const isWinner =
            rank === 0 && r.analysis.syncFitScore === winnerScore && winnerScore > 0;
          return (
            <div
              key={r.track.trackId + rank}
              className={
                "sf-glass-soft p-4 " +
                (isWinner ? "ring-1 ring-inset ring-lime-500/40" : "")
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-600/25 text-xs font-bold text-purple-100 ring-1 ring-inset ring-purple-400/40">
                  {rank + 1}
                </span>
                {isWinner && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-lime-500/10 px-2 py-0.5 text-[11px] font-semibold text-lime-300 ring-1 ring-inset ring-lime-500/30">
                    <TrophyIcon className="h-3.5 w-3.5" aria-hidden />
                    Winner
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-3">
                {r.marketSignal.artworkUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.marketSignal.artworkUrl}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-inset ring-white/10"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-600/15 text-purple-200 ring-1 ring-inset ring-white/10">
                    <WaveIcon className="h-5 w-5" aria-hidden />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {r.track.title}
                  </p>
                  <p className="truncate text-xs text-soft">{r.track.artist}</p>
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span
                  className={
                    "text-3xl font-bold tabular-nums " +
                    scoreColor(r.analysis.syncFitScore)
                  }
                >
                  {r.analysis.syncFitScore}
                </span>
                <span className="text-xs text-soft">/ 100</span>
              </div>
              <p className="text-xs text-soft">{r.analysis.scoreLabel}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="sf-pill text-[11px]">
                  Safety · {r.analysis.brandSafety.level}
                </span>
              </div>
              {/* Unified in-app playback — every track plays through the docked
                  footer player, with or without a Spotify id (no external embed). */}
              <SpotifyPlay
                title={r.track.title}
                artist={r.track.artist}
                spotifyId={r.marketSignal.spotifyTrackId}
                className="mt-3"
              />
            </div>
          );
        })}
      </div>

      {/* Breakdown comparison */}
      <div className="sf-glass-soft p-5">
        <p className="sf-eyebrow mb-3">Score breakdown</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="py-2 pr-3 text-left text-xs font-medium text-soft">
                  Category
                </th>
                {results.map((r, i) => (
                  <th
                    key={i}
                    className="max-w-[120px] truncate px-3 py-2 text-right text-xs font-semibold text-white"
                    title={r.track.title}
                  >
                    {r.track.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SCORE_MODEL.map((cat) => (
                <tr key={cat.key} className="border-t border-white/[0.06]">
                  <td className="py-2 pr-3 text-left text-soft">
                    {cat.label}
                    <span className="text-soft/60"> /{cat.max}</span>
                  </td>
                  {results.map((r, i) => {
                    const v =
                      r.analysis.breakdown[cat.key as keyof ScoreBreakdown] ?? 0;
                    const best = v === bestByCat[cat.key] && v > 0;
                    return (
                      <td
                        key={i}
                        className={
                          "px-3 py-2 text-right tabular-nums " +
                          (best ? "font-semibold text-lime-300" : "text-white")
                        }
                      >
                        {v}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Total */}
              <tr className="border-t border-white/15">
                <td className="py-2.5 pr-3 text-left font-semibold text-white">
                  SyncFit Score
                </td>
                {results.map((r, i) => {
                  const s = r.analysis.syncFitScore;
                  const best = s === winnerScore && s > 0;
                  return (
                    <td
                      key={i}
                      className={
                        "px-3 py-2.5 text-right text-base font-bold tabular-nums " +
                        (best ? "text-lime-300" : scoreColor(s))
                      }
                    >
                      {s}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
