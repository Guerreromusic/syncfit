import Link from "next/link";
import {
  BoltIcon,
  WaveIcon,
  ShieldIcon,
  DocIcon,
  ArrowRightIcon,
  ChartIcon,
  ClockIcon,
} from "@/components/icons";
import { DEMO_TRACKS } from "@/lib/demo";
import { listReports } from "@/lib/storage";
import { TrendingLatin } from "@/components/TrendingLatin";
import { StatTile } from "@/components/StatTile";

export const dynamic = "force-dynamic";

// Estimated minutes of manual research saved per SyncFit analysis.
const MINUTES_SAVED_PER_REPORT = 25;

function scoreColor(score: number): string {
  if (score >= 85) return "text-lime-300";
  if (score >= 70) return "text-lime-400";
  if (score >= 50) return "text-purple-200";
  return "text-red-300";
}

const FEATURES = [
  {
    icon: WaveIcon,
    title: "Lyric & Context Fit",
    body:
      "Real-time Musixmatch metadata and lyric context, scored against the creative intent of your brief — never storing or displaying full lyrics.",
  },
  {
    icon: ShieldIcon,
    title: "Brand Safety",
    body:
      "Explicit-content awareness and a clear Low / Medium / High brand-safety read tuned to your requested safety level.",
  },
  {
    icon: DocIcon,
    title: "Pitch-Ready Summary",
    body:
      "A supervisor-ready pitch, best-use cases, and supervisor notes you can drop straight into a music brief or client deck.",
  },
];

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
      hint: `Estimated manual Latin-music research time saved — about ${MINUTES_SAVED_PER_REPORT} min per analysis.`,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero — slim banner */}
      <section className="sf-card relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-6 py-5 sm:px-8">
          <div className="min-w-0">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] font-medium text-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
              Musixmatch Musicathon · MVP
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              SyncFit <span className="text-soft">by Synclat</span>
            </h1>
            <p className="mt-1 text-sm text-soft">
              Score, explain, and pitch Latin tracks for global sync.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="/analyzer" className="sf-btn-primary">
              <BoltIcon className="h-4 w-4" aria-hidden />
              Run SyncFit
            </Link>
            <Link href="/report" className="sf-btn-secondary">
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
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {recent.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/report/${r.id}`}
                  className="sf-card block p-4 transition hover:border-purple-400/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-semibold text-white">
                      {r.track.title}
                    </p>
                    <span
                      className={
                        "shrink-0 text-lg font-bold tabular-nums " +
                        scoreColor(r.analysis.syncFitScore)
                      }
                    >
                      {r.analysis.syncFitScore}
                    </span>
                  </div>
                  <p className="truncate text-xs text-soft">{r.track.artist}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <span className="sf-pill text-[10px]">{r.brief.projectType}</span>
                    <span className="sf-pill text-[10px]">{r.brief.region}</span>
                  </div>
                </Link>
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

      {/* What SyncFit does */}
      <section>
        <p className="sf-eyebrow mb-3">What SyncFit does</p>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="sf-card sf-card-pad">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600/20 ring-1 ring-inset ring-purple-500/30">
                <Icon className="h-5 w-5 text-lime-400" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-soft">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo tracks */}
      <section>
        <div className="sf-card sf-card-pad">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="sf-eyebrow">Demo Catalog</p>
              <h3 className="mt-1 text-sm font-semibold text-white">
                Try SyncFit instantly — no keys required
              </h3>
            </div>
            <Link href="/analyzer" className="sf-btn-secondary hidden sm:inline-flex">
              Open Analyzer
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {DEMO_TRACKS.map((t) => (
              <li
                key={t.trackId}
                className="rounded-xl border border-ink-700/70 bg-ink-900/40 p-4"
              >
                <p className="text-sm font-semibold text-white">{t.title}</p>
                <p className="text-xs text-soft">{t.artist}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="sf-pill text-[11px]">{t.genre}</span>
                  {t.bpm && <span className="sf-pill text-[11px]">{t.bpm} BPM</span>}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-soft">
            Demo tracks are Synclat-authored placeholders — not Musixmatch data
            and not real lyrics.
          </p>
        </div>
      </section>
    </div>
  );
}
