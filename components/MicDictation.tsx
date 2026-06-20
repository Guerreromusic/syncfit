"use client";

import * as React from "react";

// Minimal Web Speech API typings (the TS DOM lib only ships them partially).
interface SpeechAlt {
  transcript: string;
}
interface SpeechResult {
  isFinal: boolean;
  0: SpeechAlt;
}
interface SpeechResultList {
  length: number;
  [index: number]: SpeechResult;
}
interface SpeechResultEvent {
  resultIndex: number;
  results: SpeechResultList;
}
interface SpeechErrorEvent {
  error: string;
}
interface SpeechRecognizer {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognizerCtor = new () => SpeechRecognizer;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognizerCtor;
    webkitSpeechRecognition?: SpeechRecognizerCtor;
  }
}

type Status = "idle" | "listening" | "unsupported";

/**
 * Browser speech-to-text for a text field — dictate straight into the Research
 * console. Uses the keyless Web Speech API (Chrome/Edge/Safari); renders nothing
 * on unsupported browsers (e.g. Firefox). Appends the transcript to `value` live,
 * including interim results, and keeps listening through pauses until stopped.
 */
export function MicDictation({
  value,
  onChange,
  lang = "en-US",
}: {
  value: string;
  onChange: (next: string) => void;
  lang?: string;
}) {
  const [status, setStatus] = React.useState<Status>("idle");
  const recRef = React.useRef<SpeechRecognizer | null>(null);
  const wantRef = React.useRef(false); // keep-listening intent (survives onend)
  const baseRef = React.useRef(""); // text present when dictation started
  const finalRef = React.useRef(""); // accumulated finalized transcript
  const valueRef = React.useRef(value);
  valueRef.current = value;
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  React.useEffect(() => {
    const SR =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
    if (!SR) {
      setStatus("unsupported");
      return;
    }
    const rec: SpeechRecognizer = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;

    rec.onresult = (e: SpeechResultEvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += transcript;
        else interim += transcript;
      }
      const base = baseRef.current;
      const sep = base && !/\s$/.test(base) ? " " : "";
      const next = (base + sep + finalRef.current + interim).replace(/\s{2,}/g, " ");
      onChangeRef.current(next);
    };

    rec.onerror = (e: SpeechErrorEvent) => {
      // "no-speech" (silence) and "aborted" (manual stop) are benign — recover or
      // ignore. Anything else (no mic, denied, network) ends the session cleanly
      // so onend can't restart-loop it.
      if (e.error !== "no-speech" && e.error !== "aborted") {
        wantRef.current = false;
        setStatus("idle");
      }
    };

    rec.onend = () => {
      if (wantRef.current) {
        try {
          rec.start(); // continuous mode can still end on long silence — resume
        } catch {
          /* already starting */
        }
      } else {
        setStatus("idle");
      }
    };

    recRef.current = rec;
    return () => {
      wantRef.current = false;
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    };
  }, [lang]);

  function toggle() {
    const rec = recRef.current;
    if (!rec) return;
    if (status === "listening") {
      wantRef.current = false;
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      setStatus("idle");
    } else {
      baseRef.current = valueRef.current;
      finalRef.current = "";
      wantRef.current = true;
      try {
        rec.start();
        setStatus("listening");
      } catch {
        wantRef.current = false; // never leave a restart intent on a failed start
        setStatus("idle");
      }
    }
  }

  if (status === "unsupported") return null;

  const listening = status === "listening";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={listening}
      aria-label={listening ? "Stop dictation" : "Dictate the brief"}
      title={listening ? "Stop dictation" : "Speak your brief"}
      className={
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/60 " +
        (listening
          ? "border-red-400/50 bg-red-500/15 text-red-200"
          : "border-purple-400/30 bg-purple-500/10 text-purple-100 hover:border-purple-400/60 hover:bg-purple-500/20")
      }
    >
      {listening ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
          </span>
          Listening…
        </>
      ) : (
        <>
          <MicGlyph />
          Speak
        </>
      )}
    </button>
  );
}

function MicGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" />
      <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 1 0 2 0v-3.08A7 7 0 0 0 19 11z" />
    </svg>
  );
}
