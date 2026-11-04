import { load, save, bn, liveStreak, rankOf, today, DAILY_GOAL, type State } from './store';

export function toast(title: string, sub = '') {
  let box = document.getElementById('toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.append(box); }
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `${title}${sub ? `<small>${sub}</small>` : ''}`;
  box.append(t);
  setTimeout(() => t.remove(), 3800);
}

export function confetti(n = 90) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('div');
  c.className = 'confetti';
  const colors = ['#ff7a2f', '#f2b134', '#4cc38a', '#3fb8e0', '#e05fa0', '#fff'];
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + 'vw';
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = 1.6 + Math.random() * 1.8 + 's';
    p.style.animationDelay = Math.random() * 0.4 + 's';
    c.append(p);
  }
  document.body.append(c);
  setTimeout(() => c.remove(), 4200);
}

let ctx: AudioContext | undefined;
export function sound(kind: 'ok' | 'bad' | 'win') {
  if (!load().sound) return;
  try {
    ctx ??= new AudioContext();
    const notes = kind === 'ok' ? [660, 880] : kind === 'bad' ? [220, 160] : [523, 659, 784, 1046];
    notes.forEach((f, i) => {
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      o.type = kind === 'bad' ? 'sawtooth' : 'triangle';
      o.frequency.value = f;
      const t = ctx!.currentTime + i * 0.09;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(ctx!.destination);
      o.start(t);
      o.stop(t + 0.2);
    });
  } catch {}
}

export function announceBadges(list: { icon: string; name: string }[]) {
  list.forEach((b, i) => setTimeout(() => { toast(`${b.icon} নতুন ব্যাজ: ${b.name}`, 'প্রোফাইলে দেখো'); sound('win'); }, 600 + i * 900));
}

/** Fills every [data-stat] element on the page from the saved state. */
export function paintStats(s: State = load()) {
  const r = rankOf(s.xp);
  const done = Object.keys(s.lessons).length;
  const map: Record<string, string> = {
    xp: bn(s.xp),
    streak: bn(liveStreak(s)),
    done: bn(done),
    rank: r.name,
    rankIcon: r.icon,
    daily: bn(Math.min(s.daily[today()] ?? 0, DAILY_GOAL)),
  };
  document.querySelectorAll<HTMLElement>('[data-stat]').forEach((el) => {
    const v = map[el.dataset.stat!];
    if (v !== undefined) el.textContent = v;
  });
  document.querySelectorAll<HTMLElement>('[data-daily-bar]').forEach((el) => {
    el.style.width = Math.min(100, ((s.daily[today()] ?? 0) / DAILY_GOAL) * 100) + '%';
  });
  document.querySelectorAll<HTMLElement>('[data-rank-bar]').forEach((el) => {
    const pct = r.next ? ((s.xp - r.xp) / (r.next.xp - r.xp)) * 100 : 100;
    el.style.width = pct + '%';
  });
  document.querySelectorAll<HTMLElement>('[data-rank-next]').forEach((el) => {
    el.textContent = r.next ? `${r.next.icon} ${r.next.name} হতে আর ${bn(r.next.xp - s.xp)} XP` : 'সর্বোচ্চ র‍্যাঙ্ক! 👑';
  });
  document.querySelectorAll<HTMLButtonElement>('[data-sound]').forEach((b) => (b.textContent = s.sound ? '🔊' : '🔇'));
}

export function initChrome() {
  paintStats();
  window.addEventListener('rb:state', (e) => paintStats((e as CustomEvent).detail));
  document.querySelectorAll<HTMLButtonElement>('[data-sound]').forEach((b) =>
    b.addEventListener('click', () => { const s = load(); s.sound = !s.sound; save(s); }),
  );
}
