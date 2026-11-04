// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Marks Rust blocks so the client can add ▶ Run buttons:
//   ```rust               -> runnable (data-run)
//   ```rust compile_fail  -> runnable, expected to fail (data-run data-fail)
//   ```rust ignore        -> fragment, no button
//   ```text               -> program output (class "out")
const runMarker = {
  name: 'rb-run-marker',
  pre(node) {
    const lang = this.options.lang;
    const meta = this.options.meta?.__raw || '';
    if (lang === 'rust' && !/\bignore\b/.test(meta)) {
      node.properties['data-run'] = '';
      if (/\bcompile_fail\b/.test(meta)) node.properties['data-fail'] = '';
    }
    if (lang === 'text' || lang === 'txt') this.addClassToHast(node, 'out');
  },
};

// Hosted on Vercel at the domain root. Set SITE_URL to the real domain when you have one.
const site = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://rust-bangla.vercel.app');
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore', // API routes (better-auth callbacks) must not be redirected
  // Pages are prerendered (static, served from Vercel's CDN); only /api/* runs as a function (login + progress sync).
  adapter: vercel(),
  markdown: {
    shikiConfig: { theme: 'github-dark-dimmed', transformers: [runMarker] },
  },
});
