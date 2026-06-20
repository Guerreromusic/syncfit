import * as React from "react";
import type { TrackCredits } from "@/lib/types";

function fmtDate(d?: string): string | null {
  if (!d) return null;
  const m = d.match(/^(\d{4})(?:-(\d{2}))?/);
  if (!m) return d;
  const year = m[1];
  if (!m[2]) return year;
  const month = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ][Number(m[2]) - 1];
  return month ? `${month} ${year}` : year;
}

function Row({
  label,
  icon,
  values,
}: {
  label: string;
  icon: React.ReactNode;
  values: string[];
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-purple-200 ring-1 ring-inset ring-white/10">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-soft">{label}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {values.map((v, i) => (
            <span
              key={v + i}
              className="rounded-md bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-white ring-1 ring-inset ring-white/10"
            >
              {v}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Credits & rights for a researched track — writers, producers, label, release.
 * Sourced from MusicBrainz (keyless); Spotify's API doesn't expose these. Renders
 * nothing when no credits were found.
 */
export function CreditsCard({
  credits,
  bare = false,
}: {
  credits?: TrackCredits | null;
  bare?: boolean;
}) {
  const released = fmtDate(credits?.releaseDate);
  const hasAny =
    credits &&
    ((credits.writers && credits.writers.length > 0) ||
      (credits.producers && credits.producers.length > 0) ||
      Boolean(credits.label) ||
      Boolean(released));
  if (!hasAny) return null;

  return (
    <div className={bare ? "" : "sf-card sf-card-pad"}>
      <p className="sf-eyebrow mb-3">Credits &amp; rights</p>
      <div className="space-y-3">
        {credits!.writers && credits!.writers.length > 0 && (
          <Row label="Writers" icon={<PenIcon />} values={credits!.writers} />
        )}
        {credits!.producers && credits!.producers.length > 0 && (
          <Row label="Producers" icon={<SlidersIcon />} values={credits!.producers} />
        )}
        {credits!.label && <Row label="Label" icon={<TagIcon />} values={[credits!.label]} />}
        {released && <Row label="Released" icon={<CalendarIcon />} values={[released]} />}
      </div>
      <p className="mt-3 text-[10px] text-soft">via MusicBrainz</p>
    </div>
  );
}

function PenIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}
function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
    </svg>
  );
}
function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.6 13.4 13 21l-9-9V3h9zM7.5 7.5h.01" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
