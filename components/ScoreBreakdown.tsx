import * as React from "react";
import type { ScoreBreakdown as ScoreBreakdownType } from "@/lib/types";
import { SCORE_MODEL } from "@/lib/scoring";

export function ScoreBreakdown({ breakdown }: { breakdown: ScoreBreakdownType }) {
  return (
    <div className="space-y-3.5">
      {SCORE_MODEL.map((cat) => {
        const value = breakdown[cat.key] ?? 0;
        const pct = Math.round((value / cat.max) * 100);
        return (
          <div key={cat.key}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-white">{cat.label}</span>
              <span className="text-xs tabular-nums text-soft">
                <span className="font-semibold text-purple-100">{value}</span>
                <span className="text-soft"> / {cat.max}</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink-700/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-lime-400 transition-[width] duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
