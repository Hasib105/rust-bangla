import { getCollection } from 'astro:content';
import { codeToHtml } from 'shiki';
import { parts } from './parts';

export const slugOf = (id: string) => id.replace(/^\d+-/, '');

export async function getLessons() {
  const all = await getCollection('lessons');
  return all
    .sort((a, b) => a.data.order - b.data.order)
    .map((l) => ({ id: l.id, slug: slugOf(l.id), ...l.data, entry: l }));
}

export async function getCourse() {
  const lessons = await getLessons();
  return parts.map((p) => ({ ...p, lessons: lessons.filter((l) => l.part === p.id) })).filter((p) => p.lessons.length);
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
