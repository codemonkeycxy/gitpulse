'use strict';
const git = require('../git');
function monthRange(from, to) {
  const months = [];
  let [y, m] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    months.push(y + '-' + String(m).padStart(2, '0'));
    if (++m > 12) { m = 1; y++; }
  }
  return months;
}
function calcTrend(counts) {
  if (counts.length < 6) return 'stable';
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const last3 = avg(counts.slice(-3));
  const prior3 = avg(counts.slice(-6, -3));
  if (prior3 === 0) return last3 > 0 ? 'growing' : 'stable';
  if (last3 > prior3 * 1.2) return 'growing';
  if (last3 < prior3 * 0.8) return 'declining';
  return 'stable';
}
async function collect(repoPath, { since }) {
  const output = await git.run(['log', `--since=${since}`, '--format=%ad', '--date=format:%Y-%m', '--no-merges'], repoPath);
  const raw = output.split('\n').map(l => l.trim()).filter(Boolean);
  if (raw.length === 0) return { months: [], counts: [], trend: 'stable' };
  const freq = new Map();
  for (const m of raw) freq.set(m, (freq.get(m) ?? 0) + 1);
  const sorted = [...freq.keys()].sort();
  const months = monthRange(sorted[0], sorted[sorted.length - 1]);
  const counts = months.map(m => freq.get(m) ?? 0);
  return { months, counts, trend: calcTrend(counts) };
}
module.exports = { collect };
