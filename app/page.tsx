import Link from "next/link";
import {
  DocIcon,
  ArrowRightIcon,
  ChartIcon,
  ClockIcon,
  WaveIcon,
  RocketIcon,
} from "@/components/icons";
import { listReports } from "@/lib/storage";
import { TrendingLatin } from "@/components/TrendingLatin";
import { StatTile } from "@/components/StatTile";
import { SpotifyPlay } from "@/components/SpotifyPlay";
import { FirstVisitRedirect } from "@/components/FirstVisitRedirect";

export const dynamic = "force-dynamic";

// Estimated minutes of manual research saved per SyncFit analysis.
const MINUTES_SAVED_PER_REPORT = 25;

function scoreColor(score: number): string {
  if (score >= 85) return "text-lime-300";
  if (score >= 70) return "text-lime-400";
  if (score >= 50) return "text-purple-200";
  return "text-red-300";
}

export default async function HomePage() {
  const reports = await listReports();
  const recent = reports.filter((r) => !r.archived).slice(0, 8);
  const total = reports.length;
  const avgScore = total
    ? Math.round(reports.reduce((s, r) => s + r.analysis.syncFitScore, 0) / total)
    : 0;
  const hoursSaved =
    Math.round(((total * MINUTES_SAVED_PER_REPORT) / 60) * 10) / 10;

  const stats = [
    {
      label: "Reports run",
      value: String(total),
      icon: DocIcon,
      accent: "purple" as const,
      hint: "Total SyncFit analyses you've saved.",
    },
    {
      label: "Avg SyncFit score",
      value: total ? `${avgScore}` : "—",
      icon: ChartIcon,
      accent: "lime" as const,
      hint: "Average score (0–100) across all your saved reports.",
    },
    {
      label: "Research hours saved",
      value: `${hoursSaved}h`,
      icon: ClockIcon,
      accent: "purple" as const,
      hint: `Estimated manual music research time saved — about ${MINUTES_SAVED_PER_REPORT} min per analysis.`,
    },
  ];

  return (
    <div className="space-y-8">
      {/* First landing of a session → Research */}
      <FirstVisitRedirect />

      {/* Hero — slim banner */}
      <section className="sf-card relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-3.5 sm:px-6">
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
              SyncFit <span className="text-soft">by Synclat</span>
            </h1>
            <p className="text-xs text-soft">
              Score, explain, and pitch tracks for global sync.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <Link href="/analyzer" className="sf-btn-primary">
              <RocketIcon className="h-4 w-4" aria-hidden />
              Deploy research
            </Link>
            <Link href="/report" className="sf-btn-white">
              View reports
              <ArrowRightIcon className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-purple-600/12 blur-3xl" />
      </section>

      {/* Stat tiles */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
        {stats.map((s) => (
          <StatTile
            key={s.label}
            value={s.value}
            label={s.label}
            hint={s.hint}
            icon={s.icon}
            accent={s.accent}
          />
        ))}
      </section>

      {/* Trending Latin — live via Songstats */}
      <TrendingLatin />

      {/* Recent reports — quick access from the dashboard */}
      {recent.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="sf-eyebrow">Recent reports</p>
              <h3 className="mt-1 text-sm font-semibold text-white">
                Your latest SyncFit analyses
              </h3>
            </div>
            <Link href="/report" className="sf-btn-secondary hidden sm:inline-flex">
              View all
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {recent.map((r, ri) => (
              <li key={r.id}>
                {/* Capsule: rounded pill — cover · title/artist · score · play */}
                <div className="group relative flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.025] py-1.5 pl-1.5 pr-4 transition hover:border-purple-400/50 hover:bg-white/[0.05]">
                  <Link
                    href={`/report/${r.id}`}
                    aria-label={`Open report for ${r.track.title}`}
                    className="absolute inset-0 z-0 rounded-full"
                  />
                  <div className="pointer-events-none z-10 shrink-0">
                    {r.marketSignal.artworkUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.marketSignal.artworkUrl}
                        alt=""
                        className="h-11 w-11 rounded-full object-cover ring-1 ring-inset ring-white/10"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-600/20 text-purple-200 ring-1 ring-inset ring-white/10">
                        <WaveIcon className="h-5 w-5" aria-hidden />
                      </span>
                    )}
                  </div>
                  <div className="pointer-events-none z-10 min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {r.track.title}
                    </p>
                    <p className="truncate text-xs text-soft">{r.track.artist}</p>
                  </div>
                  <span
                    className={
                      "pointer-events-none z-10 shrink-0 text-base font-bold tabular-nums " +
                      scoreColor(r.analysis.syncFitScore)
                    }
                  >
                    {r.analysis.syncFitScore}
                  </span>
                  <span className="z-10 shrink-0">
                    <SpotifyPlay
                      title={r.track.title}
                      artist={r.track.artist}
                      spotifyId={r.marketSignal.spotifyTrackId}
                      label=""
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-soft transition hover:bg-lime-400 hover:text-ink-950"
                      queue={recent.map((x) => ({
                        id: x.marketSignal.spotifyTrackId ?? undefined,
                        title: x.track.title,
                        artist: x.track.artist,
                      }))}
                      queueIndex={ri}
                    />
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/report"
            className="mt-3 inline-flex text-xs font-medium text-soft transition hover:text-white sm:hidden"
          >
            View all reports →
          </Link>
        </section>
      )}
    </div>
  );
}
