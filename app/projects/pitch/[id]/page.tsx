import Link from "next/link";
import { notFound } from "next/navigation";
import { getReport } from "@/lib/storage";
import { PitchView } from "@/components/PitchView";

export const dynamic = "force-dynamic";

export default async function PitchDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const report = await getReport(params.id);
  if (!report) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="text-sm text-soft transition hover:text-white"
      >
        ← Projects
      </Link>
      <PitchView report={report} />
    </div>
  );
}
