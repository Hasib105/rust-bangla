// GET: the signed-in learner's saved state.
// PUT { state, events? }: merge the browser's state into the account, record finished lessons/challenges/exams.
// One request per save; the client only calls it when something actually changed.
import type { APIRoute } from 'astro';
import { getAuth } from '../../lib/auth';
import { getPool } from '../../lib/db';
import { merge, xpOf } from '../../scripts/merge';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

type Event = { kind: 'lesson' | 'challenge' | 'exam'; ref: string; mode?: string; score: number; total: number };
const isEvent = (e: any): e is Event =>
  e && ['lesson', 'challenge', 'exam'].includes(e.kind) && typeof e.ref === 'string' && e.ref.length < 80 &&
  Number.isInteger(e.score) && Number.isInteger(e.total) && e.total > 0 && e.total <= 50 && e.score >= 0 && e.score <= e.total;

async function userOf(request: Request) {
  const s = await getAuth().api.getSession({ headers: request.headers });
  return s?.user ?? null;
}

export const GET: APIRoute = async ({ request }) => {
  const user = await userOf(request);
  if (!user) return json({ user: null }, 401);
  const { rows } = await getPool().query('select state from progress where "userId" = $1', [user.id]);
  return json({ user: { name: user.name, image: user.image }, state: rows[0]?.state ?? null });
};

export const PUT: APIRoute = async ({ request }) => {
  const user = await userOf(request);
  if (!user) return json({ error: 'not signed in' }, 401);
  const body = await request.text();
  if (body.length > 200_000) return json({ error: 'too large' }, 413);
  let parsed: any;
  try { parsed = JSON.parse(body); } catch { return json({ error: 'bad json' }, 400); }
  const incoming = parsed?.state ?? parsed; // old clients sent the bare state
  const events: Event[] = (Array.isArray(parsed?.events) ? parsed.events : []).filter(isEvent).slice(0, 20);
  if (!incoming || typeof incoming !== 'object' || typeof incoming.lessons !== 'object') return json({ error: 'bad state' }, 400);

  const db = await getPool().connect();
  try {
    await db.query('begin');
    const { rows } = await db.query('select state from progress where "userId" = $1 for update', [user.id]);
    const state = rows[0] ? merge(rows[0].state, incoming) : { ...incoming, xp: xpOf(incoming) };
    await db.query(
      `insert into progress ("userId", state, xp, "updatedAt") values ($1, $2, $3, now())
       on conflict ("userId") do update set state = $2, xp = $3, "updatedAt" = now()`,
      [user.id, state, state.xp],
    );
    for (const e of events) {
      await db.query('insert into attempts ("userId", kind, ref, mode, score, total) values ($1, $2, $3, $4, $5, $6)',
        [user.id, e.kind, e.ref, e.mode ?? null, e.score, e.total]);
      if (e.kind === 'lesson') {
        const r = state.lessons?.[e.ref];
        await db.query(
          `insert into lesson_progress ("userId", "lessonKey", best, total, stars, attempts)
           values ($1, $2, $3, $4, $5, 1)
           on conflict ("userId", "lessonKey") do update set
             best = greatest(lesson_progress.best, excluded.best), total = excluded.total,
             stars = greatest(lesson_progress.stars, excluded.stars),
             attempts = lesson_progress.attempts + 1, "lastAt" = now()`,
          [user.id, e.ref, r?.best ?? e.score, e.total, r?.stars ?? 1],
        );
      }
    }
    await db.query('commit');
    return json({ state });
  } catch (err) {
    await db.query('rollback').catch(() => {});
    throw err;
  } finally {
    db.release();
  }
};
