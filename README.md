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
- Login uses [better-auth](https://better-auth.com) on our own API route, and the data is stored in Postgres (Neon).
- `src/pages/api/auth/[...all].ts` handles the login routes. `src/pages/api/progress.ts` does the GET and PUT for progress, merging the two states (`src/scripts/merge.ts`). XP is recalculated, so nothing is double-counted.
- `scripts/migrate.mjs` creates the tables. It is safe to re-run, and it runs automatically at the start of every build when `DATABASE_URL` is set.
- To make login required, set `requireLogin: true` in `src/data/courses.ts`.

## Deploy to Vercel (+ Neon)

1. **Create the project:** `npx vercel` (or import the repo in the Vercel dashboard). The framework is detected as Astro.
2. **Add the database:** in the Vercel project, go to Storage → Create → **Neon** (free). This adds `DATABASE_URL` to the project.
3. **Create a GitHub OAuth App** (GitHub → Settings → Developer settings → OAuth Apps → New):
   - Homepage URL: `https://<project>.vercel.app`
   - Authorization callback URL: `https://<project>.vercel.app/api/auth/callback/github`
4. **Set environment variables** in Vercel → Settings → Environment Variables:
   - `BETTER_AUTH_SECRET`: from `openssl rand -hex 32`
   - `BETTER_AUTH_URL`: `https://<project>.vercel.app`
   - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`: from step 3
5. **Deploy:** `npx vercel --prod`. The build creates the tables, then builds the site.

For local work, put the same variables in `.env` (it is git-ignored), with `DATABASE_URL` pointing at any Postgres. Then run `npm run db:migrate` once, followed by `npm run dev`.
