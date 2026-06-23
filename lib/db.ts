// =============================================================================
// SyncFit — Supabase Postgres storage (durable, shared across serverless
// instances). SERVER ONLY. Active whenever POSTGRES_URL is set (the Vercel
// Supabase integration injects it); otherwise callers fall back to the local
// file store for dev. Replaces the suspended Vercel Blob store.
// =============================================================================
import postgres from "postgres";

const POSTGRES_URL = process.env.POSTGRES_URL?.trim() || "";

/** True when a Supabase/Postgres connection string is configured. */
export function isDbConfigured(): boolean {
  return POSTGRES_URL.length > 0;
}

// Single pooled connection per serverless instance. Supabase's pooler runs in
// transaction mode, so prepared statements must be disabled. SSL is required.
let _sql: ReturnType<typeof postgres> | null = null;
function db(): ReturnType<typeof postgres> {
  if (!_sql) {
    _sql = postgres(POSTGRES_URL, {
      ssl: "require",
      prepare: false,
      max: 3,
      idle_timeout: 20,
      connect_timeout: 15,
    });
  }
  return _sql;
}

// Lazily ensure the KV table exists (once per instance). On failure the promise
// is cleared so the next call retries instead of caching a broken state.
let schemaReady: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    const sql = db();
    schemaReady = sql`
      create table if not exists app_kv (
        key text primary key,
        value jsonb not null,
        updated_at timestamptz not null default now()
      )
    `
      .then(() => undefined)
      .catch((e) => {
        schemaReady = null;
        throw e;
      });
  }
  return schemaReady;
}

/** Read a JSON value by key, or `fallback` if absent. */
export async function kvGet<T>(key: string, fallback: T): Promise<T> {
  await ensureSchema();
  const rows = await db()`select value from app_kv where key = ${key}`;
  return rows.length ? (rows[0].value as T) : fallback;
}

/** Upsert a JSON value by key. */
export async function kvSet(key: string, value: unknown): Promise<void> {
  await ensureSchema();
  const sql = db();
  await sql`
    insert into app_kv (key, value, updated_at)
    values (${key}, ${sql.json(value as never)}, now())
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `;
}

/** Lightweight health probe — true if the DB is reachable and writable. */
export async function dbHealthy(): Promise<boolean> {
  try {
    await ensureSchema();
    await db()`select 1`;
    return true;
  } catch {
    return false;
  }
}

/** Storage keys for the single-row-per-store KV layout. */
export const KV = {
  reports: "reports",
  projects: "projects",
  analytics: "analytics",
} as const;
