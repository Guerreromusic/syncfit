import * as React from "react";
import type { SavedReport } from "@/lib/types";
import { SyncFitScoreGauge } from "./SyncFitScoreGauge";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { BrandSafetyCard } from "./BrandSafetyCard";
import { PitchSummaryCard } from "./PitchSummaryCard";
import { SuggestedAlternatives } from "./SuggestedAlternatives";
import { TrackCover, StreamsBadge } from "./TrackCover";
import { DemoBadge } from "./DemoBadge";

function MetaItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ink-700/70 bg-ink-900/40 px-3.5 py-2.5">
      <p className="text-[11px] uppercase tracking-wider text-soft">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

/** Full export-style pitch card for a saved report. */
export function ReportCard({ report }: { report: SavedReport }) {
  const { track, brief, analysis, marketSignal, audioReadiness, usedDemoData } =
    report;
  const anyDemo =
    usedDemoData.musixmatch || usedDemoData.openrouter;

  const created = new Date(report.createdAt);
  const createdLabel = created.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-5">
      {/* Header / export banner */}
      <div className="sf-card sf-card-pad">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <TrackCover url={marketSignal.artworkUrl} className="h-16 w-16" />
            <div className="min-w-0">
              <p className="sf-eyebrow">SyncFit Pitch Card</p>
              <h1 className="mt-0.5 truncate text-2xl font-bold text-white">
                {track.title}
              </h1>
              <p className="truncate text-sm text-soft">{track.artist}</p>
              <div className="mt-1">
                <StreamsBadge
                  streams={marketSignal.streams}
                  status={marketSignal.status !== "Unknown" ? marketSignal.status : undefined}
                />
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-soft">Report ID</p>
            <p className="font-mono text-xs text-purple-200">{report.id}</p>
            <p className="mt-1 text-xs text-soft">{createdLabel}</p>
          </div>
        </div>

        {anyDemo && (
          <div className="mt-4">
            <DemoBadge
              musixmatch={usedDemoData.musixmatch}
              openrouter={usedDemoData.openrouter}
            />
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetaItem label="Language" value={track.language || "—"} />
          <MetaItem label="Region" value={brief.region} />
          <MetaItem label="BPM" value={track.bpm ?? "—"} />
          <MetaItem
            label="Explicit"
            value={track.explicit == null ? "—" : track.explicit ? "Yes" : "No"}
          />
          <MetaItem label="Project" value={brief.projectType} />
          <MetaItem label="License" value={brief.licenseTier} />
        </div>
      </div>

      {/* Brief */}
      <div className="sf-card sf-card-pad">
        <p className="sf-eyebrow mb-2">Creative Brief</p>
        <p className="text-sm leading-relaxed text-soft">
          {brief.brief || "—"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="sf-pill">Mood · {brief.mood}</span>
          <span className="sf-pill">Language · {brief.language}</span>
          <span className="sf-pill">Brand safety · {brief.brandSafety}</span>
        </div>
      </div>

      {/* Score + breakdown */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="sf-card sf-card-pad flex items-center justify-center lg:col-span-1">
          <SyncFitScoreGauge
            score={analysis.syncFitScore}
            label={analysis.scoreLabel}
          />
        </div>
        <div className="sf-card sf-card-pad lg:col-span-2">
          <p className="sf-eyebrow mb-4">Score Breakdown</p>
          <ScoreBreakdown breakdown={analysis.breakdown} />
        </div>
      </div>

      {/* Pitch + brand safety */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <PitchSummaryCard
          pitchSummary={analysis.pitchSummary}
          bestUseCases={analysis.bestUseCases}
          supervisorNotes={analysis.supervisorNotes}
        />
        <div className="space-y-5">
          <BrandSafetyCard brandSafety={analysis.brandSafety} />
          <SignalsCard
            marketStatus={marketSignal.status}
            marketSummary={marketSignal.summary}
            marketConfidence={marketSignal.confidence}
            audioSummary={audioReadiness.summary}
          />
        </div>
      </div>

      {/* Alternatives */}
      <SuggestedAlternatives alternatives={analysis.suggestedAlternatives} />
    </div>
  );
}

const MARKET_STYLES: Record<
  string,
  { text: string; bg: string; ring: string }
> = {
  Established: { text: "text-lime-300", bg: "bg-lime-500/10", ring: "ring-lime-500/30" },
  Rising: { text: "text-lime-400", bg: "bg-lime-500/10", ring: "ring-lime-500/30" },
  Emerging: { text: "text-purple-200", bg: "bg-purple-600/15", ring: "ring-purple-500/30" },
  Unknown: { text: "text-soft", bg: "bg-ink-700/40", ring: "ring-ink-600" },
};

export function SignalsCard({
  marketStatus,
  marketSummary,
  marketConfidence,
  audioSummary,
  bare = false,
}: {
  marketStatus: string;
  marketSummary: string;
  marketConfidence?: number;
  audioSummary: string;
  bare?: boolean;
}) {
  const m = MARKET_STYLES[marketStatus] ?? MARKET_STYLES.Unknown;
  return (
    <div className={bare ? "sf-glass-soft p-5" : "sf-card sf-card-pad"}>
      <h3 className="mb-3 text-sm font-semibold text-white">Partner Signals</h3>
      <div className="space-y-4">
        {/* Market Signal — live from the Songstats API */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="sf-eyebrow">
              Market Signal{" "}
              <span className="font-normal normal-case tracking-normal text-soft">
                · Songstats
              </span>
            </p>
            <span
              className={
                "rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset " +
                m.text +
                " " +
                m.bg +
                " " +
                m.ring
              }
            >
              {marketStatus}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-soft">{marketSummary}</p>
          {typeof marketConfidence === "number" && marketConfidence > 0 && (
            <div className="mt-2.5">
              <div className="mb-1 flex items-center justify-between text-[11px] text-soft">
                <span>Confidence</span>
                <span className="tabular-nums">{marketConfidence}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-lime-400"
                  style={{ width: `${marketConfidence}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Audio Readiness — LALAL.AI */}
        <div>
          <p className="sf-eyebrow">
            Audio Readiness{" "}
            <span className="font-normal normal-case tracking-normal text-soft">
              · LALAL.AI
            </span>
          </p>
          <p className="mt-1.5 text-sm text-soft">{audioSummary}</p>
        </div>
      </div>
    </div>
  );
}
