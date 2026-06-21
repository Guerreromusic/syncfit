/**
 * Module-level research-state atom — no React Provider needed.
 * ResearchChat calls setResearching() and any component (Sidebar, Topbar)
 * can subscribe via useIsResearching() without being in the same subtree.
 */
import * as React from "react";

type Listener = (v: boolean) => void;
const listeners = new Set<Listener>();
let _isResearching = false;

export function setResearching(v: boolean) {
  if (_isResearching === v) return;
  _isResearching = v;
  listeners.forEach((l) => l(v));
}

export function useIsResearching(): boolean {
  const [v, setV] = React.useState(_isResearching);
  React.useEffect(() => {
    setV(_isResearching); // sync on mount in case it fired before mount
    const l = (next: boolean) => setV(next);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return v;
}
