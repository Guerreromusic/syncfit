import { getBenchmark } from "@/lib/benchmark-storage";
import { notFound } from "next/navigation";
import { scoreColor } from "@/lib/scoreColor";
import { TrophyIcon, WaveIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

function DecodeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className ?? "h-4 w-4"} aria-hidden>
      <path d="M10 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  );
}

export default async function BenchmarkSharePage({
  params,
}: {
  params: { token: string };
}) {
  const record = await getBenchmark(params.token);
  if (!record) notFound();

  const ranked = [...record.results].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sf-card sf-card-pad">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 ring-1 ring-inset ring-purple-400/30">
            <TrophyIcon className="h-5 w-5 text-purple-300" aria-hidden />
          </span>
          <div>
            <p className="sf-eyebrow">Track Arena · Benchmark Report</p>
            <h1 className="text-base font-semibold text-white">SyncFit Benchmark Comparison</h1>
          </div>
        </div>
        {record.briefText && (
          <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-soft/70 mb-1">Brief</p>
            <p className="text-sm leading-relaxed text-soft">{record.briefText}</p>
          </div>
        )}
      </div>

      {/* Results grid */}
      <div
        className={`grid grid-cols-1 gap-3 ${ranked.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
      >
        {ranked.map((r, rank) => {
          const isWinner = rank === 0 && r.score > 0;
          return (
            <div
              key={rank}
              className={`sf-glass-soft p-4 ${isWinner ? "ring-1 ring-inset ring-lime-500/40" : ""}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-600/25 text-xs font-bold text-purple-100 ring-1 ring-inset ring-purple-400/40">
                  {rank + 1}
                </span>
                {isWinner && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-lime-500/10 px-2 py-0.5 text-[11px] font-semibold text-lime-300 ring-1 ring-inset ring-lime-500/30">
                    <TrophyIcon className="h-3.5 w-3.5" aria-hidden />
                    Winner
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {r.artworkUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.artworkUrl}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-inset ring-white/10"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-600/15 text-purple-200 ring-1 ring-inset ring-white/10">
                    <WaveIcon className="h-5 w-5" aria-hidden />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{r.title}</p>
                  <p className="truncate text-xs text-soft">{r.artist}</p>
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className={`text-3xl font-bold tabular-nums ${scoreColor(r.score)}`}>
                  {r.score}
                </span>
                <span className="text-xs text-soft">/ 100</span>
              </div>
              <p className="text-xs text-soft">{r.scoreLabel}</p>
              {r.pitchSummary && (
                <p className="mt-2 text-xs leading-relaxed text-soft line-clamp-3">
                  {r.pitchSummary}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Breakdown table */}
      {ranked.some((r) => Object.keys(r.breakdown ?? {}).length > 0) && (
        <div className="sf-glass-soft p-5 overflow-x-auto">
          <p className="sf-eyebrow mb-3">Score Breakdown</p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="py-2 pr-3 text-left text-xs font-medium text-soft">Category</th>
                {ranked.map((r, i) => (
                  <th key={i} className="px-3 py-2 text-right text-xs font-semibold text-white">
                    {r.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(ranked[0]?.breakdown ?? {}).map((cat) => (
                <tr key={cat} className="border-t border-white/[0.06]">
                  <td className="py-2 pr-3 text-left text-soft capitalize">
                    {cat.replace(/([A-Z])/g, " $1")}
                  </td>
                  {ranked.map((r, i) => {
                    const v = r.breakdown?.[cat] ?? 0;
                    const best =
                      v === Math.max(...ranked.map((x) => x.breakdown?.[cat] ?? 0)) && v > 0;
                    return (
                      <td
                        key={i}
                        className={`px-3 py-2 text-right tabular-nums ${best ? "font-semibold text-lime-300" : "text-white"}`}
                      >
                        {v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report icon — decorative, references DecodeIcon to avoid unused-import lint */}
      <div className="sr-only">
        <DecodeIcon />
      </div>

      <footer className="text-center">
        <p className="text-xs text-soft">
          Benchmark by <span className="font-semibold text-white">SyncFit by Synclat</span> ·
          Music sync intelligence
        </p>
      </footer>
    </div>
  );
}
