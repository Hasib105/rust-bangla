// One small Postgres pool per server instance (Neon: use the pooled connection string).
import pg from 'pg';

// Neon on Vercel may name it DATABASE_URL, POSTGRES_URL, or <PREFIX>_DATABASE_URL / <PREFIX>_POSTGRES_URL.
export function databaseUrl(): { name: string; url: string } | undefined {
  const all = { ...(import.meta.env as Record<string, string | undefined>), ...process.env };
  for (const k of ['DATABASE_URL', 'POSTGRES_URL', 'NEON_DATABASE_URL']) if (all[k]) return { name: k, url: all[k]! };
  const k = Object.keys(all).find((n) => /(_DATABASE_URL|_POSTGRES_URL)$/.test(n) && !/UNPOOLED|NON_POOLING/.test(n) && all[n]);
  return k ? { name: k, url: all[k]! } : undefined;
}
const url = databaseUrl()?.url;
let pool: pg.Pool | undefined;

export function getPool() {
  if (!url) throw new Error('no database URL set (DATABASE_URL / POSTGRES_URL)');
  pool ??= new pg.Pool({
    connectionString: url,
    max: 3,
    idleTimeoutMillis: 10_000,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: true },
  });
  return pool;
}
