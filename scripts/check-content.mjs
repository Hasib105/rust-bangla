#!/usr/bin/env node
// Compiles and runs every Rust block in the lessons, and sanity-checks every quiz.
//   node scripts/check-content.mjs            # all lessons
//   node scripts/check-content.mjs 07 08      # only ids starting with these prefixes
// Needs `rustc` on PATH (rustup.rs). Exit code 1 on any problem.
import { readFileSync, readdirSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const root = new URL('..', import.meta.url).pathname;
const lessonsDir = join(root, 'src/content/lessons');
const quizDir = join(root, 'src/content/quizzes');
const filters = process.argv.slice(2);
const rustc = process.env.RUSTC || 'rustc';

let problems = 0;
const fail = (where, msg) => { problems++; console.log(`✗ ${where}: ${msg}`); };

function blocks(md) {
  const out = [];
  const re = /^```([^\n]*)\n([\s\S]*?)^```[ \t]*$/gm;
  let m;
  while ((m = re.exec(md))) {
    const [lang, ...meta] = m[1].trim().split(/\s+/);
    const line = md.slice(0, m.index).split('\n').length;
    out.push({ lang, meta, code: m[2], line });
  }
  return out;
}

function compile(code, dir, name) {
  const src = join(dir, `${name}.rs`);
  writeFileSync(src, code);
  return spawnSync(rustc, ['--edition', '2024', '-A', 'warnings', '-o', join(dir, name), src], { encoding: 'utf8' });
}

const tmp = mkdtempSync(join(tmpdir(), 'rb-check-'));
const ids = readdirSync(lessonsDir).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)).sort()
  .filter((id) => !filters.length || filters.some((p) => id.startsWith(p)));

let ran = 0;
for (const id of ids) {
  const md = readFileSync(join(lessonsDir, `${id}.md`), 'utf8');
  if (/[ঀ-৿]/.test(blocks(md).filter((b) => b.lang === 'rust').map((b) => b.code).join(''))) {
    fail(id, 'Bangla text inside a rust code block (code must be English only)');
  }
  const bs = blocks(md);
  bs.forEach((b, i) => {
    if (b.lang !== 'rust' || b.meta.includes('ignore')) return;
    const where = `${id}.md:${b.line}`;
    const name = `b${i}`;
    const c = compile(b.code, tmp, name);
    ran++;
    if (b.meta.includes('compile_fail')) {
      if (c.status === 0) fail(where, 'marked compile_fail but it compiles');
      return;
    }
    if (c.status !== 0) { fail(where, `does not compile:\n${c.stderr.split('\n').slice(0, 12).join('\n')}`); return; }
    const r = spawnSync(join(tmp, name), [], { encoding: 'utf8', timeout: 5000 });
    if (r.status !== 0) { fail(where, `exits with ${r.status ?? r.signal}: ${r.stderr.slice(0, 300)}`); return; }
    const next = bs[i + 1];
    if (next && next.lang === 'text') {
      const want = next.code.replace(/\s+$/, '');
      const got = r.stdout.replace(/\s+$/, '');
      if (want !== got) fail(where, `output differs\n--- expected (text block)\n${want}\n--- actual\n${got}`);
    }
  });

  // quiz sanity
  const qf = join(quizDir, `${id}.json`);
  if (!existsSync(qf)) { fail(id, 'missing quiz file'); continue; }
  let quiz;
  try { quiz = JSON.parse(readFileSync(qf, 'utf8')); } catch (e) { fail(`${id}.json`, `bad JSON: ${e.message}`); continue; }
  const cards = quiz.cards || [];
  if (cards.length < 6 || cards.length > 14) fail(`${id}.json`, `${cards.length} cards (want 8–12)`);
  cards.forEach((c, k) => {
    const w = `${id}.json card ${k + 1}`;
    if (!c.q || !c.explain) fail(w, 'needs q and explain');
    if (c.code && /[ঀ-৿]/.test(c.code)) fail(w, 'Bangla inside code');
    if (c.type === 'choice' && !(Number.isInteger(c.answer) && c.answer >= 0 && c.answer < (c.options || []).length)) fail(w, 'answer index out of range');
    if (c.type === 'choice' && new Set(c.options).size !== c.options.length) fail(w, 'duplicate options');
    if (c.type === 'fill' && (c.code.match(/___/g) || []).length !== 1) fail(w, 'fill code must contain exactly one ___');
    if (c.type === 'line' && ![].concat(c.answer).every((n) => n >= 1 && n <= c.code.split('\n').length)) fail(w, 'line answer out of range');
    if (c.type === 'order' && new Set(c.lines).size !== c.lines.length) fail(w, 'duplicate lines in order card');
  });
}
rmSync(tmp, { recursive: true, force: true });
console.log(`\n${ids.length} lessons, ${ran} rust blocks compiled, ${problems} problem(s).`);
process.exit(problems ? 1 : 0);
