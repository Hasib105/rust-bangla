// GET: the signed-in learner's saved state.  PUT: merge the browser's state into it, return the result.
import type { APIRoute } from 'astro';
import { getAuth } from '../../lib/auth';
import { getPool } from '../../lib/db';
import { merge, xpOf } from '../../scripts/merge';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

async function userOf(request: Request) {
  const s = await getAuth().api.getSession({ headers: request.headers });
  return s?.user ?? null;
}

async function load(userId: string) {
  const { rows } = await getPool().query('select state from progress where "userId" = $1', [userId]);
  return rows[0]?.state ?? null;
}

export const GET: APIRoute = async ({ request }) => {
  const user = await userOf(request);
  if (!user) return json({ user: null }, 401);
  return json({ user: { name: user.name, image: user.image }, state: await load(user.id) });
};

export const PUT: APIRoute = async ({ request }) => {
  const user = await userOf(request);
  if (!user) return json({ error: 'not signed in' }, 401);
  const body = await request.text();
  if (body.length > 200_000) return json({ error: 'too large' }, 413);
  let incoming;
  try { incoming = JSON.parse(body); } catch { return json({ error: 'bad json' }, 400); }
  if (!incoming || typeof incoming !== 'object' || typeof incoming.lessons !== 'object') return json({ error: 'bad state' }, 400);
  const saved = await load(user.id);
  const state = saved ? merge(saved, incoming) : { ...incoming, xp: xpOf(incoming) };
  await getPool().query(
    `insert into progress ("userId", state, xp, "updatedAt") values ($1, $2, $3, now())
     on conflict ("userId") do update set state = $2, xp = $3, "updatedAt" = now()`,
    [user.id, state, state.xp],
  );
  return json({ state });
};
