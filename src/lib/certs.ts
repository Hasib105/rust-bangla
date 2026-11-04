// Certificates are issued from the learner's merged progress: a won part challenge (>= 7/10) gives a
// part certificate, a passed final exam (>= 70%) gives the course certificate. Idempotent.
import type { PoolClient, Pool } from 'pg';
import { courses } from '../data/courses';

export type Cert = { id: string; course: string; kind: 'part' | 'course'; part: number; name: string; score: number; total: number; issuedAt: string };

const newId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12);

export function certTitle(c: { course: string; kind: string; part: number }) {
  const course = courses.find((x) => x.id === c.course);
  if (!course) return c.course;
  if (c.kind === 'course') return `${course.title} সম্পূর্ণ কোর্স`;
  const p = course.parts.find((x) => x.id === c.part);
  return `${course.title} · পর্ব ${String(c.part).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d])}: ${p?.title ?? ''}`;
}

export async function issueCerts(db: PoolClient | Pool, userId: string, name: string, state: any) {
  const wanted: [string, string, number, number, number][] = []; // course, kind, part, score, total
  for (const [key, score] of Object.entries<number>(state?.bosses ?? {})) {
    const [course, part] = key.split(':');
    if (score >= 7 && courses.some((c) => c.id === course && c.parts.some((p) => p.id === +part))) wanted.push([course, 'part', +part, score, 10]);
  }
  for (const [course, e] of Object.entries<any>(state?.exams ?? {})) {
    if (e && e.total > 0 && e.score / e.total >= 0.7 && courses.some((c) => c.id === course)) wanted.push([course, 'course', 0, e.score, e.total]);
  }
  for (const [course, kind, part, score, total] of wanted) {
    await db.query(
      `insert into certificates (id, "userId", course, kind, part, name, score, total) values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict ("userId", course, kind, part) do update set score = greatest(certificates.score, excluded.score)`,
      [newId(), userId, course, kind, part, name, score, total],
    );
  }
}

export async function listCerts(db: PoolClient | Pool, userId: string): Promise<(Cert & { title: string })[]> {
  const { rows } = await db.query(
    `select id, course, kind, part, name, score, total, "issuedAt" from certificates where "userId" = $1 order by course, kind desc, part`, [userId]);
  return rows.map((r) => ({ ...r, title: certTitle(r) }));
}
