import * as React from "react";
import type { SavedReport, StreamMetrics } from "@/lib/types";
import { CreditsCard } from "./CreditsCard";
import { SyncFitScoreGauge } from "./SyncFitScoreGauge";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { BrandSafetyCard } from "./BrandSafetyCard";
import { PitchSummaryCard } from "./PitchSummaryCard";
import { TrackCover, StreamsBadge } from "./TrackCover";
import { DemoBadge } from "./DemoBadge";
import { EditableName } from "./EditableName";
import { SpotifyPlay } from "./SpotifyPlay";
import { StarButton } from "./favourites";
import { BrandLogo } from "./BrandLogo";

const PLAY_BTN =
  "inline-flex items-center gap-2 rounded-full border border-lime-400/40 bg-lime-400/10 px-4 py-2 text-sm font-semibold text-lime-200 transition hover:border-lime-400/70 hover:bg-lime-400/20 hover:text-lime-100";

function MetaItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ink-700/70 bg-ink-900/40 px-3.5 py-2.5">
      <p className="text-[11px] uppercase tracking-wider text-soft">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function fmtDuration(sec?: number): string {
  if (!sec || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** Full export-style pitch card for a saved report. When `editableId` is given
 * (the saved-report detail page) the brief name can be renamed inline. */
export function ReportCard({
  report,
  editableId,
}: {
  report: SavedReport;
  editableId?: string;
}) {
  const { track, brief, analysis, marketSignal, usedDemoData } = report;
  const anyDemo =
    usedDemoData.musixmatch || usedDemoData.openrouter;
  const briefName =
    report.name?.trim() || analysis.briefName?.trim() || track.title;

  const created = new Date(report.createdAt);
  const createdLabel = created.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-4">
      {/* Header / export banner */}
      <div className="sf-card sf-card-pad">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <TrackCover url={marketSignal.artworkUrl} className="h-16 w-16" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="sf-eyebrow">SyncFit Pitch Card</p>
                {analysis.brand && <BrandLogo brand={analysis.brand} showName className="h-7 w-7" />}
              </div>
              <div className="mt-0.5">
                {editableId ? (
                  <EditableName
                    endpoint={`/api/reports/${editableId}`}
                    initialName={briefName}
                    ariaLabel="Report name"
                    title="Rename report"
                  />
                ) : (
                  <h1 className="truncate text-2xl font-bold text-white">
                    {briefName}
                  </h1>
                )}
              </div>
              <p className="truncate text-sm text-soft">
                {track.title} · {track.artist}
              </p>
              <div className="mt-1">
                <StreamsBadge
                  streams={marketSignal.streams}
                  status={marketSignal.status !== "Unknown" ? marketSignal.status : undefined}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <SpotifyPlay
                  title={track.title}
                  artist={track.artist}
                  spotifyId={marketSignal.spotifyTrackId}
                  label="Play track"
                  className={PLAY_BTN}
                />
                <StarButton
                  track={{
                    title: track.title,
                    artist: track.artist,
                    score: analysis.syncFitScore,
                    scoreLabel: analysis.scoreLabel,
                    genre: track.genre,
                    spotifyTrackId: marketSignal.spotifyTrackId,
                    artworkUrl: marketSignal.artworkUrl,
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-soft transition hover:border-amber-400/40 hover:text-amber-300 aria-pressed:border-amber-400/50 aria-pressed:bg-amber-400/10 aria-pressed:text-amber-300"
                />
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-soft">{createdLabel}</p>
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
          <MetaItem label="Genre" value={track.genre || "—"} />
          <MetaItem label="BPM" value={track.bpm ?? "—"} />
          <MetaItem label="Duration" value={fmtDuration(track.durationSec)} />
          <MetaItem
            label="Popularity"
            value={track.popularity == null ? "—" : `${track.popularity}/100`}
          />
          <MetaItem
            label="Explicit"
            value={track.explicit == null ? "—" : track.explicit ? "Yes" : "No"}
          />
          <MetaItem
            label="Instrumental"
            value={
              track.instrumental == null ? "—" : track.instrumental ? "Yes" : "No"
            }
          />
          <MetaItem
            label="Lyrics sync"
            value={
              track.hasRichsync
                ? "Word-level"
                : track.hasSubtitles
                  ? "Synced"
                  : track.hasLyrics
                    ? "Lyrics only"
                    : "—"
            }
          />
          <MetaItem label="ISRC" value={track.isrc || "—"} />
        </div>
      </div>

      {/* Brief */}
      <div className="sf-card sf-card-pad">
        <p className="sf-eyebrow mb-2">Creative Brief</p>
        <p className="text-sm leading-relaxed text-soft">
          {brief.brief || "—"}
        </p>
      </div>

      {/* Score + breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="sf-card sf-card-pad flex items-center justify-center lg:col-span-1">
          <SyncFitScoreGauge
            score={analysis.syncFitScore}
            label={analysis.scoreLabel}
          />
        </div>
        <div className="sf-card sf-card-pad lg:col-span-2">
          <p className="sf-eyebrow mb-3">Score Breakdown</p>
          <ScoreBreakdown breakdown={analysis.breakdown} />
        </div>
      </div>

      {/* Pitch + brand safety */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PitchSummaryCard
          pitchSummary={analysis.pitchSummary}
          bestUseCases={analysis.bestUseCases}
          supervisorNotes={analysis.supervisorNotes}
        />
        <div className="space-y-4">
          <BrandSafetyCard brandSafety={analysis.brandSafety} />
          <CreditsCard credits={track.credits} />
          <SignalsCard
            marketStatus={marketSignal.status}
            marketSummary={marketSignal.summary}
            marketConfidence={marketSignal.confidence}
            metrics={marketSignal.metrics}
            popularity={track.popularity}
          />
        </div>
      </div>
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

const compact = (n: number) =>
  Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-soft">{label}</p>
      <p className="mt-0.5 text-base font-bold tabular-nums text-white">{value}</p>
    </div>
  );
}

export function SignalsCard({
  marketStatus,
  marketSummary,
  marketConfidence,
  metrics,
  popularity,
  bare = false,
}: {
  marketStatus: string;
  marketSummary: string;
  marketConfidence?: number;
  metrics?: StreamMetrics | null;
  /** Musixmatch popularity (0-100), used when Songstats popularity is absent. */
  popularity?: number | null;
  bare?: boolean;
}) {
  const m = MARKET_STYLES[marketStatus] ?? MARKET_STYLES.Unknown;
  const pop = metrics?.spotifyPopularity ?? (popularity ?? null);
  const popSource = metrics?.spotifyPopularity != null ? "Songstats" : "Musixmatch";
  const tiles: { label: string; value: string }[] = [];
  if (metrics?.totalStreams != null) tiles.push({ label: "Total streams", value: compact(metrics.totalStreams) });
  if (metrics?.spotifyStreams != null && metrics.spotifyStreams !== metrics.totalStreams)
    tiles.push({ label: "Spotify streams", value: compact(metrics.spotifyStreams) });
  if (metrics?.playlists != null) tiles.push({ label: "Playlists", value: compact(metrics.playlists) });
  if (metrics?.playlistReach != null) tiles.push({ label: "Playlist reach", value: compact(metrics.playlistReach) });
  if (metrics?.shazams != null) tiles.push({ label: "Shazams", value: compact(metrics.shazams) });
  if (metrics?.youtubeViews != null) tiles.push({ label: "YouTube views", value: compact(metrics.youtubeViews) });
  if (metrics?.tiktokViews != null) tiles.push({ label: "TikTok views", value: compact(metrics.tiktokViews) });
  const hasStreaming = pop != null || tiles.length > 0;

  return (
    <div className={bare ? "sf-glass-soft p-5" : "sf-card sf-card-pad"}>
      <h3 className="mb-3 text-sm font-semibold text-white">Streaming &amp; Market</h3>

      {/* Streaming & popularity — live from Songstats */}
      {hasStreaming && (
        <div className="mb-4">
          <p className="sf-eyebrow mb-2">
            Streaming &amp; Popularity{" "}
            <span className="font-normal normal-case tracking-normal text-soft">· Songstats</span>
          </p>
          {pop != null && (
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="text-soft">
                  Popularity{" "}
                  <span className="text-soft/70">· {popSource}</span>
                </span>
                <span className="font-semibold tabular-nums text-white">{pop}/100</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-ink-700/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-lime-400"
                  style={{ width: `${Math.max(0, Math.min(100, pop))}%` }}
                />
              </div>
            </div>
          )}
          {tiles.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {tiles.map((t) => (
                <StatChip key={t.label} label={t.label} value={t.value} />
              ))}
            </div>
          )}
        </div>
      )}

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
      </div>
    </div>
  );
}
