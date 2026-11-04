import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

const lessons = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/lessons' }),
  schema: z.object({
    title: z.string(), // Bangla title, e.g. "Ownership: Rust-এর হৃদয়"
    short: z.string(), // 1–3 word label for the board node
    part: z.number().int().min(1).max(10),
    order: z.number().int().min(1),
    summary: z.string(), // one Bangla sentence
    icon: z.string().default('🦀'),
    minutes: z.number().int().default(8),
    video: z.string().optional(), // YouTube id from the Rust Bangla channel
  }),
});

const base = { q: z.string(), code: z.string().optional(), explain: z.string() };

const card = z.discriminatedUnion('type', [
  // pick one (also "what does this print?")
  z.object({ type: z.literal('choice'), ...base, options: z.array(z.string()).min(2).max(4), answer: z.number().int().min(0) }),
  z.object({ type: z.literal('truefalse'), ...base, answer: z.boolean() }),
  // put lines in order (shown shuffled)
  z.object({ type: z.literal('order'), ...base, lines: z.array(z.string()).min(3).max(7) }),
  // type the missing piece: `code` holds one ___
  z.object({ type: z.literal('fill'), ...base, code: z.string(), answer: z.array(z.string()).min(1) }),
  // tap the line the compiler rejects (1-based)
  z.object({ type: z.literal('line'), ...base, code: z.string(), answer: z.union([z.number().int().min(1), z.array(z.number().int().min(1)).min(1)]) }),
]);

const quizzes = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/quizzes' }),
  schema: z.object({ cards: z.array(card).min(6).max(14) }),
});

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
  lessons,
  quizzes,
};
