"use client";

import * as React from "react";
import Link from "next/link";
import type { PitchProject, SavedReport } from "@/lib/types";
import { ArchiveButton } from "./ArchiveButton";
import { DeleteForeverButton } from "./DeleteForeverButton";
import { DeleteAllArchivedButton } from "./DeleteAllArchivedButton";
import { TrackCover } from "./TrackCover";
import { BrandLogo } from "./BrandLogo";
import { StarButton } from "./favourites";
import {
  GridIcon,
  ListIcon,
  ArrowRightIcon,
  MegaphoneIcon,
  ArchiveIcon,
  ListMusicIcon,
  PencilIcon,
} from "./icons";
import { scoreColor } from "@/lib/scoreColor";

type View = "board" | "list";

/**
 * Projects + scored-track pitches with a Board / List view toggle and per-card
 * management (open/edit, archive, delete). Archived groups collapse and offer a
 * "Delete all". The view choice is remembered in localStorage.
 */
export function ProjectsBrowser({
  activeProjects,
  archivedProjects,
  reports,
  archivedReports,
}: {
  activeProjects: PitchProject[];
  archivedProjects: PitchProject[];
  reports: SavedReport[];
  archivedReports: SavedReport[];
}) {
  const [view, setView] = React.useState<View>("board");

  React.useEffect(() => {
    try {
      const v = localStorage.getItem("syncfit:projectsView");
      if (v === "list" || v === "board") setView(v);
    } catch {
      /* ignore */
    }
  }, []);

  function choose(v: View) {
    setView(v);
    try {
      localStorage.setItem("syncfit:projectsView", v);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-6">
      {/* View toggle */}
      <div className="flex items-center justify-end">
        <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
          <ViewBtn label="Board" active={view === "board"} onClick={() => choose("board")}>
            <GridIcon className="h-4 w-4" aria-hidden />
          </ViewBtn>
          <ViewBtn label="List" active={view === "list"} onClick={() => choose("list")}>
            <ListIcon className="h-4 w-4" aria-hidden />
          </ViewBtn>
        </div>
      </div>

      {/* Multi-track projects */}
      <section className="space-y-3">
        <p className="sf-eyebrow flex items-center gap-1.5">
          <GridIcon className="h-3.5 w-3.5 text-lime-400" aria-hidden />
          Multi-track projects
        </p>
        {activeProjects.length === 0 ? (
          <div className="sf-card sf-card-pad flex items-center gap-3 text-sm text-soft">
            <MegaphoneIcon className="h-5 w-5 shrink-0 text-purple-300" aria-hidden />
            No projects yet — tap{" "}
            <span className="font-semibold text-white">New pitch project</span> to
            bundle a few tracks into one swipeable, shareable pitch.
          </div>
        ) : view === "board" ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeProjects.map((p) => (
              <li key={p.id}>
                <ProjectCard p={p} />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-white/[0.08]">
            {activeProjects.map((p, i) => (
              <ProjectRow key={p.id} p={p} divider={i > 0} />
            ))}
          </ul>
        )}

        {archivedProjects.length > 0 && (
          <details className="group/arch">
            <summary className="sf-eyebrow inline-flex cursor-pointer select-none items-center gap-1.5 list-none py-1 text-soft transition hover:text-white">
              <ArchiveIcon className="h-3.5 w-3.5" aria-hidden />
              Archived projects ({archivedProjects.length})
            </summary>
            <div className="mt-2 flex justify-end">
              <DeleteAllArchivedButton
                ids={archivedProjects.map((p) => p.id)}
                endpointBase="/api/pitch-projects"
                label="archived projects"
              />
            </div>
            <ul className="mt-3 grid grid-cols-1 gap-4 opacity-80 sm:grid-cols-2 lg:grid-cols-3">
              {archivedProjects.map((p) => (
                <li key={p.id}>
                  <ProjectCard p={p} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* Scored tracks — ready to pitch */}
      <section className="space-y-3">
        <p className="sf-eyebrow flex items-center gap-1.5">
          <ListMusicIcon className="h-3.5 w-3.5 text-lime-400" aria-hidden />
          Scored tracks — ready to pitch
        </p>
        {reports.length === 0 ? (
          <div className="sf-card sf-card-pad flex items-center gap-3 text-sm text-soft">
            <MegaphoneIcon className="h-5 w-5 shrink-0 text-purple-300" aria-hidden />
            No scored tracks yet — score one from{" "}
            <span className="font-semibold text-white">Research</span>, or restore one
            below.
          </div>
        ) : view === "board" ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((r) => (
              <li key={r.id}>
                <PitchTrackCard r={r} />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-white/[0.08]">
            {reports.map((r, i) => (
              <PitchRow key={r.id} r={r} divider={i > 0} />
            ))}
          </ul>
        )}

        {archivedReports.length > 0 && (
          <details className="group/arch">
            <summary className="sf-eyebrow inline-flex cursor-pointer select-none items-center gap-1.5 list-none py-1 text-soft transition hover:text-white">
              <ArchiveIcon className="h-3.5 w-3.5" aria-hidden />
              Archived pitches ({archivedReports.length})
            </summary>
            <div className="mt-2 flex justify-end">
              <DeleteAllArchivedButton
                ids={archivedReports.map((r) => r.id)}
                endpointBase="/api/reports"
                label="archived pitches"
              />
            </div>
            <ul className="mt-3 grid grid-cols-1 gap-4 opacity-80 sm:grid-cols-2 lg:grid-cols-3">
              {archivedReports.map((r) => (
                <li key={r.id}>
                  <PitchTrackCard r={r} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>
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

/** Small "edit name" link → opens the item (rename lives on the detail page). */
function EditLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-soft transition hover:border-purple-400/50 hover:text-white"
    >
      <PencilIcon className="h-4 w-4" aria-hidden />
    </Link>
  );
}

function ProjectCard({ p }: { p: PitchProject }) {
  return (
    <div className="sf-card group relative h-full p-4 transition hover:border-purple-400/50">
      <Link href={`/projects/${p.id}`} aria-label={`Open ${p.name}`} className="absolute inset-0 z-0 rounded-2xl" />
      <div className="pointer-events-none relative z-10">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{p.name}</p>
          <span className="sf-pill shrink-0 text-[10px]">
            {p.reportIds.length} {p.reportIds.length === 1 ? "track" : "tracks"}
          </span>
        </div>
        {p.shareToken && (
          <span className="mt-2 inline-flex sf-pill border-lime-500/40 text-[10px] text-lime-300">Shared</span>
        )}
      </div>
      <div className="relative z-10 mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
        <span className="pointer-events-none inline-flex items-center gap-1 text-xs font-semibold text-soft transition group-hover:text-purple-200">
          Open project
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <EditLink href={`/projects/${p.id}`} label="Open & rename project" />
          <ArchiveButton
            id={p.id}
            archived={Boolean(p.archived)}
            endpoint={`/api/pitch-projects/${p.id}`}
            iconOnly
          />
          {p.archived && (
            <DeleteForeverButton id={p.id} name={p.name} kind="project" endpoint={`/api/pitch-projects/${p.id}`} iconOnly />
          )}
        </span>
      </div>
    </div>
  );
}

function ProjectRow({ p, divider }: { p: PitchProject; divider: boolean }) {
  return (
    <li
      className={
        "relative flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03] " +
        (divider ? "border-t border-white/[0.06] " : "") +
        (p.archived ? "opacity-80" : "")
      }
    >
      <Link href={`/projects/${p.id}`} aria-label={`Open ${p.name}`} className="absolute inset-0 z-0" />
      <span className="pointer-events-none z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-600/15 text-purple-200 ring-1 ring-inset ring-white/10">
        <GridIcon className="h-4 w-4" aria-hidden />
      </span>
      <div className="pointer-events-none z-10 min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{p.name}</p>
        <p className="truncate text-xs text-soft">
          {p.reportIds.length} {p.reportIds.length === 1 ? "track" : "tracks"}
          {p.shareToken ? " · Shared" : ""}
        </p>
      </div>
      <div className="z-10 flex shrink-0 items-center gap-1.5">
        <EditLink href={`/projects/${p.id}`} label="Open & rename project" />
        <ArchiveButton id={p.id} archived={Boolean(p.archived)} endpoint={`/api/pitch-projects/${p.id}`} iconOnly />
        {p.archived && (
          <DeleteForeverButton id={p.id} name={p.name} kind="project" endpoint={`/api/pitch-projects/${p.id}`} iconOnly />
        )}
      </div>
    </li>
  );
}

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

function PitchTrackCard({ r }: { r: SavedReport }) {
  return (
    <div className="sf-card group relative h-full p-4 transition hover:border-purple-400/50">
      <Link href={`/projects/pitch/${r.id}`} aria-label={`Open pitch for ${r.track.title}`} className="absolute inset-0 z-0 rounded-2xl" />
      <div className="pointer-events-none relative z-10 flex items-start gap-3">
        <TrackCover url={r.marketSignal.artworkUrl} className="h-12 w-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{r.name?.trim() || r.track.title}</p>
          <p className="truncate text-xs text-soft">
            {r.track.title} · {r.track.artist}
          </p>
        </div>
        <span className={"shrink-0 text-2xl font-bold tabular-nums " + scoreColor(r.analysis.syncFitScore)}>
          {r.analysis.syncFitScore}
        </span>
      </div>

      <div className="relative z-10 mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-2">
        {r.analysis.brand && <BrandLogo brand={r.analysis.brand} className="h-7 w-7 shrink-0" />}
        <span className="pointer-events-none sf-pill text-[10px]">{r.analysis.scoreLabel}</span>
        {r.shareToken && (
          <span className="pointer-events-none sf-pill border-lime-500/40 text-[10px] text-lime-300">Shared</span>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <StarButton track={favOf(r)} />
          <EditLink href={`/report/${r.id}`} label="Open & rename report" />
          <ArchiveButton id={r.id} archived={Boolean(r.archived)} iconOnly />
          {r.archived && <DeleteForeverButton id={r.id} name={r.name?.trim() || r.track.title} kind="pitch" iconOnly />}
        </div>
      </div>
    </div>
  );
}

function PitchRow({ r, divider }: { r: SavedReport; divider: boolean }) {
  return (
    <li
      className={
        "relative flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03] " +
        (divider ? "border-t border-white/[0.06] " : "") +
        (r.archived ? "opacity-80" : "")
      }
    >
      <Link href={`/projects/pitch/${r.id}`} aria-label={`Open pitch for ${r.track.title}`} className="absolute inset-0 z-0" />
      <div className="pointer-events-none z-10 shrink-0">
        <TrackCover url={r.marketSignal.artworkUrl} className="h-10 w-10" />
      </div>
      <span className={"pointer-events-none z-10 w-9 shrink-0 text-center text-lg font-bold tabular-nums " + scoreColor(r.analysis.syncFitScore)}>
        {r.analysis.syncFitScore}
      </span>
      <div className="pointer-events-none z-10 min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{r.name?.trim() || r.track.title}</p>
        <p className="truncate text-xs text-soft">
          {r.track.title} · {r.track.artist}
        </p>
      </div>
      <div className="z-10 flex shrink-0 items-center gap-1.5">
        <StarButton track={favOf(r)} />
        <EditLink href={`/report/${r.id}`} label="Open & rename report" />
        <ArchiveButton id={r.id} archived={Boolean(r.archived)} iconOnly />
        {r.archived && <DeleteForeverButton id={r.id} name={r.name?.trim() || r.track.title} kind="pitch" iconOnly />}
      </div>
    </li>
  );
}
