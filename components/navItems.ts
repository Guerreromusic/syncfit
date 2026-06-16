// Shared primary navigation, used by both the desktop Sidebar and the mobile
// nav in the Topbar so the destinations can never drift apart.
import { HomeIcon, SlidersIcon, DocIcon, GearIcon, InfoIcon } from "./icons";

export const NAV = [
  { href: "/", label: "Dashboard", icon: HomeIcon },
  { href: "/analyzer", label: "SyncFit Analyzer", icon: SlidersIcon },
  { href: "/report", label: "Reports", icon: DocIcon },
  { href: "/info", label: "How it works", icon: InfoIcon },
  { href: "/settings", label: "Settings", icon: GearIcon },
] as const;

/** Active-route test shared by every nav surface. */
export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
