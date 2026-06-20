// Public, unauthenticated pitch PROJECT page. Sidebar/Topbar hide on /share
// routes, so this renders as a clean, standalone swipeable multi-track pitch.
// COMPLIANCE: shows only already-safe SavedReport fields — never lyrics.
import { notFound } from "next/navigation";
import { getProjectByToken, getReport } from "@/lib/storage";
import { ProjectPitchView } from "@/components/ProjectPitchView";
import { LogoImage } from "@/components/Logo";
import type { SavedReport } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shared pitch project — SyncFit by Synclat",
  robots: { index: false, follow: false },
};

export default async function ShareProjectPage({
  params,
}: {
  params: { token: string };
}) {
  const project = await getProjectByToken(params.token);
  if (!project) notFound();

  const fetched = await Promise.all(project.reportIds.map((id) => getReport(id)));
  const reports = fetched.filter((r): r is SavedReport => Boolean(r));
  if (!reports.length) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-2">
          <LogoImage className="h-7" />
          <span className="text-[10px] leading-tight text-soft">by Synclat</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] font-medium text-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
          Shared project
        </span>
      </header>

      <div>
        <h1 className="text-2xl font-bold text-white">{project.name}</h1>
        <p className="mt-1 text-sm text-soft">
          {reports.length} {reports.length === 1 ? "track" : "tracks"} — swipe or
          tap a tab to switch.
        </p>
      </div>

      <ProjectPitchView reports={reports} />

      <p className="pb-6 text-center text-xs text-soft">
        Shared via SyncFit by Synclat · scores &amp; summaries only — no full
        lyrics. Powered by Musixmatch.
      </p>
    </div>
  );
}
