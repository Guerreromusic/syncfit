import { getReport } from "@/lib/storage";
import { ReportView } from "@/components/ReportView";
import { ReportFallback } from "@/components/ReportFallback";

export const dynamic = "force-dynamic";

export default async function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const report = await getReport(params.id);

  // When the durable store has it, render server-side. Otherwise fall back to
  // the browser cache (a report you just researched still opens even if the
  // store is offline or a different serverless instance saved it).
  if (!report) return <ReportFallback id={params.id} />;

  return <ReportView report={report} />;
}
