// Bounded fetch — aborts a hung upstream so it can't consume the whole serverless
// function budget (Vercel kills the function at maxDuration). Server-side only.
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}
