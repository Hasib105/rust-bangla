// One small Postgres pool per server instance (Neon: use the pooled connection string).
import pg from 'pg';

// Neon on Vercel may name it DATABASE_URL, POSTGRES_URL, or <PREFIX>_DATABASE_URL / <PREFIX>_POSTGRES_URL.
export function databaseUrl(): { name: string; url: string } | undefined {
  const all = { ...(import.meta.env as Record<string, string | undefined>), ...process.env };
  for (const k of ['DATABASE_URL', 'POSTGRES_URL', 'NEON_DATABASE_URL']) if (all[k]) return { name: k, url: all[k]! };
  const k = Object.keys(all).find((n) => /(_DATABASE_URL|_POSTGRES_URL)$/.test(n) && !/UNPOOLED|NON_POOLING/.test(n) && all[n]);
  if (k) return { name: k, url: all[k]! };
  // Neon also sets PGHOST / PGUSER / PGPASSWORD / PGDATABASE (sometimes with a prefix)
  const pick = (base: string) => Object.keys(all).find((n) => (n === base || n.endsWith('_' + base)) && all[n]);
  const [h, u, pw, d] = ['PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'].map(pick);
  if (h && u && pw && d) {
    return { name: 'PGHOST/PGUSER/PGPASSWORD/PGDATABASE', url: `postgresql://${encodeURIComponent(all[u]!)}:${encodeURIComponent(all[pw]!)}@${all[h]}/${all[d]}?sslmode=require` };
  }
  return undefined;
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
