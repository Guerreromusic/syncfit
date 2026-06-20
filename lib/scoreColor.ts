/**
 * Map a 0–100 SyncFit score to its themed text colour. Shared across every
 * surface (dashboard, reports, arena, projects, starred, research) so the
 * thresholds (85 / 70 / 50) can never drift between views.
 */
export function scoreColor(score?: number): string {
  if (score == null) return "text-soft";
  if (score >= 85) return "text-lime-300";
  if (score >= 70) return "text-lime-400";
  if (score >= 50) return "text-purple-200";
  return "text-red-300";
}
