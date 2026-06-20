// =============================================================================
// SyncFit by Synclat — selectable OpenRouter models
// =============================================================================
// Shared by the UI (dropdown) and the server (validation). Pure data — no
// secrets — so it is safe to import on the client. The OpenRouter API key stays
// server-side; the model id is just a routing string sent with the request.
//
// To offer more models, add valid OpenRouter slugs here (see openrouter.ai/models).
// =============================================================================

export type OpenRouterModelOption = {
  id: string; // OpenRouter model slug
  label: string;
  note?: string;
};

// Cheap models only — no pricey tiers. GPT-5 mini is the default (good quality,
// low cost); GPT-5 nano is the cheapest/fastest. Prices in/out per 1M tokens.
export const OPENROUTER_MODELS: OpenRouterModelOption[] = [
  {
    id: "openai/gpt-5-mini",
    label: "GPT-5 mini",
    note: "Balanced · cheap · $0.25/$2",
  },
  {
    id: "openai/gpt-5-nano",
    label: "GPT-5 nano",
    note: "Fastest · cheapest · $0.05/$0.40",
  },
];

export const DEFAULT_OPENROUTER_MODEL = "openai/gpt-5-mini";

/** Server-side guard: only let through a model we explicitly offer. */
export function isAllowedModel(id: string | undefined | null): id is string {
  return Boolean(id) && OPENROUTER_MODELS.some((m) => m.id === id);
}

/** Human label for a model id (falls back to the raw id). */
export function modelLabel(id: string): string {
  return OPENROUTER_MODELS.find((m) => m.id === id)?.label ?? id;
}
