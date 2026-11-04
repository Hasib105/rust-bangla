// Shared result screen for lesson / challenge / exam.
import { bn } from './store';
import { icon } from './icons';
import { md } from './quiz';

export function resultHtml(o: {
  score: number; total: number; title: string; sub?: string; stars?: number;
  stats: [string, string][]; missed: { q: string; explain: string; from?: string }[]; actions: string;
}) {
  const pct = Math.round((o.score / o.total) * 100);
  return `<div class="qz"><div class="result">
    <div class="score-ring" style="--p:${pct}"><div>${bn(o.score)}/${bn(o.total)}<small>ঠিক</small></div></div>
    ${o.stars ? `<div class="bigstars">${[1, 2, 3].map((k) => icon('star', 40, k <= o.stars! ? 'on' : '')).join('')}</div>` : ''}
    <h2>${o.title}</h2>
    ${o.sub ? `<p class="muted">${o.sub}</p>` : ''}
    <div class="grid">${o.stats.map(([v, k]) => `<div><b>${v}</b><small>${k}</small></div>`).join('')}</div>
    ${o.missed.length ? `<div class="missed"><h3>যেগুলো প্রথমবারে ভুল হয়েছিল</h3><ul>${o.missed.map((c) => `<li><b>${md(c.q)}</b>${c.from ? ` <small>(${md(c.from)})</small>` : ''}<br>${md(c.explain)}</li>`).join('')}</ul></div>` : ''}
    <div class="acts">${o.actions}</div>
  </div></div>`;
}
