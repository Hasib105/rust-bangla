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
npm run dev            # http://localhost:4321/rust-bangla/  (course at /rust-bangla/rust/)
npm run build          # -> dist/
npm run check:content  # compiles + runs every Rust block, checks every quiz (needs rustc)
```

Set `BASE_PATH` and `SITE_URL` when hosting somewhere other than a `/rust-bangla/` subpath. For example, `BASE_PATH=/ SITE_URL=https://rustbangla.com npm run build`.

## Where things go

| what | where |
|---|---|
| Courses list and parts | `src/data/courses.ts` |
| Lessons (Bangla markdown) | `src/content/courses/<course>/lessons/NN-slug.md` |
| Quizzes | `src/content/courses/<course>/quizzes/NN-slug.json` |
| Your documentation | `src/content/docs/docs/*.md`, which appears automatically in the docs sidebar |
| Game logic (XP, badges, streak) | `src/scripts/store.ts` |

Read **CONTENT_GUIDE.md** before writing or editing a lesson.
