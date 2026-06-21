"use client";

import { useEffect, useState, useCallback } from "react";
import { PUZZLE_PIECES } from "@/lib/analytics-shared";

// -----------------------------------------------------------------------------
// Types (mirror what the API returns)
// -----------------------------------------------------------------------------

type OnlineUser = {
  sessionId: string;
  musicalName: string;
  puzzlePieceIndex: number;
  country: string;
  city: string;
  firstSeen: string;
  totalSeconds: number;
};

type RecentSession = {
  sessionId: string;
  musicalName: string;
  puzzlePieceIndex: number;
  country: string;
  city: string;
  firstSeen: string;
  lastSeen: string;
  totalSeconds: number;
};

type AnalyticsData = {
  onlineCount: number;
  online: OnlineUser[];
  recentSessions: RecentSession[];
};

// -----------------------------------------------------------------------------
// Format helpers
// -----------------------------------------------------------------------------

function fmtDuration(seconds: number): string {
  if (seconds < 60) return "< 1 min";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

function fmtLocation(country: string, city: string): string {
  const c = country?.trim();
  const ci = city?.trim();
  if (ci && ci !== "Unknown" && c && c !== "Unknown") return `${ci}, ${c}`;
  if (c && c !== "Unknown") return c;
  return "Unknown";
}

// -----------------------------------------------------------------------------
// Puzzle piece SVG
// -----------------------------------------------------------------------------

function PuzzlePieceSVG({
  index,
  size = 40,
}: {
  index: number;
  size?: number;
}) {
  const piece = PUZZLE_PIECES[index] ?? PUZZLE_PIECES[0];
  return (
    <svg
      width={size}
      height={size}
      viewBox="-8 -8 56 56"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M 0,0 H 14 Q 14,-6 20,-6 Q 26,-6 26,0 H 40 V 14 Q 46,14 46,20 Q 46,26 40,26 V 40 H 26 Q 26,46 20,46 Q 14,46 14,40 H 0 V 26 Q -6,26 -6,20 Q -6,14 0,14 Z"
        fill={piece.color}
        fillOpacity={0.85}
      />
      <text
        x="20"
        y="24"
        textAnchor="middle"
        fontSize="8"
        fill="white"
        fontWeight="700"
        dominantBaseline="middle"
      >
        {piece.sound}
      </text>
    </svg>
  );
}

// -----------------------------------------------------------------------------
// 24-hour bar chart
// -----------------------------------------------------------------------------

function HourlyBarChart({ sessions }: { sessions: RecentSession[] }) {
  const now = new Date();
  const currentHour = now.getHours();

  // Build bucket counts for the last 24 hours
  const buckets = Array.from({ length: 24 }, (_, i) => {
    const hourTarget = (currentHour - 23 + i + 24) % 24;
    return {
      hour: hourTarget,
      count: 0,
      isCurrent: hourTarget === currentHour,
    };
  });

  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  for (const s of sessions) {
    const d = new Date(s.firstSeen);
    if (d < cutoff) continue;
    const h = d.getHours();
    const idx = buckets.findIndex((b) => b.hour === h);
    if (idx >= 0) buckets[idx].count++;
  }

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  const chartWidth = 600;
  const chartHeight = 80;
  const barW = Math.floor(chartWidth / 24) - 2;

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`}
      width="100%"
      aria-label="24-hour session activity"
      style={{ display: "block" }}
    >
      {buckets.map((b, i) => {
        const barH = maxCount > 0 ? Math.max(2, (b.count / maxCount) * chartHeight) : 2;
        const x = i * (chartWidth / 24);
        const y = chartHeight - barH;
        const fill = b.isCurrent ? "#818cf8" : "#a3e635";

        return (
          <g key={i}>
            <rect
              x={x + 1}
              y={y}
              width={barW}
              height={barH}
              fill={fill}
              opacity={b.count === 0 ? 0.18 : 0.85}
              rx={2}
            />
            {/* X-axis label at 0, 6, 12, 18, 24 */}
            {(b.hour === 0 || b.hour === 6 || b.hour === 12 || b.hour === 18) && (
              <text
                x={x + barW / 2}
                y={chartHeight + 14}
                textAnchor="middle"
                fontSize="9"
                fill="rgba(255,255,255,0.4)"
              >
                {b.hour}
              </text>
            )}
          </g>
        );
      })}
      {/* "24" label at far right */}
      <text
        x={chartWidth - 2}
        y={chartHeight + 14}
        textAnchor="end"
        fontSize="9"
        fill="rgba(255,255,255,0.4)"
      >
        24
      </text>
    </svg>
  );
}

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

export function LiveAudienceSection() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics/session", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json() as AnalyticsData;
        setData(json);
      }
    } catch {
      /* best-effort */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    const timer = setInterval(() => void fetchData(), 30_000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // Derived stats
  const today = new Date().toDateString();
  const todayCount = data?.recentSessions.filter(
    (s) => new Date(s.firstSeen).toDateString() === today,
  ).length ?? 0;

  const avgSeconds =
    data && data.recentSessions.length > 0
      ? Math.round(
          data.recentSessions.reduce((sum, s) => sum + s.totalSeconds, 0) /
            data.recentSessions.length,
        )
      : 0;

  const avgMin = Math.floor(avgSeconds / 60);
  const avgSec = avgSeconds % 60;
  const avgLabel =
    avgSeconds < 60 ? "< 1 min" : `${avgMin}m ${avgSec}s`;

  const recentTable = (data?.recentSessions ?? []).slice(0, 50);

  return (
    <section className="sf-card sf-card-pad space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {/* Pulsing dot */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-lime-400" />
            </span>
            <p className="sf-eyebrow">Live Audience</p>
          </div>
          <p className="mt-0.5 text-xs text-soft">
            Public — all visitors to this platform
          </p>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 bg-ink-700/70 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-lime-400">
            {loading ? "—" : (data?.onlineCount ?? 0)}
          </p>
          <p className="mt-0.5 text-xs text-soft">Online Now</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-ink-700/70 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-white">
            {loading ? "—" : todayCount}
          </p>
          <p className="mt-0.5 text-xs text-soft">Today</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-ink-700/70 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-white">
            {loading ? "—" : avgLabel}
          </p>
          <p className="mt-0.5 text-xs text-soft">Avg Session</p>
        </div>
      </div>

      <hr className="border-white/10" />

      {/* Online now grid */}
      {!loading && (data?.onlineCount ?? 0) > 0 && (
        <>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-soft">
              Online Now
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(data?.online ?? []).map((user) => {
                const piece = PUZZLE_PIECES[user.puzzlePieceIndex] ?? PUZZLE_PIECES[0];
                return (
                  <div
                    key={user.sessionId}
                    className={`flex items-center gap-2.5 rounded-xl border border-white/10 p-3 ${piece.bgClass}`}
                  >
                    <PuzzlePieceSVG index={user.puzzlePieceIndex} size={40} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">
                        {user.musicalName}
                      </p>
                      <p className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-soft">
                        {piece.sound}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-soft">
                        {fmtLocation(user.country, user.city)}
                      </p>
                      <p className="truncate text-[11px] text-soft">
                        {fmtDuration(user.totalSeconds)} online
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <hr className="border-white/10" />
        </>
      )}

      {/* 24-hour bar chart */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-soft">
          24-Hour Activity
        </p>
        <div className="rounded-xl border border-white/10 bg-ink-700/70 p-3">
          <HourlyBarChart sessions={data?.recentSessions ?? []} />
          <div className="mt-1 flex items-center gap-3 text-[10px] text-soft">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded-sm bg-lime-400 opacity-85" />
              Past hours
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded-sm bg-indigo-400 opacity-85" />
              Current hour
            </span>
          </div>
        </div>
      </div>

      <hr className="border-white/10" />

      {/* Session log table */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-soft">
          Session Log
        </p>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[500px] text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-3 py-2 text-left font-semibold text-soft">Piece</th>
                <th className="px-3 py-2 text-left font-semibold text-soft">Name</th>
                <th className="px-3 py-2 text-left font-semibold text-soft">Location</th>
                <th className="px-3 py-2 text-left font-semibold text-soft">First Seen</th>
                <th className="px-3 py-2 text-left font-semibold text-soft">Duration</th>
              </tr>
            </thead>
            <tbody>
              {recentTable.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-soft"
                  >
                    No sessions recorded yet.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-soft"
                  >
                    Loading…
                  </td>
                </tr>
              )}
              {recentTable.map((s) => {
                const piece = PUZZLE_PIECES[s.puzzlePieceIndex] ?? PUZZLE_PIECES[0];
                return (
                  <tr
                    key={s.sessionId}
                    className="border-b border-white/[0.06] transition hover:bg-white/[0.03]"
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full"
                          style={{ backgroundColor: piece.color + "33" }}
                        >
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: piece.color }}
                          />
                        </span>
                        <span className="text-soft">{piece.sound}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 font-semibold text-white">
                      {s.musicalName}
                    </td>
                    <td className="px-3 py-2 text-soft">
                      {fmtLocation(s.country, s.city)}
                    </td>
                    <td className="px-3 py-2 text-soft">
                      {fmtDate(s.firstSeen)}
                    </td>
                    <td className="px-3 py-2 text-soft">
                      {fmtDuration(s.totalSeconds)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-[11px] text-soft">
        Tracking is public and anonymous. No personal data is stored.
      </p>
    </section>
  );
}
