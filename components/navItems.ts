// Shared primary navigation, used by both the desktop Sidebar and the mobile
// nav in the Topbar so the destinations can never drift apart.
import {
  HomeIcon,
  FlaskIcon,
  DocIcon,
  GearIcon,
  InfoIcon,
  TrophyIcon,
  GridIcon,
  StarIcon,
} from "./icons";

export const NAV = [
  {
    href: "/",
    label: "Dashboard",
    icon: HomeIcon,
    desc: "Overview of SyncFit — trending tracks, your stats, and recent reports.",
  },
  {
    href: "/analyzer",
    label: "Research",
    icon: FlaskIcon,
    desc: "Deploy research on a brief to surface the 10 best-fitting tracks — or score one you name.",
  },
  {
    href: "/starred",
    label: "Starred",
    icon: StarIcon,
    desc: "Tracks you saved from research — play them or send one back to score.",
  },
  {
    href: "/report",
    label: "Score reports",
    icon: DocIcon,
    desc: "Saved SyncFit score reports — open, ask questions, archive, or restore.",
  },
  {
    href: "/projects",
    label: "Projects",
    icon: GridIcon,
    desc: "Pitch a track or bundle several into one swipeable, shareable pitch project.",
  },
  {
    href: "/arena",
    label: "Track Arena",
    icon: TrophyIcon,
    desc: "Benchmark up to 3 tracks head-to-head against one brief.",
  },
  {
    href: "/info",
    label: "How it works",
    icon: InfoIcon,
    desc: "How SyncFit works and what each feature and API does.",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: GearIcon,
    desc: "API connection status and how your data is handled.",
  },
] as const;

/** Active-route test shared by every nav surface. */
export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
