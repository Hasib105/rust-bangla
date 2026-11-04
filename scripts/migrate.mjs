#!/usr/bin/env node
// Creates/updates the database tables (better-auth's + our progress table). Safe to run on every deploy.
//   DATABASE_URL=postgres://... node scripts/migrate.mjs
// On Vercel it runs automatically in the build when DATABASE_URL is set.
import pg from 'pg';
import { getMigrations } from 'better-auth/db/migration';

const e = process.env;
const key = ['DATABASE_URL', 'POSTGRES_URL', 'NEON_DATABASE_URL'].find((k) => e[k])
  ?? Object.keys(e).find((n) => /(_DATABASE_URL|_POSTGRES_URL)$/.test(n) && !/UNPOOLED|NON_POOLING/.test(n) && e[n]);
const url = key && e[key];
if (!url) { console.log('[migrate] no DATABASE_URL / POSTGRES_URL set, skipping'); process.exit(0); }
console.log('[migrate] using', key);
const pool = new pg.Pool({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: true } });

const { toBeCreated, toBeAdded, runMigrations } = await getMigrations({
  database: pool,
  socialProviders: { github: { clientId: 'x', clientSecret: 'x' } },
  // keep in sync with src/lib/auth.ts
  user: { additionalFields: { username: { type: 'string', required: false }, profilePublic: { type: 'boolean', required: false, defaultValue: true } } },
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

  -- one row per learner per lesson: best score, stars, how many times played
  create table if not exists lesson_progress (
    "userId" text not null references "user"(id) on delete cascade,
    "lessonKey" text not null,
    best integer not null,
    total integer not null,
    stars integer not null,
    attempts integer not null default 1,
    "firstDoneAt" timestamptz not null default now(),
    "lastAt" timestamptz not null default now(),
    primary key ("userId", "lessonKey")
  );
  create index if not exists lesson_progress_lesson_idx on lesson_progress ("lessonKey");

  -- every finished lesson / challenge / exam (history for stats)
  create table if not exists attempts (
    id bigserial primary key,
    "userId" text not null references "user"(id) on delete cascade,
    kind text not null,            -- 'lesson' | 'challenge' | 'exam'
    ref text not null,             -- 'rust/ownership' | 'rust:2' | 'rust'
    mode text,                     -- 'play' | 'quiz' (lessons only)
    score integer not null,
    total integer not null,
    "createdAt" timestamptz not null default now()
  );
  create index if not exists attempts_user_idx on attempts ("userId", "createdAt" desc);
  create index if not exists attempts_ref_idx on attempts (ref);

  create unique index if not exists user_username_idx on "user" (username);

  -- certificates: one per finished part (kind 'part') and per passed final exam (kind 'course')
  create table if not exists certificates (
    id text primary key,                      -- short public id, used in /cert/<id>
    "userId" text not null references "user"(id) on delete cascade,
    course text not null,
    kind text not null,                       -- 'part' | 'course'
    part integer not null default 0,          -- 0 for course certificates
    name text not null,                       -- learner name printed on it
    score integer not null,
    total integer not null,
    "issuedAt" timestamptz not null default now(),
    unique ("userId", course, kind, part)
  );
`);
console.log('[migrate] done');
await pool.end();
