// Shared primary navigation, used by both the desktop Sidebar and the mobile
// nav in the Topbar so the destinations can never drift apart.
import {
  HomeIcon,
  SlidersIcon,
  DocIcon,
  GearIcon,
  InfoIcon,
  TrophyIcon,
} from "./icons";

export const NAV = [
  {
    href: "/",
    label: "Dashboard",
    icon: HomeIcon,
    desc: "Overview of SyncFit plus a demo catalog you can try instantly.",
  },
  {
    href: "/analyzer",
    label: "Discover",
    icon: SlidersIcon,
    desc: "Score a track against your brief — or find the 10 best-fitting tracks.",
  },
  {
    href: "/arena",
    label: "Track Arena",
    icon: TrophyIcon,
    desc: "Benchmark up to 3 tracks head-to-head against one brief.",
  },
  {
    href: "/report",
    label: "Reports",
    icon: DocIcon,
    desc: "Saved analyses as shareable pitch cards — archive and restore.",
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
