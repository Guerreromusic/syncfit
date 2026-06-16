import Link from "next/link";
import { listReports } from "@/lib/storage";
import { ReportListItem } from "@/components/ReportListItem";
import { ArrowRightIcon, BoltIcon, DocIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await listReports();
  const active = reports.filter((r) => !r.archived);
  const archived = reports.filter((r) => r.archived);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="sf-eyebrow">Reports</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Saved SyncFit Reports</h1>
          <p className="mt-1 text-sm text-soft">
            Locally saved demo analyses — scores and summaries only, never lyrics.
          </p>
        </div>
        <Link href="/analyzer" className="sf-btn-primary">
          <BoltIcon className="h-4 w-4" />
          Run SyncFit
        </Link>
      </header>

      {reports.length === 0 ? (
        <div className="sf-card sf-card-pad flex min-h-[300px] flex-col items-center justify-center text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600/20 ring-1 ring-inset ring-purple-500/30">
            <DocIcon className="h-6 w-6 text-lime-400" />
          </span>
          <h3 className="mt-4 text-base font-semibold text-white">No reports yet</h3>
          <p className="mt-2 max-w-sm text-sm text-soft">
            Run an analysis in Discover and it will be saved here as a shareable
            pitch card.
          </p>
          <Link href="/analyzer" className="sf-btn-secondary mt-5">
            Open Analyzer
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          {active.length > 0 ? (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {active.map((r) => (
                <li key={r.id}>
                  <ReportListItem report={r} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-6 text-center text-sm text-soft">
              No active reports — everything is archived. Restore one below, or run
              a new analysis.
            </p>
          )}

          {archived.length > 0 && (
            <details className="group" open={active.length === 0}>
              <summary className="sf-eyebrow cursor-pointer select-none py-2 text-soft transition hover:text-white">
                Archived ({archived.length})
              </summary>
              <ul className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {archived.map((r) => (
                  <li key={r.id}>
                    <ReportListItem report={r} />
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}
