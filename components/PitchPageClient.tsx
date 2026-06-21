"use client";

import * as React from "react";
import Link from "next/link";
import { PitchView } from "@/components/PitchView";
import { BrandLogo } from "@/components/BrandLogo";
import type { SavedReport } from "@/lib/types";
import type { PitchTheme } from "@/lib/pitch-theme";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function PitchPageClient({
  report,
  theme,
}: {
  report: SavedReport;
  theme: PitchTheme;
}) {
  const [isDark, setIsDark] = React.useState(true);

  const brand = report.analysis.brand;
  const score = report.analysis.syncFitScore;
  const scoreLabel = report.analysis.scoreLabel;

  const tags = [
    report.brief.projectType,
    report.brief.mood,
    report.brief.language !== "Any" ? report.brief.language : null,
    report.track.genre,
    report.brief.brandSafety === "Strict" ? "Brand Safe" : null,
  ].filter(Boolean) as string[];

  return (
    <div className={isDark ? "space-y-0" : "pitch-light-mode space-y-0"}>
      {isDark ? (
        /* ─── DARK HERO ─── */
        <div
          className="relative -mx-4 -mt-8 mb-8 overflow-hidden sm:-mx-6 sm:-mt-10 lg:-mx-12"
          style={{
            background: `linear-gradient(135deg, #0a0a14 0%, color-mix(in srgb, ${theme.accent} 12%, #0a0a14) 60%, #0a0a14 100%)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(ellipse 80% 60% at 20% 50%, ${theme.accent}, transparent)`,
            }}
          />
          {report.bannerUrl && (
            <div className="relative aspect-[16/6] w-full overflow-hidden sm:aspect-[16/5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={report.bannerUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/85" />
            </div>
          )}

          <div className="relative z-10 mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 lg:px-12">
            <div className="mb-6 flex items-center justify-between">
              <Link
                href="/projects"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-white/50 transition hover:text-white"
              >
                ← Projects
              </Link>
              <button
                type="button"
                onClick={() => setIsDark(false)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/50 transition hover:border-white/30 hover:text-white"
              >
                <SunIcon className="h-3.5 w-3.5" />
                Light theme
              </button>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p
                  className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: theme.accentLight }}
                >
                  {theme.label}
                </p>
                <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
                  {report.track.title}
                </h1>
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-base font-medium text-white/60 sm:text-lg">
                  {report.track.artist}
                  {brand ? (
                    <>
                      <span className="text-white/40">·</span>
                      <BrandLogo brand={brand} className="h-6 w-6" />
                      <span style={{ color: theme.accentLight }}>{brand.name}</span>
                    </>
                  ) : null}
                </p>
              </div>

              <div
                className="flex shrink-0 flex-col items-center justify-center rounded-2xl px-6 py-3 ring-1 ring-inset"
                style={{
                  background: `color-mix(in srgb, ${theme.accent} 15%, transparent)`,
                  borderColor: `color-mix(in srgb, ${theme.accent} 40%, transparent)`,
                }}
              >
                <span
                  className="text-4xl font-black tabular-nums leading-none"
                  style={{ color: theme.accentLight }}
                >
                  {score}
                </span>
                <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/50">
                  {scoreLabel}
                </span>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/50">
              {report.brief.brief.slice(0, 200)}
              {report.brief.brief.length > 200 ? "…" : ""}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset"
                  style={{
                    color: theme.accentLight,
                    background: `color-mix(in srgb, ${theme.accent} 10%, transparent)`,
                    borderColor: `color-mix(in srgb, ${theme.accent} 30%, transparent)`,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ─── LIGHT HERO ─── */
        <div
          className="relative -mx-4 -mt-8 mb-8 overflow-hidden border-b sm:-mx-6 sm:-mt-10 lg:-mx-12"
          style={{
            background: `linear-gradient(160deg, #ffffff 0%, color-mix(in srgb, ${theme.accent} 6%, #f0f4f8) 100%)`,
            borderColor: `color-mix(in srgb, ${theme.accent} 25%, #e2e8f0)`,
          }}
        >
          {report.bannerUrl && (
            <div className="relative aspect-[16/6] w-full overflow-hidden sm:aspect-[16/5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={report.bannerUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-white/90" />
            </div>
          )}

          <div className="relative z-10 mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 lg:px-12">
            <div className="mb-6 flex items-center justify-between">
              <Link
                href="/projects"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-700"
              >
                ← Projects
              </Link>
              <button
                type="button"
                onClick={() => setIsDark(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700"
              >
                <MoonIcon className="h-3.5 w-3.5" />
                Dark theme
              </button>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p
                  className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: theme.accent }}
                >
                  {theme.label}
                </p>
                <h1 className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  {report.track.title}
                </h1>
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-base font-medium text-slate-500 sm:text-lg">
                  {report.track.artist}
                  {brand ? (
                    <>
                      <span className="text-slate-300">·</span>
                      <BrandLogo brand={brand} className="h-6 w-6" />
                      <span className="font-semibold" style={{ color: theme.accent }}>{brand.name}</span>
                    </>
                  ) : null}
                </p>
              </div>

              <div
                className="flex shrink-0 flex-col items-center justify-center rounded-2xl border px-6 py-3"
                style={{
                  background: `color-mix(in srgb, ${theme.accent} 8%, #ffffff)`,
                  borderColor: `color-mix(in srgb, ${theme.accent} 30%, #e2e8f0)`,
                }}
              >
                <span
                  className="text-4xl font-black tabular-nums leading-none"
                  style={{ color: theme.accent }}
                >
                  {score}
                </span>
                <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {scoreLabel}
                </span>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-500">
              {report.brief.brief.slice(0, 200)}
              {report.brief.brief.length > 200 ? "…" : ""}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset"
                  style={{
                    color: theme.accent,
                    background: `color-mix(in srgb, ${theme.accent} 8%, #ffffff)`,
                    borderColor: `color-mix(in srgb, ${theme.accent} 25%, #e2e8f0)`,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <PitchView
        report={report}
        accentColor={theme.accent}
        accentLight={isDark ? theme.accentLight : theme.accent}
      />
    </div>
  );
}
