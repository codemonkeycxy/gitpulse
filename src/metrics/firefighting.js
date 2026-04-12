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

// Match on subject line only; anchored to start to avoid mid-sentence matches.
// Double-reverts (Revert "Revert ...") are restoration work, not firefighting.
const FIREFIGHTING_RE    = /^(revert|hotfix|rollback)\b/i;
const DOUBLE_REVERT_RE   = /^revert\s+['"]?revert\b/i;

async function collect(repoPath, { since }) {
  const output = await git.run(
    ['log', '--since=' + since, '--format=%H\t%ad\t%s', '--date=format:%Y-%m', '--no-merges'],
    repoPath
  );

  const raw = output.split('\n').map(l => l.trim()).filter(Boolean);

  const commits = raw
    .map(line => {
      const i1 = line.indexOf('\t');
      const i2 = line.indexOf('\t', i1 + 1);
      return { hash: line.slice(0, i1), month: line.slice(i1 + 1, i2), subject: line.slice(i2 + 1) };
    })
    .filter(c => FIREFIGHTING_RE.test(c.subject) && !DOUBLE_REVERT_RE.test(c.subject));

  if (commits.length === 0) return { months: [], counts: [], average: 0, spikes: [], commits: [] };

  const freq = new Map();
  for (const c of commits) freq.set(c.month, (freq.get(c.month) || 0) + 1);

  const sorted = [...freq.keys()].sort();
  const months = monthRange(sorted[0], sorted[sorted.length - 1]);
  const counts = months.map(m => freq.get(m) || 0);

  const average = counts.reduce((s, c) => s + c, 0) / counts.length;
  const spikes = months.filter((m, i) => counts[i] > average * 2);

  return { months, counts, average, spikes, commits };
}

module.exports = { collect };
