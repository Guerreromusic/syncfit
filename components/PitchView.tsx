import { PitchCard } from "./PitchCard";
import { ShareButton } from "./ShareButton";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { CreditsCard } from "./CreditsCard";
import { LyricTranslationCard } from "./LyricTranslationCard";
import { BrandDNACard } from "./BrandDNACard";
import { GeoInfluenceCard } from "./GeoInfluenceCard";
import { DemographicsCard } from "./DemographicsCard";
import { MegaphoneIcon } from "./icons";
import type { SavedReport } from "@/lib/types";

export function PitchView({
  report,
  accentColor,
  accentLight,
  isPublic = false,
}: {
  report: SavedReport;
  /** Hex/CSS color from the pitch theme — used for accent borders & headings. */
  accentColor?: string;
  accentLight?: string;
  /** On public /share pages: hide the ShareButton and private creative brief. */
  isPublic?: boolean;
}) {
  const accentStyle = accentColor
    ? {
        borderColor: `color-mix(in srgb, ${accentColor} 35%, transparent)`,
        background: `color-mix(in srgb, ${accentColor} 6%, transparent)`,
      }
    : {};
  const headingStyle = accentLight ? { color: accentLight } : {};

  return (
    <div className="space-y-5">
      {/* Share + actions header */}
      <div
        className="sf-card sf-card-pad flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        style={accentStyle}
      >
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset"
            style={
              accentColor
                ? {
                    background: `color-mix(in srgb, ${accentColor} 20%, transparent)`,
                    borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)`,
                  }
                : { background: "rgb(147 51 234 / 0.2)", borderColor: "rgb(168 85 247 / 0.3)" }
            }
          >
            <MegaphoneIcon
              className="h-5 w-5"
              style={accentLight ? { color: accentLight } : { color: "#a3e635" }}
              aria-hidden
            />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-white">
              Pitch &ldquo;{report.track.title}&rdquo;
            </h2>
            <p className="text-xs text-soft">
              Full pitch — score, breakdown, credits, audience &amp; map — plus a public link.
            </p>
          </div>
        </div>
        {!isPublic && (
          <ShareButton
            shareEndpoint={`/api/reports/${report.id}/share`}
            sharePrefix="/share/"
            initialToken={report.shareToken}
            label="Pitch"
          />
        )}
      </div>

      {/* Pitch summary card */}
      <PitchCard report={report} public={isPublic} />

      {/* Full 7-factor score breakdown */}
      <div className="sf-card sf-card-pad" style={accentStyle}>
        <h3 className="mb-4 text-sm font-semibold text-white" style={headingStyle}>
          Score breakdown
        </h3>
        <ScoreBreakdown breakdown={report.analysis.breakdown} />
      </div>

      {/* MusicBrainz credits */}
      <CreditsCard credits={report.track.credits} />

      {/* Lyric context + brand DNA */}
      <LyricTranslationCard
        trackId={report.track.trackId}
        brief={report.brief.brief}
      />
      <BrandDNACard
        trackId={report.track.trackId}
        title={report.track.title}
        artist={report.track.artist}
      />

      {/* Worldwide influence map + audience demographics */}
      <GeoInfluenceCard
        title={report.track.title}
        artist={report.track.artist}
        language={report.track.language}
        genre={report.track.genre}
      />
      <DemographicsCard
        title={report.track.title}
        artist={report.track.artist}
        language={report.track.language}
        genre={report.track.genre}
      />
    </div>
  );
}
