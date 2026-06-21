import type { MarketSpend } from "@/lib/types";

export function MarketSpendCard({
  marketSpend,
}: {
  marketSpend?: MarketSpend | null;
}) {
  if (!marketSpend?.ageGroups?.length) return null;

  return (
    <div className="sf-card sf-card-pad">
      <p className="sf-eyebrow mb-4">Audience &amp; Market Spend</p>

      {/* Age group rows */}
      <div className="space-y-3.5 mb-5">
        {marketSpend.ageGroups.map((g) => {
          const pct = Math.min(100, Math.max(0, g.indexScore));
          const strong = pct >= 80;
          const moderate = pct >= 60 && pct < 80;
          const barClass = strong
            ? "bg-lime-400"
            : moderate
              ? "bg-purple-400"
              : "bg-zinc-600";
          const labelClass = strong
            ? "text-lime-400"
            : moderate
              ? "text-purple-300"
              : "text-zinc-500";

          return (
            <div key={g.label}>
              <div className="flex items-center gap-2.5">
                {/* Age label */}
                <span className="w-11 shrink-0 text-[11px] font-medium text-white">
                  {g.label}
                </span>

                {/* Index bar */}
                <div className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full ${barClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Per-capita spend */}
                <span className="w-14 shrink-0 text-right text-[11px] text-soft">
                  ${g.spendUsd}/mo
                </span>

                {/* Index score */}
                <span className={`w-7 shrink-0 text-right text-xs font-bold tabular-nums ${labelClass}`}>
                  {pct}
                </span>
              </div>

              {/* Insight */}
              {g.insight && (
                <p className="mt-0.5 pl-[3.25rem] text-[11px] leading-relaxed text-soft/70">
                  {g.insight}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mb-4 flex items-center gap-4 text-[10px] text-soft/60">
        <span className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-3 rounded-full bg-lime-400" />
          Strong (80+)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-3 rounded-full bg-purple-400" />
          Moderate (60–79)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-3 rounded-full bg-zinc-600" />
          Low (&lt;60)
        </span>
      </div>

      <div className="space-y-3 border-t border-white/10 pt-4">
        {/* Primary demo */}
        {marketSpend.primaryDemo && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-soft">
              Primary
            </span>
            <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-medium text-purple-300 ring-1 ring-inset ring-purple-500/30">
              {marketSpend.primaryDemo}
            </span>
          </div>
        )}

        {/* Best verticals */}
        {marketSpend.bestVerticals.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-soft">
              Verticals
            </span>
            {marketSpend.bestVerticals.map((v) => (
              <span
                key={v}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-soft"
              >
                {v}
              </span>
            ))}
          </div>
        )}

        {/* TAM */}
        {marketSpend.totalAddressableMarket && (
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-soft">
              Market Size
            </span>
            <span className="text-sm font-semibold text-white">
              {marketSpend.totalAddressableMarket}
            </span>
          </div>
        )}

        {/* Placement note */}
        {marketSpend.placementNote && (
          <p className="text-sm leading-relaxed text-soft">
            {marketSpend.placementNote}
          </p>
        )}
      </div>
    </div>
  );
}
