"use client";
// =============================================================================
// Spotify Web Playback SDK manager (browser singleton)
// =============================================================================
// Plays FULL tracks in-page for a connected Spotify PREMIUM user. The custom
// footer player drives this when the listener is connected and a track URI
// resolves; otherwise it falls back to the keyless 30s preview. The user access
// token is fetched on demand from /api/spotify/token (httpOnly-cookie backed).
// =============================================================================

const SDK_SRC = "https://sdk.scdn.co/spotify-player.js";

export type SpotifyState = {
  ready: boolean;
  deviceId: string | null;
  error: string | null; // human-readable (e.g. "Spotify Premium required")
  paused: boolean;
  positionMs: number;
  durationMs: number;
  currentUri: string | null;
};

type Listener = (s: SpotifyState) => void;

class SpotifyPlaybackManager {
  state: SpotifyState = {
    ready: false,
    deviceId: null,
    error: null,
    paused: true,
    positionMs: 0,
    durationMs: 0,
    currentUri: null,
  };

  private player: any = null;
  private listeners = new Set<Listener>();
  private sdkLoading: Promise<void> | null = null;
  private initPromise: Promise<boolean> | null = null;
  private accessToken: string | null = null;
  private tokenExp = 0;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  subscribe(cb: Listener): () => void {
    this.listeners.add(cb);
    cb(this.state);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private emit() {
    const snap = { ...this.state };
    for (const l of this.listeners) l(snap);
  }
  private set(p: Partial<SpotifyState>) {
    this.state = { ...this.state, ...p };
    this.emit();
  }

  /** Fetch (and cache) a fresh user access token for the SDK + Web API. */
  private async fetchToken(): Promise<string | null> {
    if (this.accessToken && Date.now() < this.tokenExp - 30_000) {
      return this.accessToken;
    }
    try {
      const r = await fetch("/api/spotify/token", { cache: "no-store" });
      const d = await r.json();
      if (d?.accessToken) {
        this.accessToken = d.accessToken as string;
        this.tokenExp = Date.now() + (Number(d.expiresIn) || 3600) * 1000;
        return this.accessToken;
      }
    } catch {
      /* offline / not connected */
    }
    this.accessToken = null;
    return null;
  }

  private loadSdk(): Promise<void> {
    if (typeof window === "undefined") return Promise.reject(new Error("no window"));
    if ((window as any).Spotify) return Promise.resolve();
    if (this.sdkLoading) return this.sdkLoading;
    this.sdkLoading = new Promise<void>((resolve, reject) => {
      (window as any).onSpotifyWebPlaybackSDKReady = () => resolve();
      const s = document.createElement("script");
      s.src = SDK_SRC;
      s.async = true;
      s.onerror = () => reject(new Error("Failed to load Spotify SDK"));
      document.body.appendChild(s);
    });
    return this.sdkLoading;
  }

  /** Lazily create + connect the player. Resolves true when a device is ready. */
  async init(): Promise<boolean> {
    if (this.state.ready && this.player) return true;
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      const token = await this.fetchToken();
      if (!token) {
        this.set({ error: "Not connected to Spotify" });
        return false;
      }
      try {
        await this.loadSdk();
      } catch {
        this.set({ error: "Couldn’t load the Spotify player" });
        return false;
      }
      const Spotify = (window as any).Spotify;
      const player = new Spotify.Player({
        name: "SyncFit by Synclat",
        getOAuthToken: (cb: (t: string) => void) => {
          this.fetchToken().then((t) => t && cb(t));
        },
        volume: 0.8,
      });
      this.player = player;

      player.addListener("ready", ({ device_id }: any) =>
        this.set({ ready: true, deviceId: device_id, error: null }),
      );
      player.addListener("not_ready", () => this.set({ ready: false }));
      player.addListener("player_state_changed", (st: any) => {
        if (!st) return;
        this.set({
          paused: st.paused,
          positionMs: st.position,
          durationMs: st.duration,
          currentUri: st.track_window?.current_track?.uri ?? this.state.currentUri,
        });
        this.managePoll(!st.paused);
      });
      player.addListener("initialization_error", ({ message }: any) =>
        this.set({ error: message || "Spotify init error" }),
      );
      player.addListener("authentication_error", () => {
        this.accessToken = null;
        this.set({ error: "Spotify session expired — reconnect" });
      });
      player.addListener("account_error", () =>
        this.set({ error: "Spotify Premium is required for full tracks" }),
      );

      const ok = await player.connect();
      if (!ok) {
        this.set({ error: "Couldn’t connect to Spotify" });
        return false;
      }
      return this.waitReady(8000);
    })();
    const r = await this.initPromise;
    this.initPromise = null;
    return r;
  }

  private waitReady(ms: number): Promise<boolean> {
    if (this.state.ready && this.state.deviceId) return Promise.resolve(true);
    return new Promise((resolve) => {
      const start = Date.now();
      const t = setInterval(() => {
        if (this.state.ready && this.state.deviceId) {
          clearInterval(t);
          resolve(true);
        } else if (Date.now() - start > ms) {
          clearInterval(t);
          resolve(false);
        }
      }, 150);
    });
  }

  /** Keep position fresh while playing (state_changed doesn't tick on its own). */
  private managePoll(active: boolean) {
    if (active && !this.pollTimer) {
      this.pollTimer = setInterval(async () => {
        try {
          const st = await this.player?.getCurrentState?.();
          if (st) {
            this.set({
              positionMs: st.position,
              durationMs: st.duration,
              paused: st.paused,
            });
          }
        } catch {
          /* ignore */
        }
      }, 1000);
    } else if (!active && this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /** Start a track URI on our device. Returns true on success. */
  async playUri(uri: string): Promise<boolean> {
    const ready = await this.init();
    if (!ready || !this.state.deviceId) return false;
    const token = await this.fetchToken();
    if (!token) return false;
    try {
      const r = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${this.state.deviceId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uris: [uri] }),
        },
      );
      if (r.status === 401) {
        this.accessToken = null;
        this.set({ error: "Spotify session expired — reconnect" });
        return false;
      }
      if (r.status === 403) {
        this.set({ error: "Spotify Premium is required for full tracks" });
        return false;
      }
      if (!r.ok && r.status !== 202 && r.status !== 204) return false;
      this.set({ currentUri: uri, error: null, paused: false });
      this.managePoll(true);
      return true;
    } catch {
      return false;
    }
  }

  async resume() {
    try {
      await this.player?.resume();
      this.managePoll(true);
    } catch {
      /* ignore */
    }
  }
  async pause() {
    try {
      await this.player?.pause();
    } catch {
      /* ignore */
    }
    this.managePoll(false);
  }
  async toggle() {
    try {
      await this.player?.togglePlay();
    } catch {
      /* ignore */
    }
  }
  async seek(ms: number) {
    try {
      await this.player?.seek(Math.max(0, Math.floor(ms)));
      this.set({ positionMs: ms });
    } catch {
      /* ignore */
    }
  }
  async setVolume(v: number) {
    try {
      await this.player?.setVolume(Math.max(0, Math.min(1, v)));
    } catch {
      /* ignore */
    }
  }
}

let _mgr: SpotifyPlaybackManager | null = null;
export function getSpotifyPlayback(): SpotifyPlaybackManager {
  if (!_mgr) _mgr = new SpotifyPlaybackManager();
  return _mgr;
}
