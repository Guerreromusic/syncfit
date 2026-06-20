// Lightweight inline SVG icons — no external icon dependency.
import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export const WaveIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M2 12h2M6 8v8M10 4v16M14 7v10M18 9v6M22 12h0" />
  </svg>
);

export const BoltIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
  </svg>
);

export const ShieldIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" />
    <path d="m9.5 12 1.8 1.8 3.2-3.6" />
  </svg>
);

export const DocIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M7 3h7l5 5v13H7z" />
    <path d="M14 3v5h5M10 13h6M10 17h6" />
  </svg>
);

export const HomeIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 11 12 4l8 7" />
    <path d="M6 10v9h12v-9" />
  </svg>
);

export const SlidersIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </svg>
);

export const SparkIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="m6 6 2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </svg>
);

export const SearchIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const ArrowRightIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const CheckIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m5 12 4 4 10-11" />
  </svg>
);

export const ChartIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);

export const ClockIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const TrophyIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M8 21h8M12 17v4" />
    <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
  </svg>
);

export const InfoIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </svg>
);

// Classic settings gear (notched cog + hub).
export const GearIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M10.3 4.3c.43-1.76 2.93-1.76 3.35 0a1.72 1.72 0 0 0 2.58 1.07c1.54-.94 3.3.83 2.37 2.37a1.72 1.72 0 0 0 1.06 2.57c1.76.43 1.76 2.93 0 3.35a1.72 1.72 0 0 0-1.06 2.58c.94 1.54-.83 3.3-2.37 2.37a1.72 1.72 0 0 0-2.58 1.06c-.42 1.76-2.92 1.76-3.35 0a1.72 1.72 0 0 0-2.57-1.06c-1.54.93-3.31-.83-2.37-2.37a1.72 1.72 0 0 0-1.07-2.58c-1.76-.42-1.76-2.92 0-3.35a1.72 1.72 0 0 0 1.07-2.57c-.94-1.54.83-3.31 2.37-2.37 1 .6 2.3.07 2.57-1.07z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// Lab flask (Erlenmeyer) — the Research section.
export const FlaskIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M14 2v6a2 2 0 0 0 .25.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.76-2.96l5.51-10.08A2 2 0 0 0 10 8V2" />
    <path d="M8.5 2h7" />
    <path d="M7 16h10" />
  </svg>
);

// Rocket — the "Deploy Research" action.
export const RocketIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

// Radar / crosshair target — the Research section.
export const RadarIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
  </svg>
);

// Megaphone — the Pitch section + Pitch action.
export const MegaphoneIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m3 11 15-5v12L3 13z" />
    <path d="M11.5 16.5a3 3 0 0 1-5.6-1.3" />
    <path d="M18 8a3 3 0 0 1 0 6" />
  </svg>
);

// Chat bot — speech bubble with three dots (the section assistant launcher).
export const ChatBotIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
    <path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01" />
  </svg>
);

// Close — X.
export const CloseIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

// Refresh — circular arrows (regenerate / show more).
export const RefreshIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

// Star — favourite / starred. Pass `filled` for the solid state.
export const StarIcon = ({ filled, ...props }: IconProps & { filled?: boolean }) => (
  <svg {...base(props)} fill={filled ? "currentColor" : "none"}>
    <path d="M12 3.2l2.7 5.5 6 .9-4.35 4.24 1.03 6L12 17.02 6.62 19.84l1.03-6L3.3 9.6l6-.9z" />
  </svg>
);

// Archive box — archive a report/project.
export const ArchiveIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
    <path d="M10 12h4" />
  </svg>
);

// Restore — curved arrow back.
export const RestoreIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M3 7v5h5" />
    <path d="M3.5 12a8 8 0 1 1 2 5.7" />
  </svg>
);

// Paperclip — attach a file.
export const PaperclipIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M21.44 11.05 12.25 20.24a5 5 0 0 1-7.07-7.07l9.19-9.19a3.34 3.34 0 0 1 4.72 4.72l-9.2 9.19a1.67 1.67 0 0 1-2.36-2.36l8.49-8.48" />
  </svg>
);

// Pencil — inline edit / rename.
export const PencilIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
);

// Share — three connected nodes, for the public pitch link.
export const ShareIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="18" cy="5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="19" r="2.5" />
    <path d="m8.2 13.3 7.6 4.4M15.8 6.3 8.2 10.7" />
  </svg>
);

// Import — arrow into a tray.
export const ImportIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 3v11" />
    <path d="m7.5 10 4.5 4 4.5-4" />
    <path d="M5 20h14" />
  </svg>
);

// Plus.
export const PlusIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// Board / grid view.
export const GridIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </svg>
);

// List view.
export const ListIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
  </svg>
);

// List + music note — the Playlists section.
export const ListMusicIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M3 6h11M3 12h8M3 18h8" />
    <circle cx="17" cy="16" r="3" />
    <path d="M20 16V7l-3 1" />
  </svg>
);

// Film strip — cinematic playlists.
export const FilmIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
  </svg>
);
