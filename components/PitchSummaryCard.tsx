import * as React from "react";
import { DocIcon, CheckIcon } from "./icons";
import { ReadAloud } from "./ReadAloud";

export function PitchSummaryCard({
  pitchSummary,
  bestUseCases,
  supervisorNotes,
  bare = false,
}: {
  pitchSummary: string;
  bestUseCases: string[];
  supervisorNotes: string[];
  bare?: boolean;
}) {
  return (
    <div className={bare ? "sf-glass-soft p-5" : "sf-card sf-card-pad"}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <DocIcon className="h-5 w-5 text-purple-300" aria-hidden />
          <h3 className="text-sm font-semibold text-white">Pitch Summary</h3>
        </div>
        <ReadAloud text={pitchSummary} label="Read aloud" />
      </div>

      <p className="rounded-xl border border-purple-500/20 bg-purple-600/10 p-4 text-sm leading-relaxed text-purple-50">
        {pitchSummary || "No pitch summary available."}
      </p>

      {bestUseCases.length > 0 && (
        <div className="mt-5">
          <p className="sf-eyebrow mb-2">Best Use</p>
          <div className="flex flex-wrap gap-2">
            {bestUseCases.map((u, i) => (
              <span key={i} className="sf-pill text-purple-100">
                {u}
              </span>
            ))}
          </div>
        </div>
      )}

      {supervisorNotes.length > 0 && (
        <div className="mt-5">
          <p className="sf-eyebrow mb-2">Supervisor Notes</p>
          <ul className="space-y-2">
            {supervisorNotes.map((n, i) => (
              <li key={i} className="flex gap-2 text-sm text-soft">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-purple-300" aria-hidden />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
