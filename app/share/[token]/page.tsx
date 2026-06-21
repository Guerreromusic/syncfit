// Public, unauthenticated full pitch page.
// The Sidebar/Topbar return null on /share routes so this renders chrome-free.
// COMPLIANCE: shows only already-safe SavedReport fields — scores, summaries,
// basic metadata. Creative brief is hidden (isPublic=true). Never shows lyrics.
import { notFound } from "next/navigation";
import { getReportByToken } from "@/lib/storage";
import { PitchView } from "@/components/PitchView";
import { LogoImage } from "@/components/Logo";
import { getPitchTheme } from "@/lib/pitch-theme";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shared pitch — SyncFit by Synclat",
  robots: { index: false, follow: false },
};

export default async function SharePage({
  params,
}: {
  params: { token: string };
}) {
  const report = await getReportByToken(params.token);
  if (!report) notFound();

  const theme = getPitchTheme(report);
  const { track, analysis } = report;
  const score = analysis.syncFitScore;

  return (
    <div>
      {/* Full-bleed hero — same negative-margin trick as the internal pitch page.
          Escapes the layout's px-4/py-8 padding so the image/gradient bleeds edge-to-edge. */}
      <div
        className="relative -mx-4 -mt-8 mb-8 overflow-hidden sm:-mx-6 sm:-mt-10 lg:-mx-12"
        style={{
          background: `linear-gradient(135deg, #0a0a14 0%, color-mix(in srgb, ${theme.accent} 12%, #0a0a14) 60%, #0a0a14 100%)`,
        }}
      >
        {/* Ambient glow */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 20% 50%, ${theme.accent}, transparent)`,
          }}
        />

        {/* Higgsfield banner as full-bleed background when available */}
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

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 lg:px-12">
          {/* Logo header (replaces the app's sidebar/topbar which are hidden) */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LogoImage className="h-7" />
              <span className="text-[10px] leading-tight text-soft">by Synclat</span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] font-medium text-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
              Shared pitch
            </span>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ color: theme.accentLight }}
              >
                {theme.label}
              </p>
              <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                {track.title}
              </h1>
              <p className="mt-1.5 text-base font-medium text-white/60">
                {track.artist}
                {analysis.brand ? (
                  <>
                    <span className="mx-2 text-white/30">·</span>
                    <span style={{ color: theme.accentLight }}>{analysis.brand.name}</span>
                  </>
                ) : null}
              </p>
            </div>

            {/* Score badge */}
            <div
              className="flex shrink-0 flex-col items-center justify-center rounded-2xl border px-6 py-3"
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
                {analysis.scoreLabel}
              </span>
            </div>
          </div>

          {/* Placement type / mood tags */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {[
              report.brief.projectType,
              report.brief.mood,
              report.brief.language !== "Any" ? report.brief.language : null,
              track.genre,
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

      {/* Full pitch content — everything the internal pitch page shows, minus the brief */}
      <div className="mx-auto max-w-4xl space-y-6">
        <PitchView
          report={report}
          accentColor={theme.accent}
          accentLight={theme.accentLight}
          isPublic
        />

        <p className="pb-6 text-center text-xs text-soft">
          Shared via SyncFit by Synclat · scores &amp; summaries only — no full
          lyrics. Powered by Musixmatch.
        </p>
      </div>
    </div>
  );
}
