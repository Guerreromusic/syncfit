import Link from "next/link";
import type { SavedReport } from "@/lib/types";
import { ArchiveButton } from "./ArchiveButton";

function scoreColor(score: number): string {
  if (score >= 85) return "text-lime-300";
  if (score >= 70) return "text-lime-400";
  if (score >= 50) return "text-purple-200";
  return "text-red-300";
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
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-white">
              {r.track.title}
            </p>
            <p className="truncate text-sm text-soft">{r.track.artist}</p>
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
          <span className="sf-pill text-[11px]">{r.brief.projectType}</span>
          <span className="sf-pill text-[11px]">{r.brief.region}</span>
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
        <ArchiveButton id={r.id} archived={Boolean(r.archived)} />
      </div>
    </div>
  );
}
