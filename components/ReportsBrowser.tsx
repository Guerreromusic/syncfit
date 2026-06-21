"use client";

import * as React from "react";
import Link from "next/link";
import type { SavedReport } from "@/lib/types";
import { ReportListItem } from "./ReportListItem";
import { AddToArenaButton } from "./AddToArenaButton";
import { ArchiveButton } from "./ArchiveButton";
import { DeleteForeverButton } from "./DeleteForeverButton";
import { TrackCover } from "./TrackCover";
import { SpotifyPlay } from "./SpotifyPlay";
import { StarButton } from "./favourites";
import { GridIcon, ListIcon } from "./icons";
import { scoreColor } from "@/lib/scoreColor";

type View = "board" | "list";

/**
 * Reports browser with a Board (cards) / List (compact rows) view toggle.
 * The choice is remembered in localStorage.
 */
export function ReportsBrowser({
  active,
  archived,
}: {
  active: SavedReport[];
  archived: SavedReport[];
}) {
  const [view, setView] = React.useState<View>("board");

  React.useEffect(() => {
    try {
      const v = localStorage.getItem("syncfit:reportsView");
      if (v === "list" || v === "board") setView(v);
    } catch {
      /* ignore */
    }
  }, []);

  function choose(v: View) {
    setView(v);
    try {
      localStorage.setItem("syncfit:reportsView", v);
    } catch {
      /* ignore */
    }
  }

  const renderGroup = (items: SavedReport[]) =>
    view === "board" ? (
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((r) => (
          <li key={r.id}>
            <ReportListItem report={r} />
          </li>
        ))}
      </ul>
    ) : (
      <ul className="overflow-hidden rounded-2xl border border-white/[0.08]">
        {items.map((r, i) => (
          <ReportRow key={r.id} report={r} divider={i > 0} />
        ))}
      </ul>
    );

  return (
    <div className="space-y-5">
      {/* Toolbar: count + view toggle */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-soft">
          {active.length} active
          {archived.length ? ` · ${archived.length} archived` : ""}
        </p>
        <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
          <ViewBtn label="Board" active={view === "board"} onClick={() => choose("board")}>
            <GridIcon className="h-4 w-4" aria-hidden />
          </ViewBtn>
          <ViewBtn label="List" active={view === "list"} onClick={() => choose("list")}>
            <ListIcon className="h-4 w-4" aria-hidden />
          </ViewBtn>
        </div>
      </div>

      {active.length > 0 ? (
        renderGroup(active)
      ) : (
        <p className="rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-6 text-center text-sm text-soft">
          No active reports — everything is archived. Restore one below, or run a
          new analysis.
        </p>
      )}

      {archived.length > 0 && (
        <details className="group" open={active.length === 0}>
          <summary className="sf-eyebrow cursor-pointer select-none py-2 text-soft transition hover:text-white">
            Archived ({archived.length})
          </summary>
          <div className="mt-3">{renderGroup(archived)}</div>
        </details>
      )}
    </div>
  );
}

function ViewBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={`${label} view`}
      className={
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition " +
        (active ? "bg-white/10 text-white" : "text-soft hover:text-white")
      }
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function ReportRow({ report: r, divider }: { report: SavedReport; divider: boolean }) {
  return (
    <li
      className={
        "relative flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03] " +
        (divider ? "border-t border-white/[0.06] " : "") +
        (r.archived ? "opacity-70" : "")
      }
    >
      <Link
        href={`/report/${r.id}`}
        aria-label={`Open report for ${r.track.title}`}
        className="absolute inset-0 z-0"
      />
      <div className="pointer-events-none z-10 shrink-0">
        <TrackCover url={r.marketSignal.artworkUrl} className="h-10 w-10" />
      </div>
      <span
        className={
          "pointer-events-none z-10 w-9 shrink-0 text-center text-lg font-bold tabular-nums " +
          scoreColor(r.analysis.syncFitScore)
        }
      >
        {r.analysis.syncFitScore}
      </span>
      <div className="pointer-events-none z-10 min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {r.name?.trim() || r.track.title}
        </p>
        <p className="truncate text-xs text-soft">
          {r.track.title} · {r.track.artist}
        </p>
      </div>
      <div className="z-10 flex shrink-0 items-center gap-1.5">
        <StarButton
          track={{
            title: r.track.title,
            artist: r.track.artist,
            score: r.analysis.syncFitScore,
            scoreLabel: r.analysis.scoreLabel,
            genre: r.track.genre,
            spotifyTrackId: r.marketSignal.spotifyTrackId,
            artworkUrl: r.marketSignal.artworkUrl,
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-soft transition hover:border-lime-400/40 hover:text-lime-300 aria-pressed:border-lime-400/50 aria-pressed:bg-lime-400/10 aria-pressed:text-lime-300"
        />
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
    </li>
  );
}
