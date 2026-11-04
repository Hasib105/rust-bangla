// Progress lives only in this browser (localStorage). No login, no server.
const KEY = 'rust-bangla:v1';

export interface LessonResult { best: number; total: number; stars: number; at: string }
export interface State {
  xp: number;
  lessons: Record<string, LessonResult>; // by lesson slug
  bosses: Record<string, number>; // part id -> best score (of 10)
  exam?: { score: number; total: number; name?: string; at: string };
  streak: { last: string; count: number; max: number };
  daily: Record<string, number>; // YYYY-MM-DD -> xp earned that day
  badges: string[];
  runs: number;
  sound: boolean;
}

const fresh = (): State => ({
  xp: 0, lessons: {}, bosses: {}, streak: { last: '', count: 0, max: 0 }, daily: {}, badges: [], runs: 0, sound: true,
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
  { xp: 0, name: 'ডিম', icon: '🥚' },
  { xp: 150, name: 'ছোট কাঁকড়া', icon: '🦀' },
  { xp: 500, name: 'Borrow শিক্ষার্থী', icon: '📘' },
  { xp: 1200, name: 'Trait কারিগর', icon: '🧩' },
  { xp: 2200, name: 'Fearless কোডার', icon: '⚡' },
  { xp: 3500, name: 'Rustacean', icon: '👑' },
];
export function rankOf(xp: number) {
  let i = 0;
  ranks.forEach((r, k) => { if (xp >= r.xp) i = k; });
  return { ...ranks[i], index: i, next: ranks[i + 1] };
}

// ---------- badges ----------
export const badges: { id: string; icon: string; name: string; desc: string; test: (s: State) => boolean }[] = [
  { id: 'first', icon: '🐣', name: 'প্রথম পা', desc: 'প্রথম পাঠ শেষ করো', test: (s) => Object.keys(s.lessons).length >= 1 },
  { id: 'five', icon: '🖐️', name: 'পাঁচে পাঁচ', desc: '৫টা পাঠ শেষ করো', test: (s) => Object.keys(s.lessons).length >= 5 },
  { id: 'twenty', icon: '🧗', name: 'অর্ধেক পথ', desc: '২০টা পাঠ শেষ করো', test: (s) => Object.keys(s.lessons).length >= 20 },
  { id: 'all', icon: '🏁', name: 'পুরো কোর্স', desc: '৪০টা পাঠই শেষ করো', test: (s) => Object.keys(s.lessons).length >= 40 },
  { id: 'borrow', icon: '🧠', name: 'Borrow Checker-এর বন্ধু', desc: 'Ownership পর্বের বস হারাও', test: (s) => (s.bosses['2'] ?? 0) >= 7 },
  { id: 'fearless', icon: '⚡', name: 'Fearless', desc: 'Concurrency পর্বের বস হারাও', test: (s) => (s.bosses['9'] ?? 0) >= 7 },
  { id: 'boss3', icon: '🐉', name: 'বস শিকারি', desc: '৩টা বস হারাও', test: (s) => Object.values(s.bosses).filter((v) => v >= 7).length >= 3 },
  { id: 'perfect', icon: '⭐', name: 'নিখুঁত', desc: 'কোনো পাঠে ৩ তারা পাও', test: (s) => Object.values(s.lessons).some((l) => l.stars === 3) },
  { id: 'perfect10', icon: '🌟', name: 'তারকা', desc: '১০টা পাঠে ৩ তারা পাও', test: (s) => Object.values(s.lessons).filter((l) => l.stars === 3).length >= 10 },
  { id: 'streak3', icon: '🔥', name: '৩ দিনের আগুন', desc: 'টানা ৩ দিন শেখো', test: (s) => s.streak.max >= 3 },
  { id: 'streak7', icon: '☄️', name: 'সাপ্তাহিক যোদ্ধা', desc: 'টানা ৭ দিন শেখো', test: (s) => s.streak.max >= 7 },
  { id: 'runner', icon: '▶️', name: 'কোড চালাও', desc: '১০ বার কোড Run করো', test: (s) => s.runs >= 10 },
  { id: 'rustacean', icon: '👑', name: 'Rustacean', desc: 'ফাইনাল পরীক্ষায় পাশ করো', test: (s) => !!s.exam && s.exam.score / s.exam.total >= 0.7 },
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
