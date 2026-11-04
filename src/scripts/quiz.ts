import { bn } from './store';
import { sound } from './ui';

export interface Card {
  type: 'choice' | 'truefalse' | 'order' | 'fill' | 'line';
  q: string;
  codeHtml?: string;
  options?: string[];
  answer?: number | number[] | boolean | string[];
  lines?: string[];
  explain: string;
  from?: string; // lesson title (boss / exam mode)
}

export interface QuizResult { firstTry: number; total: number; missed: Card[] }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** Escape, then turn `code` into <code>. */
export const md = (s: string) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const norm = (s: string) => s.replace(/\s+/g, '').replace(/;$/, '');

/**
 * Runs a quiz inside `root`.
 * requeue: a wrong card comes back at the end (lesson mode). Without it, each card is asked once (boss / exam).
 */
export function runQuiz(root: HTMLElement, cards: Card[], opts: { requeue: boolean; onFinish: (r: QuizResult) => void; onClose?: () => void }) {
  const queue = cards.map((c, i) => ({ c, i }));
  const firstWrong = new Set<number>();
  const solved = new Set<number>();
  let combo = 0;
  let pos = 0;

  root.innerHTML = `
    <div class="qz">
      <div class="qz-top">
        <button class="qz-x" aria-label="বন্ধ করো" title="বন্ধ করো">✕</button>
        <div class="qz-bar"><i></i></div>
        <div class="qz-combo" hidden>🔥 <b></b></div>
      </div>
      <div class="qz-body"></div>
      <div class="qz-foot">
        <div class="qz-fb" hidden></div>
        <button class="btn qz-go" disabled>চেক করো</button>
      </div>
    </div>`;
  const body = root.querySelector<HTMLElement>('.qz-body')!;
  const bar = root.querySelector<HTMLElement>('.qz-bar i')!;
  const go = root.querySelector<HTMLButtonElement>('.qz-go')!;
  const fb = root.querySelector<HTMLElement>('.qz-fb')!;
  const comboEl = root.querySelector<HTMLElement>('.qz-combo')!;
  root.querySelector('.qz-x')!.addEventListener('click', () => opts.onClose?.());

  let getAnswer: () => unknown = () => null;
  let checked = false;
  let current: { c: Card; i: number };

  const progress = () => { bar.style.width = (solved.size / cards.length) * 100 + '%'; };

  function render() {
    checked = false;
    fb.hidden = true;
    fb.className = 'qz-fb';
    go.textContent = 'চেক করো';
    go.className = 'btn qz-go';
    go.disabled = true;
    current = queue[pos];
    const { c, i } = current;
    const retry = firstWrong.has(i);
    body.innerHTML = `
      <div class="qz-meta">${retry ? '🔁 আবার চেষ্টা' : `প্রশ্ন ${bn(Math.min(solved.size + 1, cards.length))} / ${bn(cards.length)}`}${c.from ? ` · <span>${esc(c.from)}</span>` : ''}</div>
      <h3 class="qz-q">${md(c.q)}</h3>
      ${c.codeHtml && c.type !== 'line' ? `<div class="q-code">${c.codeHtml}</div>` : ''}
      <div class="qz-ui"></div>`;
    const ui = body.querySelector<HTMLElement>('.qz-ui')!;
    const ready = (ok: boolean) => { go.disabled = !ok; };

    if (c.type === 'choice') {
      ui.className = 'qz-ui opts';
      c.options!.forEach((o, k) => {
        const b = document.createElement('button');
        b.className = 'opt';
        b.innerHTML = `<kbd>${bn(k + 1)}</kbd><span>${md(o)}</span>`;
        b.onclick = () => { if (checked) return; ui.querySelectorAll('.opt').forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); ready(true); };
        ui.append(b);
      });
      getAnswer = () => [...ui.children].findIndex((x) => x.classList.contains('sel'));
    } else if (c.type === 'truefalse') {
      ui.className = 'qz-ui tf';
      [['সত্য', true], ['মিথ্যা', false]].forEach(([label, val], k) => {
        const b = document.createElement('button');
        b.className = 'opt';
        b.dataset.v = String(val);
        b.innerHTML = `<kbd>${bn(k + 1)}</kbd><span>${label === 'সত্য' ? '✅' : '❌'} ${label}</span>`;
        b.onclick = () => { if (checked) return; ui.querySelectorAll('.opt').forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); ready(true); };
        ui.append(b);
      });
      getAnswer = () => { const s = ui.querySelector<HTMLElement>('.sel'); return s ? s.dataset.v === 'true' : null; };
    } else if (c.type === 'fill') {
      ui.className = 'qz-ui fill';
      ui.innerHTML = `<label>ফাঁকা জায়গায় (<code>___</code>) কী বসবে?<input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="এখানে লেখো..."></label>`;
      const inp = ui.querySelector('input')!;
      inp.addEventListener('input', () => ready(inp.value.trim().length > 0));
      setTimeout(() => inp.focus({ preventScroll: true }), 50);
      getAnswer = () => inp.value;
      body.querySelectorAll('.q-code .line').forEach((l) => { l.innerHTML = l.innerHTML.replace('___', '<mark class="blank">___</mark>'); });
    } else if (c.type === 'line') {
      ui.className = 'qz-ui lines';
      ui.innerHTML = `<div class="q-code tap">${c.codeHtml}</div><p class="muted hint">👆 যে লাইনে error, সেটায় ট্যাপ করো</p>`;
      const ls = [...ui.querySelectorAll<HTMLElement>('.line')];
      ls.forEach((l, k) => {
        l.dataset.n = bn(k + 1);
        l.onclick = () => { if (checked) return; ls.forEach((x) => x.classList.remove('sel')); l.classList.add('sel'); ready(true); };
      });
      getAnswer = () => ls.findIndex((x) => x.classList.contains('sel')) + 1;
    } else if (c.type === 'order') {
      ui.className = 'qz-ui order';
      ui.innerHTML = `<ol class="slots"></ol><div class="pool"></div>`;
      const slots = ui.querySelector<HTMLElement>('.slots')!;
      const pool = ui.querySelector<HTMLElement>('.pool')!;
      let items = shuffle(c.lines!);
      if (items.join() === c.lines!.join()) items = items.reverse();
      items.forEach((t) => {
        const chip = document.createElement('button');
        chip.className = 'chip';
        chip.innerHTML = md(t);
        chip.dataset.t = t;
        chip.onclick = () => {
          if (checked) return;
          (chip.parentElement === pool ? slots : pool).append(chip);
          ready(pool.children.length === 0);
        };
        pool.append(chip);
      });
      getAnswer = () => [...slots.children].map((x) => (x as HTMLElement).dataset.t);
    }
  }

  function isRight(c: Card, a: unknown) {
    switch (c.type) {
      case 'choice': return a === c.answer;
      case 'line': return ([] as number[]).concat(c.answer as number | number[]).includes(a as number);
      case 'truefalse': return a === c.answer;
      case 'fill': return (c.answer as string[]).some((x) => norm(x) === norm(String(a)));
      case 'order': return JSON.stringify(a) === JSON.stringify(c.lines);
    }
  }

  function showCorrect(c: Card) {
    const ui = body.querySelector<HTMLElement>('.qz-ui')!;
    if (c.type === 'choice') ui.children[c.answer as number]?.classList.add('right');
    if (c.type === 'truefalse') ui.querySelector(`[data-v="${c.answer}"]`)?.classList.add('right');
    if (c.type === 'line') ([] as number[]).concat(c.answer as number | number[]).forEach((n) => ui.querySelectorAll('.line')[n - 1]?.classList.add('right'));
  }

  function check() {
    const { c, i } = current;
    const ok = isRight(c, getAnswer());
    checked = true;
    showCorrect(c);
    const sel = body.querySelector('.sel');
    if (!ok && sel) sel.classList.add('wrong');
    let right = '';
    if (!ok && c.type === 'fill') right = `<div class="ans">সঠিক উত্তর: <code>${esc((c.answer as string[])[0])}</code></div>`;
    if (!ok && c.type === 'order') right = `<div class="ans">সঠিক ক্রম:<ol>${c.lines!.map((l) => `<li>${md(l)}</li>`).join('')}</ol></div>`;
    if (ok) {
      solved.add(i);
      combo++;
      sound('ok');
    } else {
      combo = 0;
      sound('bad');
      if (!firstWrong.has(i)) firstWrong.add(i);
      if (opts.requeue) queue.push({ c, i });
      else solved.add(i);
    }
    comboEl.hidden = combo < 2;
    comboEl.querySelector('b')!.textContent = `${bn(combo)} কম্বো`;
    const praise = ['দারুণ!', 'একদম ঠিক!', 'চমৎকার!', 'ঠিক ধরেছো!', 'বাহ!'];
    fb.hidden = false;
    fb.className = `qz-fb ${ok ? 'ok' : 'bad'}`;
    fb.innerHTML = `<b>${ok ? '✅ ' + praise[Math.floor(Math.random() * praise.length)] : '❌ ঠিক হয়নি'}</b>${right}<p>${md(c.explain)}</p>`;
    go.textContent = 'পরের প্রশ্ন →';
    go.className = `btn qz-go ${ok ? 'green' : 'red'}`;
    go.disabled = false;
    progress();
  }

  go.addEventListener('click', () => {
    if (!checked) return check();
    pos++;
    if (pos >= queue.length) {
      opts.onFinish({ firstTry: cards.length - firstWrong.size, total: cards.length, missed: [...firstWrong].map((i) => cards[i]) });
      return;
    }
    render();
  });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !go.disabled) { e.preventDefault(); go.click(); return; }
    const n = Number(e.key);
    if (!checked && n >= 1 && n <= 4 && !(e.target instanceof HTMLInputElement)) {
      (body.querySelectorAll<HTMLButtonElement>('.opts .opt, .tf .opt')[n - 1])?.click();
    }
  });
  root.tabIndex = -1;
  render();
  progress();
  root.focus({ preventScroll: true });
}

export const starsFor = (firstTry: number, total: number) => (firstTry / total >= 0.9 ? 3 : firstTry / total >= 0.7 ? 2 : 1);
