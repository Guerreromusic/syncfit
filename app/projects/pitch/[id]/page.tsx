import { notFound } from "next/navigation";
import { getReport } from "@/lib/storage";
import { getPitchTheme } from "@/lib/pitch-theme";
import { PitchPageClient } from "@/components/PitchPageClient";

export const dynamic = "force-dynamic";

export default async function PitchDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const report = await getReport(params.id);
  if (!report) notFound();

  const theme = getPitchTheme(report);

  return <PitchPageClient report={report} theme={theme} />;
}
