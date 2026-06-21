import Link from "next/link";
import { notFound } from "next/navigation";
import { getReport } from "@/lib/storage";
import { getPitchTheme } from "@/lib/pitch-theme";
import { PitchView } from "@/components/PitchView";

export const dynamic = "force-dynamic";

export default async function PitchDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const report = await getReport(params.id);
  if (!report) notFound();

  const theme = getPitchTheme(report);
  const brand = report.analysis.brand;
  const score = report.analysis.syncFitScore;
  const scoreLabel = report.analysis.scoreLabel;

  return (
    <div className="space-y-0">
      {/* Pitch hero — full-bleed themed header */}
      <div
        className="relative -mx-4 -mt-8 mb-8 overflow-hidden sm:-mx-6 sm:-mt-10 lg:-mx-12"
        style={{ background: `linear-gradient(135deg, #0a0a14 0%, color-mix(in srgb, ${theme.accent} 12%, #0a0a14) 60%, #0a0a14 100%)` }}
      >
        {/* Ambient glow */}
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: `radial-gradient(ellipse 80% 60% at 20% 50%, ${theme.accent}, transparent)` }}
        />
        {/* Higgsfield banner as full-bleed hero when available */}
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

        {/* Hero text content */}
        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 lg:px-12">
          <Link
            href="/projects"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-white/50 transition hover:text-white"
          >
            ← Projects
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {/* Theme label */}
              <p
                className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ color: theme.accentLight }}
              >
                {theme.label}
              </p>

              {/* Track title */}
              <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
                {report.track.title}
              </h1>
              <p className="mt-1.5 text-base font-medium text-white/60 sm:text-lg">
                {report.track.artist}
                {brand ? (
                  <span className="ml-2 text-white/40">·</span>
                ) : null}
                {brand ? (
                  <span className="ml-2" style={{ color: theme.accentLight }}>
                    {brand.name}
                  </span>
                ) : null}
              </p>
            </div>

            {/* Score badge */}
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

          {/* Brief snippet */}
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/50">
            {report.brief.brief.slice(0, 200)}
            {report.brief.brief.length > 200 ? "…" : ""}
          </p>

          {/* Tag row */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {[
              report.brief.projectType,
              report.brief.mood,
              report.brief.language !== "Any" ? report.brief.language : null,
              report.track.genre,
              report.brief.brandSafety === "Strict" ? "Brand Safe" : null,
            ]
              .filter(Boolean)
              .map((tag) => (
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

      {/* Full pitch content — all sections from the report */}
      <PitchView report={report} accentColor={theme.accent} accentLight={theme.accentLight} />
    </div>
  );
}
