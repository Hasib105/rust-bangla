// Setup check: which login settings are present/valid (never prints values) and whether the DB answers.
import type { APIRoute } from 'astro';
import { getPool, databaseUrl } from '../../lib/db';

export const prerender = false;

const env = (k: string) => process.env[k] || (import.meta.env as Record<string, string | undefined>)[k];

export const GET: APIRoute = async () => {
  const url = env('BETTER_AUTH_URL');
  let urlOk = false;
  try { urlOk = !!url && /^https?:\/\/[^\s/]+$/.test(url.replace(/\/$/, '')) && !!new URL(url); } catch {}
  const checks: Record<string, string> = {
    DATABASE_URL: (() => { const d = databaseUrl(); return !d ? 'MISSING (connect Neon in Storage → Connect Project)' : /^postgres(ql)?:\/\//.test(d.url) ? `ok (from ${d.name})` : `${d.name} is set but not a postgres:// URL`; })(),
    BETTER_AUTH_SECRET: !env('BETTER_AUTH_SECRET') ? 'MISSING' : env('BETTER_AUTH_SECRET')!.length < 32 ? 'too short (need 32+ chars)' : 'ok',
    BETTER_AUTH_URL: !url ? 'MISSING' : urlOk ? `ok (${url})` : 'INVALID: must be just the site address like https://rust-bangla.vercel.app',
    GITHUB_CLIENT_ID: !env('GITHUB_CLIENT_ID') ? 'MISSING' : /\s/.test(env('GITHUB_CLIENT_ID')!) ? 'INVALID: looks like text, paste the real Client ID' : 'ok',
    GITHUB_CLIENT_SECRET: !env('GITHUB_CLIENT_SECRET') ? 'MISSING' : /\s/.test(env('GITHUB_CLIENT_SECRET')!) ? 'INVALID: looks like text, paste the real secret' : 'ok',
  };
  // names only (never values), to see what the Neon integration actually added
  checks.dbRelatedVarNames = Object.keys(process.env).filter((n) => /DATABASE|POSTGRES|^PG|_PG|NEON/i.test(n)).sort().join(', ') || '(none)';
  checks.deployment = `${process.env.VERCEL_ENV ?? '?'} · commit ${(process.env.VERCEL_GIT_COMMIT_SHA ?? '?').slice(0, 7)}`;
  try {
    const { rows } = await getPool().query(`select to_regclass('public."user"') is not null as auth, to_regclass('public.progress') is not null as progress`);
    checks.database = rows[0].auth && rows[0].progress ? 'ok (tables exist)' : 'connected, but tables missing (redeploy so the build runs migrations)';
    if (rows[0].auth && rows[0].progress) {
      const c = await getPool().query(`select (select count(*) from "user")::int as users, (select count(*) from progress)::int as saved,
        (select count(*) from lesson_progress)::int as lessons, (select count(*) from attempts)::int as attempts`).catch(() => null);
      if (c) checks.records = `users ${c.rows[0].users} · saved progress ${c.rows[0].saved} · lesson rows ${c.rows[0].lessons} · attempts ${c.rows[0].attempts}`;
    }
    const host = databaseUrl()?.url.match(/@([^/:?]+)/)?.[1] ?? '';
    checks.dbRegion = host.match(/\.([a-z]+-[a-z]+-\d)\./)?.[1] ?? host.split('.').slice(-4, -2).join('.') ?? '?';
    checks.functionRegion = process.env.VERCEL_REGION ?? '?';
  } catch (e) {
    checks.database = 'cannot connect: ' + String((e as Error).message).slice(0, 120);
  }
  return new Response(JSON.stringify(checks, null, 2), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
};
