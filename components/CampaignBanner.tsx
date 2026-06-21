import * as React from "react";

/**
 * Campaign banner hero for a pitch. Shows the Higgsfield-generated banner image
 * when one is attached (report.bannerUrl); otherwise a branded gradient hero so
 * every pitch still leads with a key visual. The track/brief is overlaid.
 */
export function CampaignBanner({
  bannerUrl,
  title,
  subtitle,
}: {
  bannerUrl?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="relative aspect-[16/6] overflow-hidden rounded-2xl border border-white/10 sm:aspect-[16/5]">
      {bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bannerUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-700/50 via-ink-900 to-lime-500/20" />
      )}
      {/* legibility scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
        <p className="sf-eyebrow text-lime-300">Campaign</p>
        <h2 className="mt-1 line-clamp-2 text-xl font-bold text-white sm:text-2xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 line-clamp-2 max-w-xl text-xs text-white/75 sm:text-sm">
            {subtitle}
          </p>
        )}
      </div>
      <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white/75 backdrop-blur-sm">
        {bannerUrl ? "Banner · Higgsfield" : "Banner via Higgsfield"}
      </span>
    </div>
  );
}
