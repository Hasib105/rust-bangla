import { getCollection } from 'astro:content';
import { codeToHtml } from 'shiki';
import { courseById } from './courses';

export const slugOf = (id: string) => id.split('/')[1].replace(/^\d+-/, '');
export const bnN = (n: number | string) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]);
export const baseUrl = () => import.meta.env.BASE_URL.replace(/\/?$/, '/');
export const lessonUrl = (course: string, slug: string) => `${baseUrl()}${course}/${slug}/`;

export async function getLessons(course: string) {
  const all = await getCollection('lessons', (l) => l.id.startsWith(course + '/'));
  return all
    .sort((a, b) => a.data.order - b.data.order)
    .map((l) => ({ id: l.id, course, slug: slugOf(l.id), key: `${course}/${slugOf(l.id)}`, ...l.data, entry: l }));
}

export async function getCourseTree(course: string) {
  const c = courseById(course);
  const lessons = await getLessons(course);
  return {
    ...c,
    lessons,
    parts: c.parts.map((p) => ({ ...p, lessons: lessons.filter((l) => l.part === p.id) })).filter((p) => p.lessons.length),
  };
}

const cache = new Map<string, string>();
async function hl(code: string) {
  if (!cache.has(code)) cache.set(code, await codeToHtml(code, { lang: 'rust', theme: 'github-dark-dimmed' }));
  return cache.get(code)!;
}

/** Quiz cards ready for the browser: code pre-highlighted. */
export async function getCards(lessonId: string, from?: string) {
  const all = await getCollection('quizzes');
  const q = all.find((x) => x.id === lessonId);
  if (!q) return [];
  return Promise.all(
    q.data.cards.map(async (c) => {
      const { code, ...rest } = c as typeof c & { code?: string };
      return { ...rest, ...(code ? { codeHtml: await hl(code) } : {}), ...(from ? { from } : {}) };
    }),
  );
}
