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

async function collect(repoPath, { since }) {
  const output = await git.run(
    ['log', '--since=' + since, '-E', '--grep=revert|hotfix|rollback|emergency|incident', '-i', '--format=%ad', '--date=format:%Y-%m', '--no-merges'],
    repoPath
  );

  const raw = output.split('\n').map(l => l.trim()).filter(Boolean);
  if (raw.length === 0) return { months: [], counts: [], average: 0, spikes: [] };

  const freq = new Map();
  for (const m of raw) freq.set(m, (freq.get(m) || 0) + 1);

  const sorted = [...freq.keys()].sort();
  const months = monthRange(sorted[0], sorted[sorted.length - 1]);
  const counts = months.map(m => freq.get(m) || 0);

  const average = counts.reduce((s, c) => s + c, 0) / counts.length;
  const spikes = months.filter((m, i) => counts[i] > average * 2);

  return { months, counts, average, spikes };
}

module.exports = { collect };
