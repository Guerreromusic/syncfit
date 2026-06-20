import * as React from "react";
import type { ScoreLabel } from "@/lib/types";

function bandColor(score: number): { stroke: string; text: string } {
  if (score >= 85) return { stroke: "#BEF264", text: "text-lime-300" }; // Excellent
  if (score >= 70) return { stroke: "#A3E635", text: "text-lime-400" }; // Strong
  if (score >= 50) return { stroke: "#A983FF", text: "text-purple-200" }; // Possible
  return { stroke: "#F87171", text: "text-red-300" }; // Weak
}

/**
 * SyncFit Score as a horizontal progress bar. Fills the width of its container;
 * pass `size` to cap the max width in px.
 */
export function SyncFitScoreGauge({
  score,
  label,
  size,
}: {
  score: number;
  label: ScoreLabel;
  /** Optional max width (px). Defaults to filling the container. */
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const colors = bandColor(clamped);

  return (
    <div className="w-full" style={size ? { maxWidth: size } : undefined}>
      <div className="mb-1.5 flex items-end justify-between gap-3">
        <p className="sf-eyebrow">SyncFit Score</p>
        <span className="tabular-nums leading-none">
          <span className="text-2xl font-bold text-white">{clamped}</span>
          <span className="text-xs font-medium text-soft"> / 100</span>
        </span>
      </div>
      <div
        className="h-3 w-full overflow-hidden rounded-full bg-ink-800 ring-1 ring-inset ring-white/5"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="SyncFit Score"
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${clamped}%`,
            backgroundColor: colors.stroke,
            transition: "width 0.8s ease",
          }}
        />
      </div>
      <p className={"mt-1.5 text-sm font-semibold " + colors.text}>{label}</p>
    </div>
  );
}
