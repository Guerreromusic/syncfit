"use client";

import * as React from "react";

/**
 * Small brand logo for a brand named in the brief. Tries DuckDuckGo's icon
 * service, falls back to a Google favicon, and renders nothing if neither
 * resolves — all keyless. CSP already allows external https images.
 */
export function BrandLogo({
  brand,
  className = "h-7 w-7",
  showName = false,
}: {
  brand?: { name: string; domain: string } | null;
  className?: string;
  showName?: boolean;
}) {
  const domain = brand?.domain?.trim();
  const [step, setStep] = React.useState(0);

  if (!brand || !domain || step > 1) {
    // No logo available — optionally still show the brand name as a chip.
    if (brand && showName) {
      return (
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-soft">
          {brand.name}
        </span>
      );
    }
    return null;
  }

  const src =
    step === 0
      ? `https://icons.duckduckgo.com/ip3/${domain}.ico`
      : `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${brand.name} logo`}
      title={brand.name}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setStep((s) => s + 1)}
      className={`shrink-0 rounded-full bg-white/95 object-contain p-0.5 ring-1 ring-inset ring-white/10 ${className}`}
    />
  );

  if (!showName) return img;
  return (
    <span className="inline-flex items-center gap-1.5">
      {img}
      <span className="text-[11px] font-medium text-soft">{brand.name}</span>
    </span>
  );
}
