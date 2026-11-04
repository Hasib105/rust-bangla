// GitHub sign-in (better-auth) + syncing progress to the account, with as few server calls as possible:
//  - page views: no request at all while the last sync is < 15 min old (cached in sessionStorage)
//  - saves: one PUT, only when the progress actually changed (finished lesson / challenge / exam)
import { load, save, type State } from './store';
import { merge } from './merge';
import { icon } from './icons';

const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');
const API = BASE + 'api/';
// Login must start on the production host (the GitHub OAuth callback lives there).
const CANONICAL = (() => { try { return new URL(import.meta.env.SITE).origin; } catch { return location.origin; } })();
const FLAG = 'rb-account';
const CACHE = 'rb-sync'; // sessionStorage: { at, user, sig }
const FRESH_MS = 15 * 60 * 1000;

type User = { name: string; image?: string | null };
type Event = { kind: 'lesson' | 'challenge' | 'exam'; ref: string; mode?: string; score: number; total: number };
let user: User | null = null;
let applying = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let lastSig = '';
const pending: Event[] = [];

const ls = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string | null) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
};
const ss = {
  get: () => { try { return JSON.parse(sessionStorage.getItem(CACHE) || 'null'); } catch { return null; } },
  set: (v: unknown) => { try { v === null ? sessionStorage.removeItem(CACHE) : sessionStorage.setItem(CACHE, JSON.stringify(v)); } catch {} },
};

/** What matters for syncing (ignores sound and other local-only settings). */
const sig = (s: State) => JSON.stringify([s.lessons, s.bosses, s.exams, s.streak, s.badges, s.runs]);

export const currentUser = () => user;

export async function signIn(returnTo = location.pathname) {
  if (location.origin !== CANONICAL) {
    location.href = `${CANONICAL}${BASE}profile/?login=1&next=${encodeURIComponent(returnTo)}`;
    return;
  }
  const res = await fetch(API + 'auth/sign-in/social', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ provider: 'github', callbackURL: returnTo + (returnTo.includes('?') ? '&' : '?') + 'signedin=1', errorCallbackURL: BASE + 'profile/?loginerror=1' }),
  });
  const data = await res.json().catch(() => ({}));
  if (data.url) location.href = data.url;
  else alert('লগইন শুরু করা যায়নি। একটু পরে আবার চেষ্টা করো।');
}

export async function signOut() {
  await fetch(API + 'auth/sign-out', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }).catch(() => {});
  user = null;
  ls.set(FLAG, null);
  ss.set(null);
  paint();
}

/** Record a finished lesson / challenge / exam; sent with the next save. */
export function track(e: Event) {
  if (!user) return;
  pending.push(e);
  schedule(0);
}

function schedule(ms: number) {
  clearTimeout(timer);
  timer = setTimeout(() => push(load()), ms);
}

async function push(state: State) {
  if (!user) return;
  const s = sig(state);
  if (s === lastSig && !pending.length) return; // nothing new
  const events = pending.splice(0);
  try {
    const res = await fetch(API + 'progress', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ state, events }), keepalive: true });
    if (res.status === 401) { user = null; ls.set(FLAG, null); ss.set(null); paint(); return; }
    if (!res.ok) { pending.unshift(...events); return; }
    const { state: merged } = await res.json();
    applying = true;
    save({ ...merged, sound: load().sound });
    applying = false;
    lastSig = sig(merged);
    ss.set({ at: Date.now(), user, sig: lastSig });
  } catch {
    pending.unshift(...events); // offline: retry with the next save
  }
}

async function init() {
  const q = new URLSearchParams(location.search);
  const fresh = q.has('signedin');
  if (q.has('login') && !ls.get(FLAG)) { await signIn(q.get('next') || BASE); return; }
  if (q.has('loginerror')) alert('লগইন শেষ হয়নি। আবার "লগইন" চাপো (একটা ট্যাবেই)।');
  if (fresh || q.has('login') || q.has('loginerror')) history.replaceState(null, '', location.pathname + location.hash);

  if (fresh || ls.get(FLAG)) {
    const cached = ss.get();
    if (!fresh && cached && Date.now() - cached.at < FRESH_MS && cached.user) {
      user = cached.user; // recent sync in this tab session: no request
      lastSig = cached.sig;
    } else {
      try {
        const res = await fetch(API + 'progress', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          user = data.user;
          ls.set(FLAG, '1');
          const local = load();
          if (data.state) {
            lastSig = sig(data.state);
            const merged = merge(data.state, local);
            if (sig(merged) === lastSig) {
              applying = true; save({ ...merged, sound: local.sound }); applying = false;
              ss.set({ at: Date.now(), user, sig: lastSig });
            } else await push(merged); // this browser has something new
          } else await push(local);
        } else { user = null; ls.set(FLAG, null); ss.set(null); }
      } catch { /* offline: keep playing locally */ }
    }
  }
  paint();
  window.addEventListener('rb:state', () => { if (!applying && user) schedule(1500); });
  // don't lose a pending save when the tab closes
  addEventListener('pagehide', () => { if (user && (pending.length || sig(load()) !== lastSig)) push(load()); });
}

function paint() {
  document.querySelectorAll<HTMLElement>('[data-account]').forEach((el) => {
    if (user) {
      el.innerHTML = user.image
        ? `<a href="${BASE}profile/" title="${user.name}"><img class="avatar" src="${user.image}" alt="" width="32" height="32"></a>`
        : `<a class="iconbtn" href="${BASE}profile/">${icon('user', 18)}</a>`;
    } else {
      el.innerHTML = `<button class="btn sm alt login-btn">${icon('github', 17)}<span>লগইন</span></button>`;
      el.querySelector('button')!.onclick = () => signIn();
    }
  });
  document.querySelectorAll<HTMLElement>('[data-account-panel]').forEach((el) => {
    if (user) {
      el.innerHTML = `<div class="acct">${user.image ? `<img class="avatar lg" src="${user.image}" alt="">` : ''}<div><b>${user.name}</b><small>${icon('cloud', 15)} তোমার অগ্রগতি অ্যাকাউন্টে সেভ হচ্ছে, সব ডিভাইসে একই থাকবে।</small></div><button class="btn sm alt" id="signout">${icon('logout', 16)} লগআউট</button></div>`;
      el.querySelector<HTMLButtonElement>('#signout')!.onclick = () => signOut();
    } else {
      el.innerHTML = `<div class="acct"><div><b>লগইন করা নেই</b><small>এখন অগ্রগতি শুধু এই ব্রাউজারে আছে। GitHub দিয়ে লগইন করলে অ্যাকাউন্টে সেভ থাকবে।</small></div><button class="btn sm" id="signin">${icon('github', 17)} GitHub দিয়ে লগইন</button></div>`;
      el.querySelector<HTMLButtonElement>('#signin')!.onclick = () => signIn();
    }
  });
  window.dispatchEvent(new CustomEvent('rb:account', { detail: user }));
}

/** For site.requireLogin: true if the learner may play now; otherwise starts sign-in. */
export function ensureLogin(required: boolean) {
  if (!required || user) return true;
  if (confirm('খেলতে GitHub দিয়ে লগইন করতে হবে। এখন লগইন করবে?')) signIn();
  return false;
}

init();
