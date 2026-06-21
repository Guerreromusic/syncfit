import Link from "next/link";
import { notFound } from "next/navigation";
import { getReport } from "@/lib/storage";
import { ReportCard } from "@/components/ReportCard";
import { ArchiveButton } from "@/components/ArchiveButton";
import { AddToArenaButton } from "@/components/AddToArenaButton";
import { LyricTranslationCard } from "@/components/LyricTranslationCard";
import { BrandDNACard } from "@/components/BrandDNACard";
import { GeoInfluenceCard } from "@/components/GeoInfluenceCard";
import { DemographicsCard } from "@/components/DemographicsCard";
import { AskAI } from "@/components/AskAI";
import { MegaphoneIcon } from "@/components/icons";
import type { TrackQAContext } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const report = await getReport(params.id);
  if (!report) notFound();

  const qaContext: TrackQAContext = {
    title: report.track.title,
    artist: report.track.artist,
    brief: report.brief.brief,
    language: report.track.language,
    genre: report.track.genre,
    syncFitScore: report.analysis.syncFitScore,
    scoreLabel: report.analysis.scoreLabel,
    brandSafety: report.analysis.brandSafety.level,
    bestUse: report.analysis.bestUseCases?.[0],
    pitchSummary: report.analysis.pitchSummary,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/report"
          className="text-sm text-soft transition hover:text-white"
        >
          ← Score reports
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <AddToArenaButton
            brief={report.brief.brief}
            title={report.track.title}
            artist={report.track.artist}
            iconOnly
          />
          <ArchiveButton id={report.id} archived={Boolean(report.archived)} iconOnly />
          <Link href={`/projects/pitch/${report.id}`} className="sf-btn-white">
            <MegaphoneIcon className="h-4 w-4" aria-hidden />
            Pitch
          </Link>
        </div>
      </div>

      <ReportCard report={report} editableId={report.id} />

      {/* Natural-language Q&A — ask anything about the score / research */}
      <div className="sf-card sf-card-pad">
        <p className="sf-eyebrow mb-1">Ask about this research</p>
        <p className="mb-3 text-sm text-soft">
          Ask anything about the SyncFit score, why it fits the brief, brand
          safety, or this track — in plain language.
        </p>
        <AskAI context={qaContext} label="Ask a question" />
      </div>

      <LyricTranslationCard trackId={report.track.trackId} brief={report.brief.brief} />

      <BrandDNACard
        trackId={report.track.trackId}
        title={report.track.title}
        artist={report.track.artist}
      />

      {/* Worldwide influence map — self-hides when AI is not configured */}
      <GeoInfluenceCard
        title={report.track.title}
        artist={report.track.artist}
        language={report.track.language}
        genre={report.track.genre}
      />

      {/* Audience demographics — self-hides when AI is not configured */}
      <DemographicsCard
        title={report.track.title}
        artist={report.track.artist}
        language={report.track.language}
        genre={report.track.genre}
      />
    </div>
  );
}
