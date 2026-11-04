# Rust বাংলা

A free, gamified Rust course in Bangla, from zero to advanced. It needs no login. Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build).

- **40 short lessons** in 10 parts: basics, ownership, data, errors and modules, generics and traits, closures and iterators, smart pointers, advanced Rust, concurrency and async, and projects.
- **A quiz game after every lesson** with 5 card types: choice, true/false, order the lines, fill the blank, and tap the error line. Wrong answers come back at the end.
- **XP, ranks, daily streak, daily goal and 13 badges.** Each part ends with a **boss fight** (10 random questions, 7 to win). The **final exam** has 30 questions, and passing gives a printable certificate.
- **▶ Run / ✏️ Edit** on every Rust example. It runs on the official Rust Playground.
- Progress is saved in `localStorage` only. A backup code on the profile page moves progress between devices.
- **Docs** live at `/docs/` (Starlight, with Bangla search via Pagefind).
- Lessons link to the matching videos from the Rust Bangla YouTube channel.

## Develop

```bash
npm install
npm run dev            # http://localhost:4321/rust-bangla/
npm run build          # -> dist/
npm run check:content  # compiles + runs every Rust block, checks every quiz (needs rustc)
```

Set `BASE_PATH` and `SITE_URL` when hosting somewhere other than a `/rust-bangla/` subpath. For example, `BASE_PATH=/ SITE_URL=https://rustbangla.com npm run build`.

## Where things go

| what | where |
|---|---|
| Lessons (Bangla markdown) | `src/content/lessons/NN-slug.md` |
| Quizzes | `src/content/quizzes/NN-slug.json` |
| Your documentation | `src/content/docs/docs/*.md`, which appears automatically in the docs sidebar |
| Parts and channel links | `src/data/parts.ts` |
| Game logic (XP, badges, streak) | `src/scripts/store.ts` |

Read **CONTENT_GUIDE.md** before writing or editing a lesson.
