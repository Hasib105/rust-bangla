// Progress lives only in this browser (localStorage). No login, no server.
const KEY = 'rust-bangla:v2';

export interface LessonResult { best: number; total: number; stars: number; at: string }
export interface State {
  xp: number;
  lessons: Record<string, LessonResult>; // key: "<course>/<slug>"
  bosses: Record<string, number>; // key: "<course>:<part>" -> best score (of 10)
  exams: Record<string, { score: number; total: number; name?: string; at: string }>; // by course
  streak: { last: string; count: number; max: number };
  daily: Record<string, number>; // YYYY-MM-DD -> xp earned that day
  badges: string[];
  runs: number;
  sound: boolean;
}

const fresh = (): State => ({
  xp: 0, lessons: {}, bosses: {}, exams: {}, streak: { last: '', count: 0, max: 0 }, daily: {}, badges: [], runs: 0, sound: true,
});

export function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
  } catch {}
  return fresh();
}

export function save(s: State) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  window.dispatchEvent(new CustomEvent('rb:state', { detail: s }));
}

export function reset() { try { localStorage.removeItem(KEY); } catch {} save(fresh()); }
export function exportState() { return JSON.stringify(load()); }
export function importState(json: string) { const s = { ...fresh(), ...JSON.parse(json) }; save(s); return s; }

export const today = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return today(d); };

/** Streak is alive if the last activity was today or yesterday. */
export function liveStreak(s: State) {
  return s.streak.last === today() || s.streak.last === yesterday() ? s.streak.count : 0;
}

export const DAILY_GOAL = 50;

// ---------- ranks ----------
export const ranks = [
  { xp: 0, name: 'নতুন' },
  { xp: 150, name: 'শিক্ষার্থী' },
  { xp: 500, name: 'Borrow বুঝি' },
  { xp: 1200, name: 'Trait কারিগর' },
  { xp: 2200, name: 'Concurrency যোদ্ধা' },
  { xp: 3500, name: 'Rustacean' },
];
export function rankOf(xp: number) {
  let i = 0;
  ranks.forEach((r, k) => { if (xp >= r.xp) i = k; });
  return { ...ranks[i], index: i, level: i + 1, next: ranks[i + 1] };
}

// ---------- badges ----------
const doneCount = (s: State) => Object.keys(s.lessons).length;
const wonBosses = (s: State) => Object.values(s.bosses).filter((v) => v >= 7).length;
export const badges: { id: string; icon: string; name: string; desc: string; test: (s: State) => boolean }[] = [
  { id: 'first', icon: 'rocket', name: 'প্রথম পা', desc: 'প্রথম পাঠ শেষ করো', test: (s) => doneCount(s) >= 1 },
  { id: 'five', icon: 'book', name: 'পাঁচে পাঁচ', desc: '৫টা পাঠ শেষ করো', test: (s) => doneCount(s) >= 5 },
  { id: 'twenty', icon: 'target', name: 'অর্ধেক পথ', desc: '২০টা পাঠ শেষ করো', test: (s) => doneCount(s) >= 20 },
  { id: 'all', icon: 'trophy', name: 'পুরো কোর্স', desc: '৪০টা পাঠ শেষ করো', test: (s) => doneCount(s) >= 40 },
  { id: 'borrow', icon: 'shield', name: 'Borrow Checker-এর বন্ধু', desc: 'Rust: Ownership চ্যালেঞ্জ জেতো', test: (s) => (s.bosses['rust:2'] ?? 0) >= 7 },
  { id: 'fearless', icon: 'bolt', name: 'Fearless', desc: 'Rust: Concurrency চ্যালেঞ্জ জেতো', test: (s) => (s.bosses['rust:9'] ?? 0) >= 7 },
  { id: 'boss3', icon: 'medal', name: 'চ্যালেঞ্জার', desc: '৩টা পর্ব-চ্যালেঞ্জ জেতো', test: (s) => wonBosses(s) >= 3 },
  { id: 'perfect', icon: 'star', name: 'নিখুঁত', desc: 'কোনো পাঠে ৩ তারা পাও', test: (s) => Object.values(s.lessons).some((l) => l.stars === 3) },
  { id: 'perfect10', icon: 'star', name: 'তারকা', desc: '১০টা পাঠে ৩ তারা পাও', test: (s) => Object.values(s.lessons).filter((l) => l.stars === 3).length >= 10 },
  { id: 'streak3', icon: 'flame', name: '৩ দিন টানা', desc: 'টানা ৩ দিন শেখো', test: (s) => s.streak.max >= 3 },
  { id: 'streak7', icon: 'flame', name: '৭ দিন টানা', desc: 'টানা ৭ দিন শেখো', test: (s) => s.streak.max >= 7 },
  { id: 'runner', icon: 'code', name: 'কোড চালাও', desc: '১০ বার কোড Run করো', test: (s) => s.runs >= 10 },
  { id: 'rustacean', icon: 'crown', name: 'Rustacean', desc: 'Rust ফাইনাল পরীক্ষায় পাশ করো', test: (s) => { const e = s.exams['rust']; return !!e && e.score / e.total >= 0.7; } },
];

/** Adds XP (counts toward streak + daily goal) and returns newly earned badges. */
export function gain(s: State, xp: number) {
  if (xp > 0) {
    s.xp += xp;
    const t = today();
    s.daily[t] = (s.daily[t] ?? 0) + xp;
    if (s.streak.last !== t) {
      s.streak.count = s.streak.last === yesterday() ? s.streak.count + 1 : 1;
      s.streak.last = t;
      s.streak.max = Math.max(s.streak.max, s.streak.count);
    }
  }
  return checkBadges(s);
}

export function checkBadges(s: State) {
  const fresh = badges.filter((b) => !s.badges.includes(b.id) && b.test(s));
  fresh.forEach((b) => s.badges.push(b.id));
  return fresh;
}

const bnDigits = '০১২৩৪৫৬৭৮৯';
export const bn = (n: number | string) => String(n).replace(/\d/g, (d) => bnDigits[+d]);
