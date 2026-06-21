import { listReports, listProjects } from "@/lib/storage";
import { CreatePitchProject, type ProjectOption } from "@/components/CreatePitchProject";
import { ProjectsBrowser } from "@/components/ProjectsBrowser";
import { GridIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

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
        <ProjectsBrowser
          activeProjects={activeProjects}
          archivedProjects={archivedProjects}
          reports={reports}
          archivedReports={archivedReports}
        />
      )}
    </div>
  );
}
