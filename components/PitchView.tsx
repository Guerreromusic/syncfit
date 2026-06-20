import { PitchCard } from "./PitchCard";
import { ShareButton } from "./ShareButton";
import { LyricTranslationCard } from "./LyricTranslationCard";
import { BrandDNACard } from "./BrandDNACard";
import { MegaphoneIcon } from "./icons";
import type { SavedReport } from "@/lib/types";

/**
 * The Pitch surface for a single report: a prominent "Pitch" action that mints a
 * public share link, above the full pitch card itself.
 */
export function PitchView({ report }: { report: SavedReport }) {
  return (
    <div className="space-y-5">
      <div className="sf-card sf-card-pad flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600/20 ring-1 ring-inset ring-purple-500/30">
            <MegaphoneIcon className="h-5 w-5 text-lime-400" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-white">
              Pitch “{report.track.title}”
            </h2>
            <p className="text-xs text-soft">
              Mint a public link anyone can open to view this pitch — scores and
              summaries only.
            </p>
          </div>
        </div>
        <ShareButton
          shareEndpoint={`/api/reports/${report.id}/share`}
          sharePrefix="/share/"
          initialToken={report.shareToken}
          label="Pitch"
        />
      </div>

      <PitchCard report={report} />

      {/* Lyrics + translation (brief-relevant phrases highlighted) and Brand DNA —
          short lyric context only, fetched live, never stored. */}
      <LyricTranslationCard
        trackId={report.track.trackId}
        brief={report.brief.brief}
      />
      <BrandDNACard
        trackId={report.track.trackId}
        title={report.track.title}
        artist={report.track.artist}
      />
    </div>
  );
}
