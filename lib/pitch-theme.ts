import type { SavedReport } from "./types";

export type PitchTheme = {
  accent: string;       // CSS hex/hsl
  accentLight: string;  // lighter tint for text
  gradFrom: string;     // Tailwind gradient class fragment (from-*)
  gradVia?: string;
  label: string;        // human label e.g. "Luxury Campaign"
};

const MOOD_THEMES: Record<string, PitchTheme> = {
  Energetic:   { accent: "#f97316", accentLight: "#fed7aa", gradFrom: "from-orange-950/40", label: "High-Energy Campaign" },
  Emotional:   { accent: "#a855f7", accentLight: "#e9d5ff", gradFrom: "from-purple-950/60", label: "Emotional Campaign" },
  Romantic:    { accent: "#ec4899", accentLight: "#fce7f3", gradFrom: "from-pink-950/40",   label: "Romantic Campaign" },
  Dark:        { accent: "#6366f1", accentLight: "#c7d2fe", gradFrom: "from-indigo-950/60", label: "Dark & Cinematic" },
  Celebration: { accent: "#84cc16", accentLight: "#d9f99d", gradFrom: "from-lime-950/40",   label: "Celebration Campaign" },
  Luxury:      { accent: "#d97706", accentLight: "#fde68a", gradFrom: "from-amber-950/50",  label: "Luxury Campaign" },
  Tension:     { accent: "#ef4444", accentLight: "#fecaca", gradFrom: "from-red-950/50",    label: "High-Tension Campaign" },
};

const PROJECT_TYPE_SUFFIX: Record<string, string> = {
  Ad:      "Advertisement",
  Film:    "Feature Film",
  TV:      "Television",
  Trailer: "Movie Trailer",
  Game:    "Video Game",
  Social:  "Social Media",
};

export function getPitchTheme(report: SavedReport): PitchTheme {
  const base = MOOD_THEMES[report.brief.mood] ?? MOOD_THEMES["Emotional"];
  const typeSuffix = PROJECT_TYPE_SUFFIX[report.brief.projectType] ?? report.brief.projectType;
  return { ...base, label: `${base.label} · ${typeSuffix}` };
}
