"use client";

import * as React from "react";
import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { WorldIntelligence, RegionDetail } from "@/lib/types";

// Region label + a real geographic anchor (longitude, latitude). Matches the
// GeoInfluenceCard projection so bubbles land on the right coastlines.
const REGIONS: Record<string, { name: string; lon: number; lat: number }> = {
  north_america: { name: "North America", lon: -100, lat: 45 },
  latin_america: { name: "Latin America", lon: -62, lat: -12 },
  caribbean: { name: "Caribbean", lon: -73, lat: 19 },
  western_europe: { name: "Western Europe", lon: 6, lat: 48 },
  iberia: { name: "Spain & Portugal", lon: -3.5, lat: 40 },
  eastern_europe: { name: "Eastern Europe", lon: 26, lat: 50 },
  mena: { name: "Middle East & N. Africa", lon: 35, lat: 28 },
  subsaharan_africa: { name: "Sub-Saharan Africa", lon: 22, lat: 2 },
  south_asia: { name: "South Asia", lon: 78, lat: 22 },
  east_asia: { name: "East Asia", lon: 116, lat: 36 },
  southeast_asia: { name: "Southeast Asia", lon: 108, lat: 8 },
  oceania: { name: "Oceania", lon: 145, lat: -28 },
};

const MAP_W = 1000;
const MAP_H = 500;
const PROJECTION = geoEquirectangular().fitSize([MAP_W, MAP_H], { type: "Sphere" });
const PATH = geoPath(PROJECTION);

function project(lon: number, lat: number): [number, number] {
  return (PROJECTION([lon, lat]) as [number, number] | null) ?? [0, 0];
}

function regionXY(id: string): { name: string; x: number; y: number } | null {
  const r = REGIONS[id];
  if (!r) return null;
  const [x, y] = project(r.lon, r.lat);
  return { name: r.name, x, y };
}

// Cache country paths module-level — built once, shared across all card instances.
let COUNTRY_PATHS: string[] | null = null;
let COUNTRY_PROMISE: Promise<string[]> | null = null;
function loadCountryPaths(): Promise<string[]> {
  if (COUNTRY_PATHS) return Promise.resolve(COUNTRY_PATHS);
  if (!COUNTRY_PROMISE) {
    COUNTRY_PROMISE = fetch("/world-110m.json")
      .then((r) => r.json())
      .then((topo: any) => {
        const fc = feature(topo, topo.objects.countries) as any;
        COUNTRY_PATHS = (fc.features as unknown[])
          .map((f: any) => PATH(f) || "")
          .filter(Boolean);
        return COUNTRY_PATHS;
      })
      .catch(() => {
        COUNTRY_PATHS = [];
        return COUNTRY_PATHS as string[];
      });
  }
  return COUNTRY_PROMISE;
}

export function WorldInfluenceCard({
  title,
  artist,
  language,
  genre,
  model,
}: {
  title: string;
  artist: string;
  language?: string;
  genre?: string;
  model?: string;
}) {
  const [data, setData] = React.useState<WorldIntelligence | null>(null);
  const [done, setDone] = React.useState(false);
  const [active, setActive] = React.useState<string | null>(null);
  const [pinned, setPinned] = React.useState(false);
  const [countryPaths, setCountryPaths] = React.useState<string[]>(
    COUNTRY_PATHS ?? [],
  );

  React.useEffect(() => {
    loadCountryPaths().then(setCountryPaths).catch(() => {});
  }, []);

  React.useEffect(() => {
    let alive = true;
    setDone(false);
    setData(null);
    fetch("/api/world-intelligence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, artist, language, genre, model }),
    })
      .then((r) => r.json())
      .then((d: WorldIntelligence) => {
        if (alive) {
          setData(d);
          setDone(true);
        }
      })
      .catch(() => alive && setDone(true));
    return () => {
      alive = false;
    };
  }, [title, artist, language, genre, model]);

  if (!done) {
    return (
      <div className="sf-card sf-card-pad">
        <div className="h-4 w-48 animate-pulse rounded bg-ink-700/50" />
        <div className="mt-3 aspect-[2/1] w-full animate-pulse rounded-xl bg-ink-700/30" />
        <div className="mt-4 h-4 w-32 animate-pulse rounded bg-ink-700/50" />
        <div className="mt-2 h-20 w-full animate-pulse rounded-xl bg-ink-700/20" />
      </div>
    );
  }

  if (!data?.available || data.regions.length === 0) return null;

  const regions = [...data.regions].sort((a, b) => b.strength - a.strength);
  const max = Math.max(...regions.map((r) => r.strength), 1);
  // Small circles: min 3px, max 10px radius
  const radius = (s: number) => 3 + (s / max) * 7;
  const strongest = regions[0];
  const activeRegion: RegionDetail | null = active
    ? (regions.find((r) => r.id === active) ?? null)
    : null;

  const hover = (id: string | null) => {
    if (!pinned) setActive(id);
  };
  const clickRegion = (id: string) => {
    if (pinned && active === id) {
      setPinned(false);
      setActive(null);
    } else {
      setPinned(true);
      setActive(id);
    }
  };

  const ageBandMax = Math.max(...(data.ageBands ?? []).map((b) => b.share), 1);

  return (
    <div className="sf-card sf-card-pad">
      {/* Header */}
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <GlobeIcon className="h-5 w-5 text-purple-300" aria-hidden />
        <h3 className="text-sm font-semibold text-white">World Intelligence</h3>
        {language && <span className="sf-pill text-[10px]">{language}</span>}
        <span className="ml-auto text-[11px] text-soft">Tap region to explore</span>
      </div>

      {data.summary && (
        <p className="mb-3 text-sm leading-relaxed text-soft">{data.summary}</p>
      )}

      {/* Interactive map */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-ink-950/60">
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          className="block w-full"
          role="img"
          aria-label="World influence map"
        >
          {/* ocean */}
          <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="#0b1020" fillOpacity="0.5" />
          {/* graticule */}
          {[125, 250, 375].map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2={MAP_W} y2={y} stroke="white" strokeOpacity="0.04" strokeWidth="1" />
          ))}
          {[200, 400, 600, 800].map((x) => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2={MAP_H} stroke="white" strokeOpacity="0.04" strokeWidth="1" />
          ))}

          {/* country outlines */}
          {countryPaths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="#ffffff"
              fillOpacity="0.07"
              stroke="#ffffff"
              strokeOpacity="0.14"
              strokeWidth="0.5"
              strokeLinejoin="round"
            />
          ))}

          {/* connection lines from strongest region to others */}
          {regions.slice(1).map((r) => {
            const a = regionXY(strongest.id);
            const b = regionXY(r.id);
            if (!a || !b) return null;
            const lit = active === r.id || active === strongest.id;
            return (
              <line
                key={`c${r.id}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#a3e635"
                strokeOpacity={lit ? 0.5 : 0.12}
                strokeWidth={lit ? 1.6 : 1}
                strokeDasharray="4 5"
              />
            );
          })}

          {/* influence circles — weakest first so strongest render on top */}
          {[...regions]
            .sort((a, b) => a.strength - b.strength)
            .map((r) => {
              const pos = regionXY(r.id);
              if (!pos) return null;
              const isActive = active === r.id;
              const dim = active !== null && !isActive;
              const rad = radius(r.strength) * (isActive ? 1.4 : 1);
              const op = (0.3 + (r.strength / max) * 0.5) * (dim ? 0.45 : 1);
              return (
                <g
                  key={r.id}
                  className="cursor-pointer"
                  onMouseEnter={() => hover(r.id)}
                  onMouseLeave={() => hover(null)}
                  onClick={() => clickRegion(r.id)}
                  style={{ transition: "opacity .2s" }}
                >
                  {/* halo */}
                  <circle cx={pos.x} cy={pos.y} r={rad * 2.5} fill="#a3e635" fillOpacity={op * 0.16}>
                    <animate
                      attributeName="fill-opacity"
                      values={`${op * 0.16};${op * 0.05};${op * 0.16}`}
                      dur="3.4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* core */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={rad}
                    fill="#a3e635"
                    fillOpacity={op}
                    stroke={isActive ? "#ecfccb" : "#bef264"}
                    strokeOpacity={isActive ? 1 : 0.7}
                    strokeWidth={isActive ? 2 : 1}
                    style={{ transition: "r .2s, stroke-width .2s" }}
                  />
                  {/* label: strongest + active */}
                  {(r.id === strongest.id || isActive) && (
                    <text
                      x={pos.x}
                      y={pos.y - rad - 5}
                      textAnchor="middle"
                      fill={isActive ? "#ffffff" : "#ecfccb"}
                      fontSize={14}
                      fontWeight={isActive ? 700 : 500}
                      style={{ paintOrder: "stroke", stroke: "#0b1020", strokeWidth: 3, strokeLinejoin: "round" }}
                    >
                      {pos.name}
                    </text>
                  )}
                </g>
              );
            })}
        </svg>

        {/* Active region panel pinned to map bottom */}
        <div className="pointer-events-none absolute bottom-2 left-2 right-2">
          {activeRegion ? (
            <div className="rounded-xl border border-lime-400/30 bg-ink-950/90 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-white">
                  {REGIONS[activeRegion.id]?.name ?? activeRegion.id}
                </p>
                <span className="shrink-0 rounded-full bg-lime-400/15 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-lime-300">
                  {activeRegion.strength}% resonance
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-ink-700/70">
                <div
                  className="h-full rounded-full bg-lime-400"
                  style={{ width: `${activeRegion.strength}%` }}
                />
              </div>
              {activeRegion.reason && (
                <p className="mt-1.5 text-[11px] leading-snug text-soft">
                  {activeRegion.reason}
                </p>
              )}
              {/* 3-column mini-grid */}
              <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1">
                {activeRegion.religion && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-lime-300/70">Religion</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-soft">{activeRegion.religion}</p>
                  </div>
                )}
                {activeRegion.ageSkew && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-lime-300/70">Age</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-soft">{activeRegion.ageSkew}</p>
                  </div>
                )}
                {activeRegion.marketNotes && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-lime-300/70">Market</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-soft">{activeRegion.marketNotes}</p>
                  </div>
                )}
              </div>
              {/* Brands & competitors */}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                {activeRegion.topBrands.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] font-semibold text-soft">Brands:</span>
                    {activeRegion.topBrands.map((b) => (
                      <span key={b} className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] text-soft">
                        {b}
                      </span>
                    ))}
                  </div>
                )}
                {activeRegion.competitors.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] font-semibold text-soft">Sync competition:</span>
                    {activeRegion.competitors.map((c) => (
                      <span key={c} className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] text-soft">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-ink-950/70 px-3 py-1.5">
              <p className="text-[11px] text-soft">
                Strongest:{" "}
                <span className="font-semibold text-lime-300">
                  {REGIONS[strongest.id]?.name}
                </span>{" "}
                · {strongest.strength}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Global Audience section */}
      {(data.ageBands.length > 0 || data.appeal.length > 0 || data.faithResonance) && (
        <>
          <div className="my-4 border-t border-white/[0.06]" />
          <div>
            <p className="sf-eyebrow mb-3">Global Audience</p>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {data.ageBands.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-soft/70">
                    Age distribution
                  </p>
                  <ul className="space-y-1.5">
                    {data.ageBands.map((b) => (
                      <li key={b.label} className="flex items-center gap-3">
                        <span className="w-12 shrink-0 text-xs font-medium text-soft">
                          {b.label}
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-700/70">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-lime-400"
                            style={{ width: `${(b.share / ageBandMax) * 100}%` }}
                          />
                        </div>
                        <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums text-white">
                          {b.share}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-4">
                {data.appeal.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-soft/70">
                      Appeals to
                    </p>
                    <ul className="space-y-1.5">
                      {data.appeal.map((a, i) => (
                        <li key={i} className="flex gap-2 text-xs leading-relaxed text-soft">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-lime-400" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.faithResonance && (
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-soft/70">
                      Cultural / faith resonance
                    </p>
                    <p className="text-xs leading-relaxed text-soft">{data.faithResonance}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Territory Breakdown section */}
      <div className="my-4 border-t border-white/[0.06]" />
      <div>
        <p className="sf-eyebrow mb-3">Territory Breakdown</p>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {regions.map((r) => {
            const isActive = active === r.id;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onMouseEnter={() => hover(r.id)}
                  onMouseLeave={() => hover(null)}
                  onClick={() => clickRegion(r.id)}
                  className={
                    "w-full rounded-xl border px-3 py-2.5 text-left transition " +
                    (isActive
                      ? "border-lime-400/40 bg-lime-400/10"
                      : "border-transparent hover:border-white/10 hover:bg-white/[0.03]")
                  }
                >
                  {/* Region name + strength */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-white">
                      {REGIONS[r.id]?.name ?? r.id}
                    </p>
                    <span className="shrink-0 text-[11px] font-semibold tabular-nums text-lime-300">
                      {r.strength}%
                    </span>
                  </div>
                  {/* Strength bar */}
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-ink-700/70">
                    <div
                      className="h-full rounded-full bg-lime-400 transition-all"
                      style={{ width: `${r.strength}%` }}
                    />
                  </div>
                  {/* Religion */}
                  {r.religion && (
                    <p className="mt-1.5 text-[10px] leading-snug text-soft">
                      <span className="font-medium text-soft/80">Religion: </span>
                      {r.religion}
                    </p>
                  )}
                  {/* Age */}
                  {r.ageSkew && (
                    <p className="mt-0.5 text-[10px] leading-snug text-soft">
                      <span className="font-medium text-soft/80">Age: </span>
                      {r.ageSkew}
                    </p>
                  )}
                  {/* Top brands */}
                  {r.topBrands.length > 0 && (
                    <p className="mt-1 text-[10px] leading-snug text-soft">
                      <span className="font-medium text-soft/80">Brands: </span>
                      {r.topBrands.join(", ")}
                    </p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-3 text-[11px] text-soft">
        Territory intelligence estimated by AI, anchored on Musixmatch language &amp; genre data.
      </p>
    </div>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}
