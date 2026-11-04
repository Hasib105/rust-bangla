// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import cloudflare from '@astrojs/cloudflare';

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

// Hosted on Cloudflare Workers at the domain root. Set SITE_URL to the real domain when you have one.
const site = process.env.SITE_URL || 'https://rust-bangla.workers.dev';
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore', // API routes (better-auth callbacks) must not be redirected
  // Pages are prerendered (static); only /api/* runs on the Worker (login + progress sync).
  adapter: cloudflare({ prerenderEnvironment: 'node' }),
  markdown: {
    shikiConfig: { theme: 'github-dark-dimmed', transformers: [runMarker] },
  },
  integrations: [
    starlight({
      title: 'Rust বাংলা ডকস',
      description: 'Rust-এর বাংলা ডকুমেন্টেশন: রেফারেন্স, চিটশিট আর গাইড।',
      logo: { src: './src/assets/logo.png', replacesTitle: false },
      favicon: '/favicon.png',
      defaultLocale: 'root',
      locales: { root: { label: 'বাংলা', lang: 'bn' } },
      social: [
        { icon: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/@RustBangla' },
      ],
      customCss: ['./src/styles/starlight.css'],
      expressiveCode: false, // lessons use Astro's shiki + our run-marker transformer
      head: [
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
        { tag: 'link', attrs: { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap' } },
      ],
      sidebar: [
        { label: '← কোর্সে ফিরে যাও', link: base },
        { label: 'ডকুমেন্টেশন', items: [{ autogenerate: { directory: 'docs' } }] },
      ],
    }),
  ],
});
