// Shared client-storage keys. Centralised so a value can never drift between the
// producer (Deploy / Trending) and consumers (Research console, Starred).

/** sessionStorage key the "Deploy → Research" hand-off uses to seed the analyzer. */
export const RESEARCH_SEED_KEY = "syncfit:research:seed";

/** sessionStorage key holding the track LOCKED for scoring (a deployed track).
 *  Persisted so the selection survives a remount and is scored against the next
 *  brief — even under React Strict Mode's dev double-mount (which would otherwise
 *  consume the one-shot seed before the track sticks). */
export const SELECTED_TRACK_KEY = "syncfit:research:selected";
