// GitHub sign-in (better-auth on our own Worker) + syncing progress to the account.
import { load, save, type State } from './store';
import { merge } from './merge';
import { icon } from './icons';

const API = import.meta.env.BASE_URL.replace(/\/?$/, '/') + 'api/';
const FLAG = 'rb-account';
type User = { name: string; image?: string | null };
let user: User | null = null;
let applying = false;
let timer: ReturnType<typeof setTimeout> | undefined;

const flag = () => { try { return localStorage.getItem(FLAG) === '1'; } catch { return false; } };
const setFlag = (on: boolean) => { try { on ? localStorage.setItem(FLAG, '1') : localStorage.removeItem(FLAG); } catch {} };

export const currentUser = () => user;

export async function signIn(returnTo = location.pathname) {
  const res = await fetch(API + 'auth/sign-in/social', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ provider: 'github', callbackURL: returnTo + (returnTo.includes('?') ? '&' : '?') + 'signedin=1' }),
  });
  const data = await res.json().catch(() => ({}));
  if (data.url) location.href = data.url;
  else alert('লগইন শুরু করা যায়নি। একটু পরে আবার চেষ্টা করো।');
}

export async function signOut() {
  await fetch(API + 'auth/sign-out', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }).catch(() => {});
  user = null;
  setFlag(false);
  paint();
}

async function push(state: State) {
  const res = await fetch(API + 'progress', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(state) });
  if (res.status === 401) { user = null; setFlag(false); paint(); return; }
  const { state: merged } = await res.json();
  applying = true;
  save({ ...merged, sound: load().sound });
  applying = false;
}

async function init() {
  const fresh = new URLSearchParams(location.search).has('signedin');
  if (fresh) history.replaceState(null, '', location.pathname + location.hash);
  if (fresh || flag()) {
    try {
      const res = await fetch(API + 'progress', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        user = data.user;
        setFlag(true);
        const local = load();
        const mergedLocal = data.state ? merge(data.state, local) : local;
        await push(mergedLocal);
      } else { user = null; setFlag(false); }
    } catch { /* offline: keep playing locally */ }
  }
  paint();
  window.addEventListener('rb:state', (e) => {
    if (applying || !user) return;
    clearTimeout(timer);
    timer = setTimeout(() => push((e as CustomEvent).detail), 1200);
  });
}

function paint() {
  document.querySelectorAll<HTMLElement>('[data-account]').forEach((el) => {
    if (user) {
      el.innerHTML = user.image
        ? `<a href="${import.meta.env.BASE_URL.replace(/\/?$/, '/')}profile/" title="${user.name}"><img class="avatar" src="${user.image}" alt="" width="32" height="32"></a>`
        : `<a class="iconbtn" href="${import.meta.env.BASE_URL.replace(/\/?$/, '/')}profile/">${icon('user', 18)}</a>`;
    } else {
      el.innerHTML = `<button class="btn sm alt login-btn">${icon('github', 17)}<span>লগইন</span></button>`;
      el.querySelector('button')!.onclick = () => signIn();
    }
  });
  document.querySelectorAll<HTMLElement>('[data-account-panel]').forEach((el) => {
    if (user) {
      el.innerHTML = `<div class="acct">${user.image ? `<img class="avatar lg" src="${user.image}" alt="">` : ''}<div><b>${user.name}</b><small>${icon('cloud', 15)} GitHub অ্যাকাউন্টে অগ্রগতি সেভ হচ্ছে, সব ডিভাইসে একই থাকবে।</small></div><button class="btn sm alt" id="signout">${icon('logout', 16)} লগআউট</button></div>`;
      el.querySelector<HTMLButtonElement>('#signout')!.onclick = () => signOut();
    } else {
      el.innerHTML = `<div class="acct"><div><b>লগইন করা নেই</b><small>এখন অগ্রগতি শুধু এই ব্রাউজারে আছে। GitHub দিয়ে লগইন করলে সব ডিভাইসে সেভ থাকবে।</small></div><button class="btn sm" id="signin">${icon('github', 17)} GitHub দিয়ে লগইন</button></div>`;
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
