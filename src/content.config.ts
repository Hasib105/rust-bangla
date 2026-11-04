import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

// src/content/courses/<course>/lessons/NN-slug.md  ->  id "<course>/NN-slug"
const courseId = (folder: string) => ({ entry }: { entry: string }) =>
  entry.replace(`/${folder}/`, '/').replace(/\.(md|json)$/, '');

const lessons = defineCollection({
  loader: glob({ pattern: '*/lessons/*.md', base: './src/content/courses', generateId: courseId('lessons') }),
  schema: z.object({
    title: z.string(), // Bangla title
    short: z.string(), // 1–3 word label
    part: z.number().int().min(1),
    order: z.number().int().min(1),
    summary: z.string(), // one Bangla sentence
    minutes: z.number().int().default(6),
  }),
});

const base = { q: z.string(), code: z.string().optional(), explain: z.string() };

const card = z.discriminatedUnion('type', [
  z.object({ type: z.literal('choice'), ...base, options: z.array(z.string()).min(2).max(4), answer: z.number().int().min(0) }),
  z.object({ type: z.literal('truefalse'), ...base, answer: z.boolean() }),
  z.object({ type: z.literal('order'), ...base, lines: z.array(z.string()).min(3).max(7) }),
  z.object({ type: z.literal('fill'), ...base, code: z.string(), answer: z.array(z.string()).min(1) }),
  z.object({ type: z.literal('line'), ...base, code: z.string(), answer: z.union([z.number().int().min(1), z.array(z.number().int().min(1)).min(1)]) }),
]);

const quizzes = defineCollection({
  loader: glob({ pattern: '*/quizzes/*.json', base: './src/content/courses', generateId: courseId('quizzes') }),
  schema: z.object({ cards: z.array(card).min(6).max(14) }),
});

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
  lessons,
  quizzes,
};
