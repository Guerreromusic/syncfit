import * as React from "react";
import type { SyncFitAnalysis } from "@/lib/types";
import { ShieldIcon, CheckIcon } from "./icons";

const LEVEL_STYLES: Record<string, { text: string; bg: string; ring: string }> = {
  High: { text: "text-lime-300", bg: "bg-lime-500/10", ring: "ring-lime-500/30" },
  Medium: {
    text: "text-amber-300",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/30",
  },
  Low: { text: "text-red-300", bg: "bg-red-500/10", ring: "ring-red-500/30" },
};

export function BrandSafetyCard({
  brandSafety,
  bare = false,
}: {
  brandSafety: SyncFitAnalysis["brandSafety"];
  bare?: boolean;
}) {
  const style = LEVEL_STYLES[brandSafety.level] ?? LEVEL_STYLES.Medium;
  return (
    <div className={bare ? "sf-glass-soft p-5" : "sf-card sf-card-pad"}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldIcon className="h-5 w-5 text-purple-300" aria-hidden />
          <div>
            <h3 className="text-sm font-semibold text-white">Brand Safety</h3>
            <p className="text-[11px] text-soft">Assessed content suitability</p>
          </div>
        </div>
        <span
          className={
            "rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset " +
            style.text +
            " " +
            style.bg +
            " " +
            style.ring
          }
        >
          {brandSafety.level}
        </span>
      </div>
      <ul className="space-y-2">
        {brandSafety.notes.map((note, i) => (
          <li key={i} className="flex gap-2 text-sm text-soft">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-lime-400" aria-hidden />
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
