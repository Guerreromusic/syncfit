// =============================================================================
// SyncFit by Synclat — ElevenLabs text-to-speech (SERVER-SIDE ONLY)
// =============================================================================
// Reads SyncFit-generated text (pitch summary, score result) aloud. The API key
// is read from process.env and never reaches the browser — the /api/tts route
// streams the synthesized MP3 back through our own origin. Degrades to a no-op
// (caller returns 503) when ELEVENLABS_API_KEY is unset.
//
// COMPLIANCE: only Synclat-generated text is ever sent here — never lyrics.
// =============================================================================

import { env, isConfigured } from "../env";
import { fetchWithTimeout } from "../fetchWithTimeout";

const ELEVENLABS_TTS = "https://api.elevenlabs.io/v1/text-to-speech";

export class ElevenLabsNotConfiguredError extends Error {
  constructor() {
    super("ElevenLabs is not configured.");
    this.name = "ElevenLabsNotConfiguredError";
  }
}

/** Hard cap so a runaway request can't burn the quota (≈ a few minutes of speech). */
const MAX_CHARS = 4000;

/**
 * Synthesize speech for `text`. Returns the upstream Response so the route can
 * stream the audio body straight through (no buffering of the whole clip).
 */
export async function synthesizeSpeech(input: {
  text: string;
  voiceId?: string;
}): Promise<Response> {
  if (!isConfigured.elevenlabs()) throw new ElevenLabsNotConfiguredError();
  const text = input.text.trim().slice(0, MAX_CHARS);
  const voice = input.voiceId?.trim() || env.elevenlabsVoice();

  const res = await fetchWithTimeout(
    `${ELEVENLABS_TTS}/${encodeURIComponent(voice)}`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        "xi-api-key": env.elevenlabs(),
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2", // multilingual — matches global tracks/briefs
        voice_settings: { stability: 0.4, similarity_boost: 0.75 },
      }),
    },
    30000,
  );
  return res;
}
