import Link from "next/link";
import {
  WaveIcon,
  BoltIcon,
  ShieldIcon,
  DocIcon,
  SearchIcon,
  ChartIcon,
  SparkIcon,
  ArrowRightIcon,
} from "@/components/icons";

export const metadata = {
  title: "How it works — SyncFit by Synclat",
};

const FLOW = [
  {
    n: 1,
    title: "Write a brief",
    body: "Describe the placement — project type, region, mood, language, brand-safety level, and license tier.",
  },
  {
    n: 2,
    title: "Add a track (optional)",
    body: "Name a song to score it, or leave it blank and let SyncFit find the 10 best-fitting tracks for you.",
  },
  {
    n: 3,
    title: "Run SyncFit — one step",
    body: "One click resolves the track on Musixmatch and scores it with AI, in a single request.",
  },
  {
    n: 4,
    title: "Get a pitch-ready result",
    body: "A SyncFit Score, category breakdown, brand-safety read, pitch summary, and alternatives — savable as a report.",
  },
];

const FEATURES = [
  {
    icon: ChartIcon,
    title: "SyncFit Score /100",
    body: "A weighted score across seven categories — Brief Match (25), Lyric & Context Fit (20), Mood/Energy (15), Brand Safety (15), License Readiness (10), Market Signal (10), Audio Readiness (5).",
  },
  {
    icon: ShieldIcon,
    title: "Brand Safety read",
    body: "An assessed Low / Medium / High suitability with notes, tuned to the safety level your brief requests.",
  },
  {
    icon: DocIcon,
    title: "Pitch-ready summary",
    body: "A supervisor-style pitch, best-use cases, and notes you can paste straight into a brief or client deck.",
  },
  {
    icon: SearchIcon,
    title: "TrackFit discovery",
    body: "No track in mind? SyncFit recommends and ranks the 10 best-fitting Latin tracks — pick one to score it in full.",
  },
  {
    icon: WaveIcon,
    title: "Suggested alternatives",
    body: "Comparable Latin tracks the AI proposes alongside any single-track result.",
  },
  {
    icon: SparkIcon,
    title: "Saved & archivable reports",
    body: "Every run is saved as a shareable pitch card you can revisit, archive, or restore — scores and summaries only.",
  },
];

const APIS = [
  {
    name: "Musixmatch",
    role: "Music data layer (required)",
    state: "Core",
    body: "The hackathon's required data source. Finds the track and supplies real metadata — artist, album, language, genre, and the explicit flag — plus a short lyric context for theme. Used in real time only.",
  },
  {
    name: "AI Model",
    role: "Reasoning layer (via OpenRouter)",
    state: "Core",
    body: "The judgment engine. Takes your brief + the track metadata and produces the score, breakdown, brand-safety read, pitch, and alternatives. Model is switchable (cheapest GPT / Gemini / Claude tiers).",
  },
  {
    name: "Songstats",
    role: "Market signal (optional)",
    state: "Optional",
    body: "Looks up the track's momentum (streams / catalogue presence) and maps it to a market status — Emerging, Rising, or Established — with a confidence read.",
  },
  {
    name: "LALAL.AI",
    role: "Audio readiness (optional)",
    state: "Optional",
    body: "Estimates how dialogue-friendly and stem-separable a track is for an instrumental bed. Included when a key and preview URL are provided.",
  },
  {
    name: "Cyanite",
    role: "Advanced sonic tagging",
    state: "Planned",
    body: "Future: mood, energy, tempo, instrumentation, and similarity search for deeper sonic matching.",
  },
];

const STATE_STYLE: Record<string, string> = {
  Core: "text-lime-300 bg-lime-500/10 ring-lime-500/30",
  Optional: "text-soft bg-ink-700/50 ring-ink-600",
  Planned: "text-purple-200 bg-purple-600/15 ring-purple-500/30",
};

export default function InfoPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="sf-eyebrow">How it works</p>
        <h1 className="mt-1 text-2xl font-bold text-white">
          Inside SyncFit by Synclat
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-soft">
          SyncFit helps music supervisors instantly understand whether a Latin
          track fits a creative brief for film, TV, ads, games, and branded
          content — and surfaces the best-fitting tracks when you don&apos;t have
          one yet.
        </p>
      </header>

      {/* Flow */}
      <section className="sf-glass p-6 sm:p-8">
        <div className="relative z-10">
          <h2 className="text-base font-semibold text-white">The flow</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FLOW.map((s) => (
              <div key={s.n} className="sf-glass-soft p-4">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-600/30 text-xs font-bold text-purple-100 ring-1 ring-inset ring-purple-400/40">
                  {s.n}
                </span>
                <h3 className="mt-3 text-sm font-semibold text-white">{s.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-soft">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-white">What each feature does</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="sf-card sf-card-pad">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 ring-1 ring-inset ring-purple-500/30">
                <Icon className="h-5 w-5 text-lime-400" aria-hidden />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-soft">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* APIs */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-white">What each API does</h2>
        <div className="space-y-3">
          {APIS.map((a) => (
            <div key={a.name} className="sf-card sf-card-pad">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-baseline gap-2.5">
                  <h3 className="text-sm font-semibold text-white">{a.name}</h3>
                  <span className="text-xs text-soft">{a.role}</span>
                </div>
                <span
                  className={
                    "rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset " +
                    (STATE_STYLE[a.state] ?? STATE_STYLE.Optional)
                  }
                >
                  {a.state}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-soft">{a.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Compliance */}
      <section className="sf-card sf-card-pad">
        <div className="flex items-center gap-2">
          <ShieldIcon className="h-5 w-5 text-purple-300" aria-hidden />
          <h2 className="text-sm font-semibold text-white">Compliance</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-soft">
          SyncFit uses Musixmatch data in real time only. It never stores,
          caches, displays, or commits full lyrics or raw API responses — saved
          reports keep only your brief, basic track metadata, and
          Synclat-generated scores &amp; summaries. API keys live server-side and
          are never exposed to the browser.
        </p>
      </section>

      <div className="flex flex-wrap gap-3 pb-4">
        <Link href="/analyzer" className="sf-btn-primary">
          <BoltIcon className="h-4 w-4" aria-hidden />
          Try the Analyzer
        </Link>
        <Link href="/settings" className="sf-btn-secondary">
          View API status
          <ArrowRightIcon className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
