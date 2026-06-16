import * as React from "react";
import type { ScoreLabel } from "@/lib/types";

function bandColor(score: number): { stroke: string; text: string } {
  if (score >= 85) return { stroke: "#BEF264", text: "text-lime-300" }; // Excellent
  if (score >= 70) return { stroke: "#A3E635", text: "text-lime-400" }; // Strong
  if (score >= 50) return { stroke: "#A983FF", text: "text-purple-200" }; // Possible
  return { stroke: "#F87171", text: "text-red-300" }; // Weak
}

export function SyncFitScoreGauge({
  score,
  label,
  size = 168,
}: {
  score: number;
  label: ScoreLabel;
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  const colors = bandColor(clamped);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#1E1930"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold tabular-nums text-white">
            {clamped}
          </span>
          <span className="text-xs font-medium text-soft">/ 100</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <p className="sf-eyebrow">SyncFit Score</p>
        <p className={"mt-0.5 text-sm font-semibold " + colors.text}>{label}</p>
      </div>
    </div>
  );
}
