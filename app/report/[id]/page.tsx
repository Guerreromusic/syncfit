import Link from "next/link";
import { notFound } from "next/navigation";
import { getReport } from "@/lib/storage";
import { ReportCard } from "@/components/ReportCard";
import { ArchiveButton } from "@/components/ArchiveButton";
import { ArrowRightIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const report = await getReport(params.id);
  if (!report) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/report"
          className="text-sm text-soft transition hover:text-white"
        >
          ← All reports
        </Link>
        <div className="flex items-center gap-2">
          <ArchiveButton
            id={report.id}
            archived={Boolean(report.archived)}
            className="rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-2 text-sm font-semibold text-soft transition hover:border-purple-400/50 hover:text-white disabled:opacity-50"
          />
          <Link href="/analyzer" className="sf-btn-secondary">
            New analysis
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <ReportCard report={report} />

      <p className="pb-4 text-center text-xs text-soft">
        SyncFit by Synclat · Compliance: scores & summaries only — no full lyrics
        stored or displayed.
      </p>
    </div>
  );
}
