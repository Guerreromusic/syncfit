import Link from "next/link";
import {
  ShieldIcon,
  ChartIcon,
  SparkIcon,
  ArrowRightIcon,
  MegaphoneIcon,
  WaveIcon,
} from "@/components/icons";

export const metadata = {
  title: "How it works — SyncFit by Synclat",
};

const STEPS = [
  {
    n: 1,
    title: "Chat your brief",
    body: "Describe a placement in the Research chat — or paste a Spotify link to score that exact song. Worldwide, any genre.",
  },
  {
    n: 2,
    title: "Get a scored result",
    body: "A SyncFit Score with a brand-safety read and a pitch — or the 10 best-fitting tracks to choose from. Ask follow-up questions in plain language.",
  },
  {
    n: 3,
    title: "Pitch it",
    body: "Save it as a pitch card, bundle several tracks into one swipeable pitch project, and share a public link.",
  },
];

const FEATURES = [
  {
    icon: ChartIcon,
    title: "SyncFit Score /100",
    body: "A weighted score across 7 categories — brief match, lyric & context, mood/energy, brand safety, license, market signal, production fit.",
  },
  {
    icon: ShieldIcon,
    title: "Brand safety + pitch",
    body: "A Low / Medium / High suitability read plus a supervisor-ready pitch and best-for placement ideas.",
  },
  {
    icon: SparkIcon,
    title: "Ask anything",
    body: "Natural-language Q&A on any result — ask why it fits, brand-safety questions, or for more detail, right in the chat or report.",
  },
  {
    icon: MegaphoneIcon,
    title: "Pitch projects",
    body: "Bundle multiple tracks into one pitch with swipeable tabs — switch between tracks by sliding left or right.",
  },
  {
    icon: WaveIcon,
    title: "Play & explore",
    body: "Play any track in the in-app footer player, browse trending music, and open the full report for credits, lyric translation, streaming data, and a worldwide influence map.",
  },
  {
    icon: ChartIcon,
    title: "Brand logos",
    body: "Name a brand in your brief and SyncFit shows its logo on the result, report, and pitch — so the deck reads instantly.",
  },
];

const DATA = [
  ["Musixmatch", "Track search, metadata, and a short lyric context — required, real-time only, never stored."],
  ["AI (via OpenRouter)", "Does all the reasoning — score, brand safety, pitch, alternatives. Switchable low-cost models."],
  ["Songstats", "Streaming counts, market signal, and artwork."],
  ["Spotify", "Resolves pasted links and fills metadata gaps."],
  ["MusicBrainz", "Writers, producers, and label credits."],
];

const FAQ = [
  {
    q: "Does SyncFit store or show full lyrics?",
    a: "No — only a short lyric context is fetched in real time to read the theme, never stored or displayed as full lyrics. Saved reports keep only your brief, basic metadata, and Synclat-generated scores and summaries.",
  },
  {
    q: "What if I don't have a track in mind?",
    a: "Just describe the placement — SyncFit recommends and ranks the 10 best-fitting tracks. Tap one to score it in full.",
  },
  {
    q: "Which AI model runs it?",
    a: "A switchable, low-cost model layer (GPT-5 mini by default). Pick a model from the switch on the Research and Arena consoles.",
  },
  {
    q: "Can I share a result?",
    a: "Yes — open a report in Pitch and mint a public link. Anyone with it sees a clean, chrome-free pitch card (scores and summaries only).",
  },
];

export default function InfoPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="sf-eyebrow">How it works</p>
        <h1 className="mt-1 text-2xl font-bold text-white">Inside SyncFit</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-soft">
          SyncFit tells music supervisors whether a track fits a creative brief —
          for film, TV, ads, games, and branded content — and finds the
          best-fitting tracks when you don&apos;t have one yet. Worldwide, any genre.
        </p>
      </header>

      {/* 3 steps */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.n} className="sf-card sf-card-pad">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-lime-400/15 text-xs font-bold text-lime-300 ring-1 ring-inset ring-lime-400/30">
              {s.n}
            </span>
            <h3 className="mt-3 text-sm font-semibold text-white">{s.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-soft">{s.body}</p>
          </div>
        ))}
      </section>

      {/* What you get */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-white">What you get</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="sf-card sf-card-pad">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/20 ring-1 ring-inset ring-purple-500/30">
                <Icon className="h-5 w-5 text-lime-400" aria-hidden />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-soft">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The data behind it */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-white">The data behind it</h2>
        <ul className="sf-card divide-y divide-white/[0.06]">
          {DATA.map(([name, body]) => (
            <li key={name} className="flex flex-col gap-0.5 px-5 py-3 sm:flex-row sm:items-baseline sm:gap-3">
              <span className="shrink-0 text-sm font-semibold text-white sm:w-44">{name}</span>
              <span className="text-sm text-soft">{body}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-white">Questions &amp; answers</h2>
        <div className="space-y-2.5">
          {FAQ.map((f) => (
            <details key={f.q} className="sf-card group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-white">
                {f.q}
                <span
                  aria-hidden
                  className="shrink-0 text-lg leading-none text-soft transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-2.5 text-sm leading-relaxed text-soft">{f.a}</p>
            </details>
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
          Musixmatch data is used in real time only — never stored, cached, or
          displayed as full lyrics. Saved reports keep only your brief, basic
          metadata, and Synclat-generated scores &amp; summaries. API keys stay
          server-side.
        </p>
      </section>

      <div className="flex flex-wrap gap-3 pb-4">
        <Link href="/analyzer" className="sf-btn-white">
          Start researching
          <ArrowRightIcon className="h-4 w-4" aria-hidden />
        </Link>
        <Link href="/settings" className="sf-btn-secondary">
          API status
          <ArrowRightIcon className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
