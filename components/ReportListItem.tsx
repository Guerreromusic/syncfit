import Link from "next/link";
import type { SavedReport } from "@/lib/types";
import { ArchiveButton } from "./ArchiveButton";
import { DeleteForeverButton } from "./DeleteForeverButton";
import { AddToArenaButton } from "./AddToArenaButton";
import { TrackCover } from "./TrackCover";
import { SpotifyPlay } from "./SpotifyPlay";
import { StarButton } from "./favourites";
import { scoreColor } from "@/lib/scoreColor";

/** Build the starred-track payload from a saved report. */
function favOf(r: SavedReport) {
  return {
    title: r.track.title,
    artist: r.track.artist,
    score: r.analysis.syncFitScore,
    scoreLabel: r.analysis.scoreLabel,
    genre: r.track.genre,
    spotifyTrackId: r.marketSignal.spotifyTrackId,
    artworkUrl: r.marketSignal.artworkUrl,
  };
}


/**
 * A saved-report card. The whole card is clickable (overlay link) while the
 * Archive/Restore button remains a separately-clickable control on top.
 */
export function ReportListItem({ report: r }: { report: SavedReport }) {
  return (
    <div
      className={
        "sf-card sf-card-pad relative transition hover:border-purple-400/50 " +
        (r.archived ? "opacity-70" : "")
      }
    >
      {/* Full-card overlay link (sits beneath the content + archive button) */}
      <Link
        href={`/report/${r.id}`}
        aria-label={`Open report for ${r.track.title}`}
        className="absolute inset-0 z-0 rounded-2xl"
      />

      <div className="pointer-events-none relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <TrackCover url={r.marketSignal.artworkUrl} className="h-11 w-11" />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-white">
                {r.name?.trim() || r.track.title}
              </p>
              <p className="truncate text-sm text-soft">
                {r.track.title} · {r.track.artist}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span
              className={
                "text-2xl font-bold tabular-nums " +
                scoreColor(r.analysis.syncFitScore)
              }
            >
              {r.analysis.syncFitScore}
            </span>
            <p className="text-[11px] text-soft">/ 100</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="sf-pill text-[11px]">{r.analysis.scoreLabel}</span>
        </div>
      </div>

      <div className="relative z-10 mt-4 flex items-center justify-between">
        <p className="pointer-events-none text-xs text-soft">
          {new Date(r.createdAt).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
        <div className="flex items-center gap-1.5">
          <StarButton track={favOf(r)} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-soft transition hover:border-lime-400/40 hover:text-lime-300 aria-pressed:border-lime-400/50 aria-pressed:bg-lime-400/10 aria-pressed:text-lime-300" />
          <SpotifyPlay
            title={r.track.title}
            artist={r.track.artist}
            spotifyId={r.marketSignal.spotifyTrackId}
            label=""
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-soft transition hover:border-lime-400/50 hover:text-lime-300"
          />
          <AddToArenaButton
            brief={r.brief.brief}
            title={r.track.title}
            artist={r.track.artist}
            iconOnly
          />
          <ArchiveButton id={r.id} archived={Boolean(r.archived)} iconOnly />
          {r.archived && (
            <DeleteForeverButton
              id={r.id}
              name={r.name?.trim() || r.track.title}
              kind="pitch"
              iconOnly
            />
          )}
        </div>
      </div>
    </div>
  );
}
