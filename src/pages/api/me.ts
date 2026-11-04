// GET: account info + certificates for the profile page.  POST { profilePublic?, name? }: update settings.
import type { APIRoute } from 'astro';
import { getAuth } from '../../lib/auth';
import { getPool } from '../../lib/db';
import { listCerts } from '../../lib/certs';

export const prerender = false;
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

async function current(request: Request) {
  const s = await getAuth().api.getSession({ headers: request.headers, query: { disableCookieCache: true } });
  return s?.user as (typeof s extends null ? never : any) | null;
}

/** Users created before usernames existed: look up the GitHub login once. */
async function ensureUsername(user: any) {
  if (user.username) return user.username;
  const db = getPool();
  const { rows } = await db.query(`select "accountId" from account where "userId" = $1 and "providerId" = 'github'`, [user.id]);
  if (!rows[0]) return null;
  const res = await fetch(`https://api.github.com/user/${rows[0].accountId}`, { headers: { 'user-agent': 'rust-bangla' } }).catch(() => null);
  const login = res?.ok ? (await res.json()).login?.toLowerCase() : null;
  if (login) await db.query(`update "user" set username = $1 where id = $2 and username is null`, [login, user.id]).catch(() => {});
  return login;
}

export const GET: APIRoute = async ({ request }) => {
  const user = await current(request);
  if (!user) return json({ user: null }, 401);
  const username = await ensureUsername(user);
  return json({
    user: { name: user.name, image: user.image, username, profilePublic: user.profilePublic !== false },
    certificates: await listCerts(getPool(), user.id),
  });
};

export const POST: APIRoute = async ({ request }) => {
  const user = await current(request);
  if (!user) return json({ error: 'not signed in' }, 401);
  const body = await request.json().catch(() => ({}));
  const db = getPool();
  if (typeof body.profilePublic === 'boolean') {
    await db.query(`update "user" set "profilePublic" = $1, "updatedAt" = now() where id = $2`, [body.profilePublic, user.id]);
  }
  if (typeof body.name === 'string') {
    const name = body.name.trim().replace(/\s+/g, ' ').slice(0, 60);
    if (name.length >= 2) {
      await db.query(`update "user" set name = $1, "updatedAt" = now() where id = $2`, [name, user.id]);
      await db.query(`update certificates set name = $1 where "userId" = $2`, [name, user.id]);
    }
  }
  return json({ ok: true });
};
