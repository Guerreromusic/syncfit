import Link from "next/link";
import { listReports, listProjects } from "@/lib/storage";
import { CreatePitchProject, type ProjectOption } from "@/components/CreatePitchProject";
import { ArchiveButton } from "@/components/ArchiveButton";
import { DeleteForeverButton } from "@/components/DeleteForeverButton";
import { TrackCover } from "@/components/TrackCover";
import { BrandLogo } from "@/components/BrandLogo";
import { StarButton } from "@/components/favourites";
import { GridIcon, ArrowRightIcon, MegaphoneIcon } from "@/components/icons";
import type { PitchProject, SavedReport } from "@/lib/types";
import { scoreColor } from "@/lib/scoreColor";

export const dynamic = "force-dynamic";

function ProjectCard({ p }: { p: PitchProject }) {
  return (
    <div className="sf-card group relative h-full p-4 transition hover:border-purple-400/50">
      <Link
        href={`/projects/${p.id}`}
        aria-label={`Open ${p.name}`}
        className="absolute inset-0 z-0 rounded-2xl"
      />
      <div className="pointer-events-none relative z-10">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{p.name}</p>
          <span className="sf-pill shrink-0 text-[10px]">
            {p.reportIds.length} {p.reportIds.length === 1 ? "track" : "tracks"}
          </span>
        </div>
        {p.shareToken && (
          <span className="mt-2 inline-flex sf-pill border-lime-500/40 text-[10px] text-lime-300">
            Shared
          </span>
        )}
      </div>
      <div className="relative z-10 mt-3 flex items-center justify-between gap-2">
        <span className="pointer-events-none inline-flex items-center gap-1 text-xs font-semibold text-soft transition group-hover:text-purple-200">
          Open project
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </span>
        <span className="flex items-center gap-1.5">
          <ArchiveButton
            id={p.id}
            archived={Boolean(p.archived)}
            endpoint={`/api/pitch-projects/${p.id}`}
            className="rounded-lg border border-white/15 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-soft transition hover:border-purple-400/50 hover:text-white disabled:opacity-50"
          />
          {p.archived && (
            <DeleteForeverButton
              id={p.id}
              name={p.name}
              kind="project"
              endpoint={`/api/pitch-projects/${p.id}`}
            />
          )}
        </span>
      </div>
    </div>
  );
}

function PitchTrackCard({ r }: { r: SavedReport }) {
  return (
    <div className="sf-card group relative h-full p-4 transition hover:border-purple-400/50">
      <Link
        href={`/projects/pitch/${r.id}`}
        aria-label={`Open pitch for ${r.track.title}`}
        className="absolute inset-0 z-0 rounded-2xl"
      />
      <div className="pointer-events-none relative z-10 flex items-start gap-3">
        <TrackCover url={r.marketSignal.artworkUrl} className="h-12 w-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {r.name?.trim() || r.track.title}
          </p>
          <p className="truncate text-xs text-soft">
            {r.track.title} · {r.track.artist}
          </p>
        </div>
        <span
          className={
            "shrink-0 text-2xl font-bold tabular-nums " +
            scoreColor(r.analysis.syncFitScore)
          }
        >
          {r.analysis.syncFitScore}
        </span>
      </div>

      <div className="relative z-10 mt-3 flex items-center gap-1.5">
        {r.analysis.brand && <BrandLogo brand={r.analysis.brand} className="h-7 w-7" />}
        <span className="pointer-events-none sf-pill text-[10px]">{r.analysis.scoreLabel}</span>
        {r.shareToken && (
          <span className="pointer-events-none sf-pill border-lime-500/40 text-[10px] text-lime-300">
            Shared
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
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
          />
          <ArchiveButton
            id={r.id}
            archived={Boolean(r.archived)}
            className="rounded-lg border border-white/15 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-soft transition hover:border-purple-400/50 hover:text-white disabled:opacity-50"
          />
          {r.archived && (
            <DeleteForeverButton
              id={r.id}
              name={r.name?.trim() || r.track.title}
              kind="pitch"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default async function ProjectsPage() {
  const [allReports, projects] = await Promise.all([listReports(), listProjects()]);
  const reports = allReports.filter((r) => !r.archived);
  const archivedReports = allReports.filter((r) => r.archived);
  const activeProjects = projects.filter((p) => !p.archived);
  const archivedProjects = projects.filter((p) => p.archived);

  const options: ProjectOption[] = reports.map((r) => ({
    id: r.id,
    label: r.name?.trim() || r.track.title,
    sub: `${r.track.title} · ${r.track.artist}`,
    score: r.analysis.syncFitScore,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="sf-eyebrow">Projects</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Pitch projects</h1>
          <p className="mt-1 text-sm text-soft">
            Pitch a single track, or bundle several into one swipeable project —
            then share it with a public link.
          </p>
        </div>
        <CreatePitchProject options={options} />
      </header>

      {allReports.length === 0 ? (
        <div className="sf-card sf-card-pad flex min-h-[260px] flex-col items-center justify-center text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600/20 ring-1 ring-inset ring-purple-500/30">
            <GridIcon className="h-6 w-6 text-lime-400" aria-hidden />
          </span>
          <h3 className="mt-4 text-base font-semibold text-white">Nothing to pitch yet</h3>
          <p className="mt-2 max-w-sm text-sm text-soft">
            Run a SyncFit analysis from{" "}
            <span className="text-white">Research</span> — saved score reports show
            up here, ready to pitch on their own or bundled into a project.
          </p>
        </div>
      ) : (
        <>
          {/* Multi-track projects */}
          <section className="space-y-3">
            <p className="sf-eyebrow">Multi-track projects</p>
            {activeProjects.length === 0 ? (
              <div className="sf-card sf-card-pad flex items-center gap-3 text-sm text-soft">
                <MegaphoneIcon className="h-5 w-5 shrink-0 text-purple-300" aria-hidden />
                No projects yet — tap{" "}
                <span className="font-semibold text-white">New pitch project</span>{" "}
                to bundle a few tracks into one swipeable, shareable pitch.
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeProjects.map((p) => (
                  <li key={p.id}>
                    <ProjectCard p={p} />
                  </li>
                ))}
              </ul>
            )}

            {archivedProjects.length > 0 && (
              <details className="group/arch">
                <summary className="sf-eyebrow cursor-pointer select-none list-none py-1 text-soft transition hover:text-white">
                  Archived projects ({archivedProjects.length})
                </summary>
                <ul className="mt-3 grid grid-cols-1 gap-4 opacity-70 sm:grid-cols-2 lg:grid-cols-3">
                  {archivedProjects.map((p) => (
                    <li key={p.id}>
                      <ProjectCard p={p} />
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          {/* Every scored track is pitch-ready — label it honestly rather than
              implying each was deliberately created as a pitch. */}
          <section className="space-y-3">
            <p className="sf-eyebrow">Scored tracks — ready to pitch</p>
            {reports.length === 0 ? (
              <div className="sf-card sf-card-pad flex items-center gap-3 text-sm text-soft">
                <MegaphoneIcon className="h-5 w-5 shrink-0 text-purple-300" aria-hidden />
                No scored tracks yet — score one from{" "}
                <span className="font-semibold text-white">Research</span>, or restore one below.
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {reports.map((r) => (
                  <li key={r.id}>
                    <PitchTrackCard r={r} />
                  </li>
                ))}
              </ul>
            )}

            {archivedReports.length > 0 && (
              <details className="group/arch">
                <summary className="sf-eyebrow cursor-pointer select-none list-none py-1 text-soft transition hover:text-white">
                  Archived pitches ({archivedReports.length})
                </summary>
                <ul className="mt-3 grid grid-cols-1 gap-4 opacity-70 sm:grid-cols-2 lg:grid-cols-3">
                  {archivedReports.map((r) => (
                    <li key={r.id}>
                      <PitchTrackCard r={r} />
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        </>
      )}
    </div>
  );
}
