"use client";

import * as React from "react";
import Link from "next/link";
import { ReportCard } from "@/components/ReportCard";
import { ArchiveButton } from "@/components/ArchiveButton";
import { AddToArenaButton } from "@/components/AddToArenaButton";
import { LyricTranslationCard } from "@/components/LyricTranslationCard";
import { BrandDNACard } from "@/components/BrandDNACard";
import { WorldInfluenceCard } from "@/components/WorldInfluenceCard";
import { MarketSpendCard } from "@/components/MarketSpendCard";
import { AskAI } from "@/components/AskAI";
import { GenerateBannerButton } from "@/components/GenerateBannerButton";
import { MegaphoneIcon } from "@/components/icons";
import { cacheReport } from "@/lib/reportCache";
import type { SavedReport, TrackQAContext } from "@/lib/types";

/**
 * Full report body, driven entirely by the passed `report`. Used both by the
 * server page (when the store has the report) and by the client fallback (when
 * the store is unavailable and the report is read from the browser cache). On
 * render it (re)caches the report so it can always be re-opened from this
 * browser, even if a different serverless instance serves the next request.
 */
export function ReportView({ report }: { report: SavedReport }) {
  React.useEffect(() => {
    cacheReport(report);
  }, [report]);

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
        <Link href="/report" className="text-sm text-soft transition hover:text-white">
          ← Score reports
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <GenerateBannerButton
            reportId={report.id}
            initialBannerUrl={report.bannerUrl}
            compact
          />
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

      {/* World intelligence — map + demographics unified; self-hides when AI is not configured */}
      <WorldInfluenceCard
        title={report.track.title}
        artist={report.track.artist}
        language={report.track.language}
        genre={report.track.genre}
      />

      {/* Market spend per age group — generated inline with the analysis */}
      <MarketSpendCard marketSpend={report.analysis.marketSpend} />
    </div>
  );
}
