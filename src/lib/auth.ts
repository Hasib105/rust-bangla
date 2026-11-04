// better-auth with GitHub login, stored in Postgres (Neon). Used only by server routes (prerender = false).
import { betterAuth } from 'better-auth';
import { getPool } from './db';

const env = (k: string) => process.env[k] || (import.meta.env as Record<string, string | undefined>)[k];

export function authOptions() {
  return {
    database: getPool(),
    secret: env('BETTER_AUTH_SECRET'),
    baseURL: env('BETTER_AUTH_URL'), // e.g. https://rust-bangla.vercel.app (falls back to the request origin)
    basePath: '/api/auth',
    socialProviders: {
      github: { clientId: env('GITHUB_CLIENT_ID') ?? '', clientSecret: env('GITHUB_CLIENT_SECRET') ?? '' },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 60, // 60 days
      updateAge: 60 * 60 * 24, // refreshed at most daily
      // signed cookie copy of the session: most requests skip the session DB lookup
      cookieCache: { enabled: true, maxAge: 10 * 60 },
    },
    telemetry: { enabled: false },
  };
}

let cached: ReturnType<typeof betterAuth> | undefined;
export function getAuth() {
  cached ??= betterAuth(authOptions());
  return cached;
}
