// ▶ Run buttons on lesson code. Code is sent to the official Rust Playground (play.rust-lang.org).
import { load, save, gain } from './store';
import { announceBadges } from './ui';

const API = 'https://play.rust-lang.org/execute';

async function execute(code: string) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel: 'stable', mode: 'debug', edition: '2024', crateType: 'bin', tests: false, code, backtrace: false }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as { success: boolean; stdout: string; stderr: string };
}

/** Keep the useful part of cargo's stderr: drop the "Compiling/Finished/Running" noise. */
function cleanStderr(s: string) {
  return s
    .split('\n')
    .filter((l) => !/^\s*(Compiling|Finished|Running|Blocking|Updating|Downloaded|Downloading)\b/.test(l))
    .join('\n')
    .trim();
}

export function initRunners(scope: ParentNode = document) {
  // a ```text block right after a runnable rust block is that program's output
  scope.querySelectorAll<HTMLPreElement>('pre.out').forEach((o) => {
    const prev = o.previousElementSibling;
    if (prev?.matches('pre[data-run]:not([data-fail])')) o.classList.add('is-output');
  });
  scope.querySelectorAll<HTMLPreElement>('pre[data-run]').forEach((pre) => {
    if (pre.dataset.wired) return;
    pre.dataset.wired = '1';
    const original = pre.querySelector('code')?.innerHTML ?? '';
    const tools = document.createElement('div');
    tools.className = 'code-tools';
    tools.innerHTML = `
      <button class="edit" type="button">✏️ এডিট</button>
      <button class="reset" type="button" hidden>↺ আগের মতো</button>
      <button class="copy" type="button">📋 কপি</button>
      <button class="run" type="button">▶ চালাও</button>`;
    pre.after(tools);
    const out = document.createElement('div');
    out.className = 'run-out';
    out.hidden = true;
    tools.after(out);

    const code = () => (pre.querySelector('code') ?? pre).textContent ?? '';
    const run = tools.querySelector<HTMLButtonElement>('.run')!;
    const edit = tools.querySelector<HTMLButtonElement>('.edit')!;
    const reset = tools.querySelector<HTMLButtonElement>('.reset')!;

    edit.onclick = () => {
      const on = pre.getAttribute('contenteditable') !== 'true';
      pre.setAttribute('contenteditable', on ? 'true' : 'false');
      pre.spellcheck = false;
      edit.textContent = on ? '✔ এডিট শেষ' : '✏️ এডিট';
      reset.hidden = false;
      if (on) pre.focus();
    };
    reset.onclick = () => {
      const c = pre.querySelector('code');
      if (c) c.innerHTML = original;
      pre.setAttribute('contenteditable', 'false');
      edit.textContent = '✏️ এডিট';
      reset.hidden = true;
      out.hidden = true;
    };
    tools.querySelector<HTMLButtonElement>('.copy')!.onclick = async (e) => {
      const b = e.currentTarget as HTMLButtonElement;
      try { await navigator.clipboard.writeText(code()); b.textContent = '✔ কপি হয়েছে'; } catch { b.textContent = '✗'; }
      setTimeout(() => (b.textContent = '📋 কপি'), 1500);
    };
    run.onclick = async () => {
      run.disabled = true;
      run.textContent = '⏳ চলছে...';
      out.hidden = false;
      out.className = 'run-out';
      out.innerHTML = '<span class="lbl">compile হচ্ছে (Rust Playground)...</span>';
      try {
        const r = await execute(code());
        const err = cleanStderr(r.stderr);
        out.className = 'run-out' + (r.success ? '' : ' err');
        out.innerHTML = '';
        const lbl = document.createElement('span');
        lbl.className = 'lbl';
        lbl.textContent = r.success ? '✅ আউটপুট' : '❌ compiler বলছে';
        out.append(lbl, document.createTextNode(r.success ? r.stdout || '(কিছু print হয়নি)' : err || r.stdout));
        if (r.success && err) {
          const w = document.createElement('div');
          w.style.cssText = 'color:#f2b134;margin-top:8px';
          w.textContent = err;
          out.append(w);
        }
        const s = load();
        s.runs++;
        announceBadges(gain(s, 0));
        save(s);
      } catch (e) {
        out.className = 'run-out err';
        out.textContent = `Playground-এ পৌঁছানো যায়নি (${(e as Error).message})। ইন্টারনেট চেক করে আবার চেষ্টা করো।`;
      } finally {
        run.disabled = false;
        run.textContent = '▶ চালাও';
      }
    };
  });
}
