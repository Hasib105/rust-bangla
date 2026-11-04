# Rust বাংলা

A free, gamified Rust course in Bangla, from zero to advanced. It needs no login. Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build).

- **A multi-course platform.** It starts with **Rust** (40 short lessons in 10 parts, from zero to async), and Axum and Actix are next.
- **Brilliant-style lessons:** each lesson plays as short cards with a question every card or two. You can also do just the questions, or read the whole text.
- **5 question types:** choice, true/false, order the lines, fill the blank, and tap the error line. Wrong answers come back at the end.
- **XP, levels, daily streak, daily goal and badges.** Each part ends with a **challenge** (10 random questions, 7 to win). Each course has a **final exam** of 30 questions, and passing gives a printable certificate.
- **▶ Run / ✏️ Edit** on every Rust example. It runs on the official Rust Playground.
- Progress is saved in `localStorage` only. A backup code on the profile page moves progress between devices.
- **Docs** live at `/docs/` (Starlight, with Bangla search via Pagefind).

## Develop

```bash
npm install
npm run dev            # http://localhost:4321/  (course at /rust/)
npm run preview        # build + run the real Cloudflare Worker locally (login + sync, local D1)
npm run build          # -> dist/
npm run check:content  # compiles + runs every Rust block, checks every quiz (needs rustc)
```



## Where things go

| what | where |
|---|---|
| Courses list and parts | `src/data/courses.ts` |
| Lessons (Bangla markdown) | `src/content/courses/<course>/lessons/NN-slug.md` |
| Quizzes | `src/content/courses/<course>/quizzes/NN-slug.json` |
| Your documentation | `src/content/docs/docs/*.md`, which appears automatically in the docs sidebar |
| Game logic (XP, badges, streak) | `src/scripts/store.ts` |

Read **CONTENT_GUIDE.md** before writing or editing a lesson.

## Accounts (GitHub login)

Learners can play as guests, with progress saved in the browser, or sign in with GitHub to sync their progress across devices.
- Login is handled by [better-auth](https://better-auth.com) running on our own Cloudflare Worker, and progress is stored in Cloudflare D1. There is no third-party auth service.
- `src/pages/api/auth/[...all].ts` handles the login routes. `src/pages/api/progress.ts` does the GET and PUT for progress, merging the two states (`src/scripts/merge.ts`).
- To make login required, set `requireLogin: true` in `src/data/courses.ts`.

## Deploy to Cloudflare (free plan)

1. **Log in to Cloudflare:** `npx wrangler login`
2. **Create the database:** `npx wrangler d1 create rust-bangla`. Copy the printed `database_id` into `wrangler.jsonc`.
3. **Create the tables:** `npm run db:migrate`
4. **Create a GitHub OAuth App** (GitHub → Settings → Developer settings → OAuth Apps → New):
   - Homepage URL: `https://rust-bangla.<your-subdomain>.workers.dev`, or your own domain
   - Authorization callback URL: `https://<same host>/api/auth/callback/github`
5. **Set the secrets:**
   ```bash
   openssl rand -hex 32 | npx wrangler secret put BETTER_AUTH_SECRET
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   ```
6. **Deploy:** `SITE_URL=https://<same host> npm run deploy`

For local work, put the same three values in `.dev.vars` (it is git-ignored). Run `npm run db:migrate:local` once, then `npm run preview`.
