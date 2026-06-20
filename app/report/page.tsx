import { listReports } from "@/lib/storage";
import { ReportsBrowser } from "@/components/ReportsBrowser";
import { DocIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await listReports();
  const active = reports.filter((r) => !r.archived);
  const archived = reports.filter((r) => r.archived);

  return (
    <div className="space-y-6">
      <header>
        <p className="sf-eyebrow">Score reports</p>
        <h1 className="mt-1 text-2xl font-bold text-white">Score reports</h1>
        <p className="mt-1 text-sm text-soft">
          Saved SyncFit score reports — scores and summaries only, never lyrics.
        </p>
      </header>

      {reports.length === 0 ? (
        <div className="sf-card sf-card-pad flex min-h-[300px] flex-col items-center justify-center text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600/20 ring-1 ring-inset ring-purple-500/30">
            <DocIcon className="h-6 w-6 text-lime-400" aria-hidden />
          </span>
          <h3 className="mt-4 text-base font-semibold text-white">No reports yet</h3>
          <p className="mt-2 max-w-sm text-sm text-soft">
            Run an analysis from <span className="text-white">Research</span> in the
            sidebar and it will be saved here as a shareable pitch card.
          </p>
        </div>
      ) : (
        <ReportsBrowser active={active} archived={archived} />
      )}
    </div>
  );
}
