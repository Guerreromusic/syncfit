"use client";

import * as React from "react";
import Link from "next/link";
import { BriefForm } from "@/components/BriefForm";
import { TrackInputCard, type TrackInput } from "@/components/TrackInputCard";
import { RunningState } from "@/components/RunningState";
import { SyncFitScoreGauge } from "@/components/SyncFitScoreGauge";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { BrandSafetyCard } from "@/components/BrandSafetyCard";
import { PitchSummaryCard } from "@/components/PitchSummaryCard";
import { SuggestedAlternatives } from "@/components/SuggestedAlternatives";
import { SignalsCard } from "@/components/ReportCard";
import { ModelSwitch } from "@/components/ModelSwitch";
import { DemoBadge } from "@/components/DemoBadge";
import { TrackCover, StreamsBadge } from "@/components/TrackCover";
import { TrackFitResults } from "@/components/TrackFitResults";
import { ArrowRightIcon, SparkIcon, BoltIcon, SearchIcon } from "@/components/icons";
import {
  OPENROUTER_MODELS,
  DEFAULT_OPENROUTER_MODEL,
  modelLabel,
} from "@/lib/models";
import type { AnalyzeResult, Brief, DiscoverResult, RankedTrack } from "@/lib/types";

const DEFAULT_BRIEF: Brief = {
  brief: "",
  projectType: "Ad",
  region: "Colombia",
  mood: "Energetic",
  language: "Spanish",
  brandSafety: "Medium",
  licenseTier: "Micro",
};

export default function AnalyzerPage() {
  const [brief, setBrief] = React.useState<Brief>(DEFAULT_BRIEF);
  const [model, setModel] = React.useState<string>(DEFAULT_OPENROUTER_MODEL);
  const [input, setInput] = React.useState<TrackInput>({
    title: "",
    artist: "",
    trackId: "",
    previewUrl: "",
  });

  const [analyzing, setAnalyzing] = React.useState(false);
  const [runningMode, setRunningMode] = React.useState<"single" | "discover">("single");
  const [analyzeError, setAnalyzeError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<AnalyzeResult | null>(null);
  const [discoverResult, setDiscoverResult] = React.useState<DiscoverResult | null>(null);
  const [savedId, setSavedId] = React.useState<string | null>(null);

  function patchBrief(patch: Partial<Brief>) {
    setBrief((b) => ({ ...b, ...patch }));
  }

  function setField(field: keyof TrackInput, value: string) {
    setInput((i) => ({ ...i, [field]: value }));
  }

  // Only the brief is required. The track is OPTIONAL: name one to score it, or
  // leave it blank to let SyncFit discover & rank the 10 best-fitting tracks.
  const hasTrackInput = Boolean(input.trackId.trim() || input.title.trim());
  const canAnalyze = Boolean(brief.brief.trim());

  // One request that branches server-side: track given → single analysis;
  // track blank → TrackFit discovery (10 ranked tracks). `override` lets a
  // discovered track be scored with one click.
  async function runAnalyze(override?: { title: string; artist: string }) {
    if (analyzing) return;
    setAnalyzeError(null);

    if (!brief.brief.trim()) {
      setAnalyzeError("Please enter a creative brief before running SyncFit.");
      return;
    }

    const title = override ? override.title : input.title.trim();
    const artist = override ? override.artist : input.artist.trim();
    const trackId = override ? "" : input.trackId.trim();
    const willDiscover = !title && !trackId;

    setRunningMode(willDiscover ? "discover" : "single");
    setAnalyzing(true);
    setResult(null);
    setDiscoverResult(null);
    setSavedId(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief,
          model,
          trackId: trackId || undefined,
          title: title || undefined,
          artist: artist || undefined,
          previewUrl: override ? undefined : input.previewUrl.trim() || undefined,
          save: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAnalyzeError(data.error || "SyncFit failed.");
        return;
      }
      if (data.mode === "discover") {
        setDiscoverResult(data.discover as DiscoverResult);
      } else {
        setResult(data.result as AnalyzeResult);
        setSavedId(data.savedId ?? null);
      }
    } catch {
      setAnalyzeError("Network error while running SyncFit.");
    } finally {
      setAnalyzing(false);
    }
  }

  // Score a discovered track: load it into the form and run a single analysis.
  function pickTrack(t: RankedTrack) {
    setInput((i) => ({ ...i, title: t.title, artist: t.artist, trackId: "" }));
    runAnalyze({ title: t.title, artist: t.artist });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="sf-eyebrow">Discover</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Discover the right track</h1>
          <p className="mt-1 text-sm text-soft">
            Enter a brief, then score a track — or find the 10 best-fitting matches.
          </p>
        </div>
      </header>

      {/* Persistent polite live region: announces start AND completion to
          screen readers (the in-loader status region unmounts on success). */}
      <div className="sr-only" role="status" aria-live="polite">
        {analyzing
          ? "Running SyncFit analysis."
          : result
            ? `SyncFit score ready: ${result.analysis.syncFitScore} out of 100 — ${result.analysis.scoreLabel}.`
            : ""}
      </div>

      {/* Single liquid-glass card */}
      <div className="relative">
        <div className="sf-glass">
          {/* Card header — AI Model Switch lives top-right */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-6 py-4 sm:px-8">
            <p className="sf-eyebrow">Analyzer Console</p>
            <ModelSwitch model={model} models={OPENROUTER_MODELS} onChange={setModel} />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2">
            {/* Left pane — the console (brief + track input), one Run does it all */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runAnalyze();
              }}
              className="space-y-6 p-6 sm:p-8 lg:border-r lg:border-white/5"
            >
              <BriefForm bare brief={brief} onChange={patchBrief} />
              <div className="sf-hairline" />
              <TrackInputCard bare input={input} onField={setField} />

              {/* One primary action. Track given → score it; track blank →
                  discover & rank the 10 best-fitting tracks. */}
              <div className="sf-hairline" />
              <div className="space-y-3">
                {analyzeError && (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200"
                  >
                    {analyzeError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={analyzing || !canAnalyze}
                  className="sf-btn-primary w-full py-3 text-base"
                >
                  {hasTrackInput ? (
                    <BoltIcon className="h-5 w-5" aria-hidden />
                  ) : (
                    <SearchIcon className="h-5 w-5" aria-hidden />
                  )}
                  {analyzing
                    ? hasTrackInput
                      ? "Running SyncFit…"
                      : "Finding tracks…"
                    : hasTrackInput
                      ? "Run SyncFit"
                      : "Find Best Tracks"}
                </button>
                <p className="text-center text-xs text-soft">
                  {hasTrackInput
                    ? "Scores your track against the brief."
                    : "No track? SyncFit ranks the 10 best-fitting tracks for your brief."}
                </p>
              </div>
            </form>

            {/* Right pane — results */}
            <div className="space-y-5 border-t border-white/5 p-6 sm:p-8 lg:border-t-0">
              {!result && !discoverResult && !analyzing && <EmptyResults />}
              {analyzing && <RunningState mode={runningMode} />}

              {discoverResult && !analyzing && (
                <TrackFitResults
                  tracks={discoverResult.tracks}
                  onPick={pickTrack}
                  demo={discoverResult.usedDemoData.openrouter}
                  modelUsed={discoverResult.modelUsed}
                  openrouterError={discoverResult.openrouterError}
                />
              )}

              {result && !analyzing && (
                <div className="space-y-5 animate-fade-up">
                  <ResultsHeader result={result} brief={brief} savedId={savedId} />

                  <div className="sf-glass-soft flex flex-col items-center gap-6 p-5 sm:flex-row sm:items-center">
                    <SyncFitScoreGauge
                      score={result.analysis.syncFitScore}
                      label={result.analysis.scoreLabel}
                    />
                    <div className="w-full flex-1">
                      <p className="sf-eyebrow mb-3">Score Breakdown</p>
                      <ScoreBreakdown breakdown={result.analysis.breakdown} />
                    </div>
                  </div>

                  <PitchSummaryCard
                    bare
                    pitchSummary={result.analysis.pitchSummary}
                    bestUseCases={result.analysis.bestUseCases}
                    supervisorNotes={result.analysis.supervisorNotes}
                  />
                  <BrandSafetyCard bare brandSafety={result.analysis.brandSafety} />
                  <SignalsCard
                    bare
                    marketStatus={result.marketSignal.status}
                    marketSummary={result.marketSignal.summary}
                    marketConfidence={result.marketSignal.confidence}
                    audioSummary={result.audioReadiness.summary}
                  />
                  <SuggestedAlternatives
                    bare
                    alternatives={result.analysis.suggestedAlternatives}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultsHeader({
  result,
  brief,
  savedId,
}: {
  result: AnalyzeResult;
  brief: Brief;
  savedId: string | null;
}) {
  const { track } = result;
  return (
    <div className="sf-glass-soft p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <TrackCover url={result.marketSignal.artworkUrl} className="h-14 w-14" />
          <div className="min-w-0">
            <p className="sf-eyebrow">Result</p>
            <h2 className="mt-0.5 truncate text-xl font-bold text-white">
              {track.title}
            </h2>
            <p className="truncate text-sm text-soft">{track.artist}</p>
            <div className="mt-0.5">
              <StreamsBadge
                streams={result.marketSignal.streams}
                status={result.marketSignal.status !== "Unknown" ? result.marketSignal.status : undefined}
              />
            </div>
          </div>
        </div>
        {savedId && (
          <Link href={`/report/${savedId}`} className="sf-btn-secondary">
            Open full report
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="sf-pill">Language · {track.language || "—"}</span>
        <span className="sf-pill">Region · {brief.region}</span>
        <span className="sf-pill">BPM · {track.bpm ?? "—"}</span>
        <span className="sf-pill">
          Explicit · {track.explicit == null ? "—" : track.explicit ? "Yes" : "No"}
        </span>
        {result.modelUsed && (
          <span className="sf-pill border-lime-500/40 text-lime-300">
            Model · {modelLabel(result.modelUsed)}
          </span>
        )}
      </div>

      {result.openrouterError && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5"
        >
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
          <p className="text-xs leading-relaxed text-amber-100">
            <span className="font-semibold">AI call failed:</span>{" "}
            {result.openrouterError}. Showing the local heuristic result as a
            fallback — check your AI model API key / credits.
          </p>
        </div>
      )}

      <div className="mt-4">
        <DemoBadge
          musixmatch={result.usedDemoData.musixmatch}
          // When the AI call actually errored, the amber alert above already
          // explains the heuristic fallback — don't double up via the badge.
          openrouter={result.usedDemoData.openrouter && !result.openrouterError}
        />
      </div>
    </div>
  );
}

function EmptyResults() {
  return (
    <div className="sf-glass-soft flex min-h-[420px] flex-col items-center justify-center p-6 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600/20 ring-1 ring-inset ring-purple-500/30">
        <SparkIcon className="h-6 w-6 text-lime-400" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-white">
        Your SyncFit result appears here
      </h3>
      <p className="mt-2 max-w-sm text-sm text-soft">
        Add a brief and a track title, then hit Run SyncFit — one step finds the
        track on Musixmatch and scores it with a brand-safety read and a
        pitch-ready summary.
      </p>
    </div>
  );
}
