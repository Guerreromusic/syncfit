"use client";

import * as React from "react";
import type {
  Brief,
  ProjectType,
  Region,
  Mood,
  Language,
  BrandSafetyLevel,
  LicenseTier,
} from "@/lib/types";
import { StepHeader } from "./StepHeader";

const PROJECT_TYPES: ProjectType[] = ["Ad", "Film", "TV", "Trailer", "Game", "Social"];
const REGIONS: Region[] = ["Colombia", "Mexico", "Brazil", "Caribbean", "LATAM", "Global"];
const MOODS: Mood[] = [
  "Energetic",
  "Emotional",
  "Romantic",
  "Dark",
  "Celebration",
  "Luxury",
  "Tension",
];
const LANGUAGES: Language[] = ["Spanish", "Portuguese", "English", "Instrumental", "Any"];
const BRAND_SAFETY: BrandSafetyLevel[] = ["Low", "Medium", "Strict"];
const LICENSE_TIERS: LicenseTier[] = ["Nano", "Micro", "Bespoke"];

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="block">
      <span className="sf-label">{label}</span>
      <select
        className="sf-input appearance-none"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-ink-900 text-white">
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

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
      <StepHeader step={1} title="Creative brief" subtitle="What's the placement for?" />

      <label className="block">
        <span className="sf-label">Describe the brief</span>
        <textarea
          className="sf-input min-h-[96px] resize-y"
          placeholder="e.g. 30-second spot for a Colombian football brand — energetic, celebratory, crowd-in-stadium feel, family-friendly."
          value={brief.brief}
          onChange={(e) => onChange({ brief: e.target.value })}
        />
      </label>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Select
          label="Project type"
          value={brief.projectType}
          options={PROJECT_TYPES}
          onChange={(v) => onChange({ projectType: v })}
        />
        <Select
          label="Region"
          value={brief.region}
          options={REGIONS}
          onChange={(v) => onChange({ region: v })}
        />
        <Select
          label="Mood"
          value={brief.mood}
          options={MOODS}
          onChange={(v) => onChange({ mood: v })}
        />
        <Select
          label="Language"
          value={brief.language}
          options={LANGUAGES}
          onChange={(v) => onChange({ language: v })}
        />
        <Select
          label="Brand safety"
          value={brief.brandSafety}
          options={BRAND_SAFETY}
          onChange={(v) => onChange({ brandSafety: v })}
        />
        <Select
          label="License tier"
          value={brief.licenseTier}
          options={LICENSE_TIERS}
          onChange={(v) => onChange({ licenseTier: v })}
        />
      </div>
    </div>
  );
}
