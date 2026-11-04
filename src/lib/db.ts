// One small Postgres pool per server instance (Neon: use the pooled connection string).
import pg from 'pg';

const url = process.env.DATABASE_URL || import.meta.env.DATABASE_URL;
let pool: pg.Pool | undefined;

export function getPool() {
  if (!url) throw new Error('DATABASE_URL is not set');
  pool ??= new pg.Pool({
    connectionString: url,
    max: 3,
    idleTimeoutMillis: 10_000,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: true },
  });
  return pool;
}
