import Link from "next/link";
import { BoltIcon, WaveIcon, ShieldIcon, DocIcon, ArrowRightIcon } from "@/components/icons";
import { DEMO_TRACKS } from "@/lib/demo";

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

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="sf-card relative overflow-hidden">
        <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-14">
          <span className="sf-pill mb-5 text-purple-100">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
            Musixmatch Musicathon · MVP
          </span>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            SyncFit by Synclat
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-soft">
            Score, explain, and pitch Latin tracks for global sync.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-soft/90">
            SyncFit helps music supervisors instantly understand whether a Latin
            track fits a creative brief for film, TV, ads, games, and branded
            content.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/analyzer" className="sf-btn-primary">
              <BoltIcon className="h-4 w-4" />
              Run SyncFit
            </Link>
            <Link href="/report" className="sf-btn-secondary">
              View saved reports
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-6 text-xs text-soft">
            Built for Musicathon using Musixmatch APIs.
          </p>
        </div>
        {/* decorative gradient orb */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-purple-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-20 h-56 w-56 rounded-full bg-lime-500/10 blur-3xl" />
      </section>

      {/* Feature cards */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="sf-card sf-card-pad animate-fade-up">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600/20 ring-1 ring-inset ring-purple-500/30">
              <Icon className="h-5 w-5 text-lime-400" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-soft">{body}</p>
          </div>
        ))}
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
