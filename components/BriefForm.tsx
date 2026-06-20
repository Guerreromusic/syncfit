"use client";

import type { Brief } from "@/lib/types";
import { StepHeader } from "./StepHeader";
import { MicDictation } from "./MicDictation";

// NOTE: The structured fields (project type, region, mood, language, brand
// safety, license tier) are intentionally NOT exposed in the UI — they're kept
// internally on the Brief (with sensible defaults) and still drive the analysis.
// Only the free-text brief is collected from the user.
export function BriefForm({
  brief,
  onChange,
  bare = false,
}: {
  brief: Brief;
  onChange: (patch: Partial<Brief>) => void;
  /** Render without the card shell (for use inside a single glass card). */
  bare?: boolean;
}) {
  return (
    <div className={bare ? "" : "sf-card sf-card-pad"}>
      <StepHeader title="Creative brief" subtitle="What's the placement for?" />

      <div className="block">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="sf-label mb-0">Brief or Spotify link</span>
          <MicDictation
            value={brief.brief}
            onChange={(text) => onChange({ brief: text })}
          />
        </div>
        <textarea
          className="sf-input min-h-[96px] resize-y"
          placeholder="Describe the placement (e.g. 30-second spot for a Colombian football brand — energetic, celebratory, stadium feel, family-friendly), paste a Spotify track link to research that exact song, or tap “Speak” to dictate."
          value={brief.brief}
          onChange={(e) => onChange({ brief: e.target.value })}
        />
      </div>
    </div>
  );
}
