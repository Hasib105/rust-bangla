import { load, save, bn, liveStreak, rankOf, today, DAILY_GOAL, type State } from './store';
import { icon } from './icons';

export function toast(title: string, sub = '', ic = 'check') {
  let box = document.getElementById('toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.append(box); }
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span class="toast-ic">${icon(ic, 18)}</span><div>${title}${sub ? `<small>${sub}</small>` : ''}</div>`;
  box.append(t);
  setTimeout(() => t.remove(), 3800);
}

export function confetti(n = 80) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('div');
  c.className = 'confetti';
  const colors = ['#e8590c', '#f5a524', '#1aa260', '#2f6fed', '#7c4dde'];
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
    const notes = kind === 'ok' ? [660, 880] : kind === 'bad' ? [220, 170] : [523, 659, 784, 1046];
    notes.forEach((f, i) => {
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      o.type = kind === 'bad' ? 'square' : 'sine';
      o.frequency.value = f;
      const t = ctx!.currentTime + i * 0.09;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(kind === 'bad' ? 0.04 : 0.12, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(ctx!.destination);
      o.start(t);
      o.stop(t + 0.2);
    });
  } catch {}
}

export function announceBadges(list: { icon: string; name: string }[]) {
  list.forEach((b, i) => setTimeout(() => { toast(`নতুন ব্যাজ: ${b.name}`, 'প্রোফাইলে দেখো', b.icon); sound('win'); }, 600 + i * 900));
}

/** Fills every [data-stat] element on the page from the saved state. */
export function paintStats(s: State = load()) {
  const r = rankOf(s.xp);
  const map: Record<string, string> = {
    xp: bn(s.xp),
    streak: bn(liveStreak(s)),
    done: bn(Object.keys(s.lessons).length),
    rank: r.name,
    level: bn(r.level),
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
    el.style.width = (r.next ? ((s.xp - r.xp) / (r.next.xp - r.xp)) * 100 : 100) + '%';
  });
  document.querySelectorAll<HTMLElement>('[data-rank-next]').forEach((el) => {
    el.textContent = r.next ? `লেভেল ${bn(r.level + 1)} হতে আর ${bn(r.next.xp - s.xp)} XP` : 'সর্বোচ্চ লেভেল';
  });
  document.querySelectorAll<HTMLElement>('[data-sound]').forEach((b) => (b.innerHTML = icon(s.sound ? 'sound' : 'mute', 18)));
}

let lastXp = -1;
function bumpXp(xp: number) {
  if (lastXp >= 0 && xp > lastXp) document.querySelectorAll('.pill').forEach((p) => { p.classList.remove('bump'); void (p as HTMLElement).offsetWidth; p.classList.add('bump'); });
  lastXp = xp;
}

function initTheme() {
  const btns = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');
  const paint = () => btns.forEach((b) => (b.innerHTML = icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon', 18)));
  paint();
  btns.forEach((b) => b.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme !== 'dark';
    if (dark) document.documentElement.dataset.theme = 'dark';
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem('rb-theme', dark ? 'dark' : 'light');
    } catch {}
    paint();
  }));
}

/** Fade + rise the children of [data-reveal] containers as they scroll into view. */
export function initReveal(scope: ParentNode = document) {
  if (!('IntersectionObserver' in window)) return;
  const els = [...scope.querySelectorAll<HTMLElement>('[data-reveal] > *')];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -30px 0px' });
  els.forEach((el) => {
    const idx = [...el.parentElement!.children].indexOf(el);
    el.style.transitionDelay = `${Math.min(idx, 8) * 40}ms`;
    el.classList.add('reveal');
    io.observe(el);
  });
}

export function initChrome() {
  paintStats();
  bumpXp(load().xp);
  initTheme();
  initReveal();
  window.addEventListener('rb:state', (e) => { const s = (e as CustomEvent).detail; bumpXp(s.xp); paintStats(s); });
  document.querySelectorAll<HTMLButtonElement>('[data-sound]').forEach((b) =>
    b.addEventListener('click', () => { const s = load(); s.sound = !s.sound; save(s); }),
  );
}
