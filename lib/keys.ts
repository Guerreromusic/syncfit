// Shared client-storage keys. Centralised so a value can never drift between the
// producer (Deploy / Trending) and consumers (Research console, Starred).

/** sessionStorage key the "Deploy → Research" hand-off uses to seed the analyzer. */
export const RESEARCH_SEED_KEY = "syncfit:research:seed";
