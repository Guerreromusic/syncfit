import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getReport } from "@/lib/storage";
import { ProjectPitchView } from "@/components/ProjectPitchView";
import { ShareButton } from "@/components/ShareButton";
import { EditableName } from "@/components/EditableName";
import { ArchiveButton } from "@/components/ArchiveButton";
import type { SavedReport } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProjectPitchPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await getProject(params.id);
  if (!project) notFound();

  const fetched = await Promise.all(project.reportIds.map((id) => getReport(id)));
  const reports = fetched.filter((r): r is SavedReport => Boolean(r));
  if (!reports.length) notFound();

  return (
    <div className="space-y-5">
      <Link href="/projects" className="text-sm text-soft transition hover:text-white">
        ← All projects
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <header>
          <p className="sf-eyebrow">Pitch project</p>
          <div className="mt-1">
            <EditableName
              endpoint={`/api/pitch-projects/${project.id}`}
              initialName={project.name}
              ariaLabel="Project name"
              title="Rename project"
            />
          </div>
          <p className="mt-1 text-sm text-soft">
            {reports.length} {reports.length === 1 ? "track" : "tracks"} — swipe or
            tap a tab to switch between them.
          </p>
        </header>
        <div className="flex shrink-0 items-start gap-2">
          <ShareButton
            shareEndpoint={`/api/pitch-projects/${project.id}/share`}
            sharePrefix="/share/project/"
            initialToken={project.shareToken}
            label="Share project"
          />
          <ArchiveButton
            id={project.id}
            archived={Boolean(project.archived)}
            endpoint={`/api/pitch-projects/${project.id}`}
            className="rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-2 text-sm font-semibold text-soft transition hover:border-purple-400/50 hover:text-white disabled:opacity-50"
          />
        </div>
      </div>

      <ProjectPitchView reports={reports} />
    </div>
  );
}
