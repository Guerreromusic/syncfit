import * as React from "react";
import type { SuggestedAlternative, Brief } from "@/lib/types";
import { WaveIcon } from "./icons";
import { DeployAlternativeButton } from "./DeployAlternativeButton";
import { SpotifyPlay } from "./SpotifyPlay";
import { StarButton } from "./favourites";

export function SuggestedAlternatives({
  alternatives,
  brief,
  bare = false,
}: {
  alternatives?: SuggestedAlternative[];
  /** Originating brief — carried into Research when an alternative is deployed. */
  brief?: Brief;
  bare?: boolean;
}) {
  const items = alternatives ?? [];
  return (
    <div className={bare ? "sf-glass-soft p-5" : "sf-card sf-card-pad"}>
      <div className="mb-3 flex items-center gap-2">
        <WaveIcon className="h-5 w-5 text-purple-300" aria-hidden />
        <h3 className="text-sm font-semibold text-white">Suggested Alternatives</h3>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-600 bg-ink-900/40 p-4 text-sm text-soft">
          No alternatives generated for this result. With OpenRouter connected,
          SyncFit suggests up to three comparable tracks or styles here.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((alt, i) => (
            <li
              key={i}
              className="flex items-start justify-between gap-3 rounded-xl border border-ink-700/70 bg-ink-900/40 p-3.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{alt.title}</p>
                <p className="text-xs text-soft">{alt.artist}</p>
                {alt.reason && (
                  <p className="mt-1 text-xs leading-relaxed text-soft/90">
                    {alt.reason}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="rounded-lg bg-purple-600/20 px-2.5 py-1 text-xs font-semibold tabular-nums text-purple-100">
                  {alt.matchScore}
                </span>
                <div className="flex items-center gap-1.5">
                  <StarButton track={{ title: alt.title, artist: alt.artist, score: alt.matchScore }} />
                  <SpotifyPlay title={alt.title} artist={alt.artist} mode="link" />
                  <DeployAlternativeButton
                    title={alt.title}
                    artist={alt.artist}
                    brief={brief}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
