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

// The cheapest model from each major frontier brand (ChatGPT / Gemini / Claude),
// cheapest first. Approx blended price per 1M tokens shown in `note`.
export const OPENROUTER_MODELS: OpenRouterModelOption[] = [
  {
    id: "openai/gpt-5-nano",
    label: "GPT-5 nano",
    note: "Cheapest ChatGPT · ~$0.45/1M",
  },
  {
    id: "google/gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash Lite",
    note: "Cheapest Gemini · ~$0.50/1M",
  },
  {
    id: "anthropic/claude-3-haiku",
    label: "Claude 3 Haiku",
    note: "Cheapest Claude · ~$1.50/1M",
  },
];

// Cheapest model overall = default.
export const DEFAULT_OPENROUTER_MODEL = "openai/gpt-5-nano";

/** Server-side guard: only let through a model we explicitly offer. */
export function isAllowedModel(id: string | undefined | null): id is string {
  return Boolean(id) && OPENROUTER_MODELS.some((m) => m.id === id);
}

/** Human label for a model id (falls back to the raw id). */
export function modelLabel(id: string): string {
  return OPENROUTER_MODELS.find((m) => m.id === id)?.label ?? id;
}
