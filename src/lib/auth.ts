// better-auth on Cloudflare D1, GitHub login only. Runs only in server routes (prerender = false).
import { betterAuth } from 'better-auth';
import { env } from 'cloudflare:workers';

type Env = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL?: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
};

let cached: ReturnType<typeof make> | undefined;

function make(origin: string) {
  const e = env as unknown as Env;
  return betterAuth({
    database: e.DB,
    secret: e.BETTER_AUTH_SECRET,
    baseURL: e.BETTER_AUTH_URL || origin,
    basePath: '/api/auth',
    trustedOrigins: [e.BETTER_AUTH_URL || origin],
    socialProviders: {
      github: { clientId: e.GITHUB_CLIENT_ID, clientSecret: e.GITHUB_CLIENT_SECRET },
    },
    session: { expiresIn: 60 * 60 * 24 * 60, updateAge: 60 * 60 * 24 }, // 60 days, refreshed daily
    telemetry: { enabled: false },
  });
}

export function getAuth(request: Request) {
  cached ??= make(new URL(request.url).origin);
  return cached;
}

export function db() {
  return (env as unknown as Env).DB;
}
