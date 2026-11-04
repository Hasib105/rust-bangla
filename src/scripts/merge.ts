// Merging two game states (this browser + the account). Pure, shared by client and server.
import type { State } from './store';

/** XP is fully derived from results, so two devices never double-count. */
export function xpOf(s: State) {
  let xp = 0;
  for (const l of Object.values(s.lessons)) xp += l.best * 10 + 20 + (l.stars === 3 ? 10 : 0);
  for (const b of Object.values(s.bosses)) if (b >= 7) xp += 50;
  for (const e of Object.values(s.exams || {})) if (e.score / e.total >= 0.7) xp += 200;
  return xp;
}

export function merge(a: State, b: State): State {
  const out: State = { ...a, ...b, lessons: { ...a.lessons }, bosses: { ...a.bosses }, exams: { ...(a.exams || {}) }, daily: { ...a.daily } };
  for (const [k, l] of Object.entries(b.lessons || {})) {
    const o = out.lessons[k];
    out.lessons[k] = o ? { best: Math.max(o.best, l.best), total: l.total, stars: Math.max(o.stars, l.stars), at: o.at > l.at ? o.at : l.at } : l;
  }
  for (const [k, v] of Object.entries(b.bosses || {})) out.bosses[k] = Math.max(out.bosses[k] ?? 0, v);
  for (const [k, e] of Object.entries(b.exams || {})) { const o = out.exams[k]; if (!o || e.score > o.score) out.exams[k] = e; }
  for (const [d, x] of Object.entries(b.daily || {})) out.daily[d] = Math.max(out.daily[d] ?? 0, x);
  const sa = a.streak, sb = b.streak;
  out.streak = { ...(sa.last > sb.last ? sa : sb.last > sa.last ? sb : sa.count >= sb.count ? sa : sb), max: Math.max(sa.max, sb.max) };
  out.badges = [...new Set([...(a.badges || []), ...(b.badges || [])])];
  out.runs = Math.max(a.runs || 0, b.runs || 0);
  out.sound = a.sound;
  out.xp = xpOf(out);
  return out;
}
