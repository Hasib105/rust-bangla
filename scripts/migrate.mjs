#!/usr/bin/env node
// Creates/updates the database tables (better-auth's + our progress table). Safe to run on every deploy.
//   DATABASE_URL=postgres://... node scripts/migrate.mjs
// On Vercel it runs automatically in the build when DATABASE_URL is set.
import pg from 'pg';
import { getMigrations } from 'better-auth/db/migration';

const url = process.env.DATABASE_URL;
if (!url) { console.log('[migrate] DATABASE_URL not set, skipping'); process.exit(0); }
const pool = new pg.Pool({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: true } });

const { toBeCreated, toBeAdded, runMigrations } = await getMigrations({
  database: pool,
  socialProviders: { github: { clientId: 'x', clientSecret: 'x' } },
});
if (toBeCreated.length || toBeAdded.length) {
  console.log('[migrate] auth tables:', [...toBeCreated, ...toBeAdded].map((t) => t.table).join(', '));
  await runMigrations();
}
await pool.query(`
  create table if not exists progress (
    "userId" text primary key references "user"(id) on delete cascade,
    state jsonb not null,
    xp integer not null default 0,
    "updatedAt" timestamptz not null default now()
  );
  create index if not exists progress_xp_idx on progress (xp desc);
`);
console.log('[migrate] done');
await pool.end();
