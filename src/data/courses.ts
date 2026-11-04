// Every course on the site. To add a course (e.g. Axum):
//   1. add an entry here with status 'live' and its parts
//   2. put lessons in src/content/courses/<id>/lessons/NN-slug.md
//      and quizzes in src/content/courses/<id>/quizzes/NN-slug.json
export interface Part { id: number; title: string; subtitle: string }
export interface Course {
  id: string;
  title: string;
  tagline: string; // one Bangla line
  description: string;
  level: string;
  color: string; // accent used on the course card
  status: 'live' | 'soon';
  parts: Part[];
}

export const courses: Course[] = [
  {
    id: 'rust',
    title: 'Rust',
    tagline: 'শূন্য থেকে Advanced',
    description: 'variable থেকে ownership, trait, smart pointer, concurrency আর async পর্যন্ত। ছোট পাঠ, প্রতিটা পাঠ শেষে খেলা।',
    level: 'শুরু থেকে',
    color: '#e8590c',
    status: 'live',
    parts: [
      { id: 1, title: 'শুরু', subtitle: 'Rust বসানো, প্রথম প্রোগ্রাম, variable, type, function, loop' },
      { id: 2, title: 'Ownership', subtitle: 'Rust-এর মূল ধারণা: move, borrow, slice' },
      { id: 3, title: 'ডেটা সাজানো', subtitle: 'struct, enum, Option, Vec, String, HashMap' },
      { id: 4, title: 'Error আর Module', subtitle: 'Result, ? অপারেটর, module, Cargo' },
      { id: 5, title: 'Generic আর Trait', subtitle: 'generic, trait, derive, lifetime, dyn Trait' },
      { id: 6, title: 'Functional Rust', subtitle: 'closure আর iterator' },
      { id: 7, title: 'Smart Pointer', subtitle: 'Box, Drop, Rc, RefCell, Weak' },
      { id: 8, title: 'Advanced Rust', subtitle: 'pattern, macro, test, unsafe' },
      { id: 9, title: 'Concurrency', subtitle: 'thread, channel, Mutex, Arc, async' },
      { id: 10, title: 'প্রজেক্ট', subtitle: 'CLI টুল, multi-thread প্রজেক্ট, ইকোসিস্টেম' },
    ],
  },
  {
    id: 'axum',
    title: 'Axum',
    tagline: 'Rust দিয়ে web API',
    description: 'routing, extractor, state, middleware, database আর deploy।',
    level: 'Rust জানার পরে',
    color: '#2f6fed',
    status: 'soon',
    parts: [],
  },
  {
    id: 'actix',
    title: 'Actix Web',
    tagline: 'দ্রুত web server',
    description: 'handler, routing, actor মডেল, websocket আর production সেটআপ।',
    level: 'Rust জানার পরে',
    color: '#7c4dde',
    status: 'soon',
    parts: [],
  },
];

export const liveCourses = courses.filter((c) => c.status === 'live');
export const courseById = (id: string) => courses.find((c) => c.id === id)!;

export const site = {
  name: 'Rust বাংলা',
  // true: learners must sign in with GitHub before playing. false: play as a guest, sign in to sync.
  requireLogin: false,
  youtube: 'https://www.youtube.com/@RustBangla',
};
