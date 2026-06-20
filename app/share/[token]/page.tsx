// Public, unauthenticated pitch page. The Sidebar/Topbar hide themselves on
// /share routes, so this renders as a clean, standalone pitch card.
// COMPLIANCE: shows only the already-safe SavedReport fields (scores, summaries,
// basic metadata) — never lyrics.
import { notFound } from "next/navigation";
import { getReportByToken } from "@/lib/storage";
import { PitchCard } from "@/components/PitchCard";
import { LogoImage } from "@/components/Logo";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shared pitch — SyncFit by Synclat",
  robots: { index: false, follow: false },
};

export default async function SharePage({
  params,
}: {
  params: { token: string };
}) {
  const report = await getReportByToken(params.token);
  if (!report) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-2">
          <LogoImage className="h-7" />
          <span className="text-[10px] leading-tight text-soft">by Synclat</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] font-medium text-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
          Shared pitch
        </span>
      </header>

      <PitchCard report={report} public />

      <p className="pb-6 text-center text-xs text-soft">
        Shared via SyncFit by Synclat · scores &amp; summaries only — no full
        lyrics. Powered by Musixmatch.
      </p>
    </div>
  );
}
