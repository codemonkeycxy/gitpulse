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
  let output;
  try {
    output = git.run(
      ['tag', '--sort=creatordate', '--format=%(creatordate:format:%Y-%m-%d) %(refname:short)'],
      repoPath
    );
  } catch {
    return { total: 0, tags: [], months: [], counts: [] };
  }

  const sinceMs = new Date(since).getTime();
  const tags = [];

  for (const line of output.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const spaceIdx = trimmed.indexOf(' ');
    if (spaceIdx === -1) continue;
    const dateStr = trimmed.slice(0, spaceIdx);
    const name    = trimmed.slice(spaceIdx + 1);
    if (!dateStr || !name) continue;
    const ts = new Date(dateStr).getTime();
    if (isNaN(ts) || ts < sinceMs) continue;
    const month = dateStr.slice(0, 7); // YYYY-MM
    tags.push({ name, date: dateStr, month });
  }

  if (tags.length === 0) return { total: 0, tags: [], months: [], counts: [] };

  const allMonths = tags.map(t => t.month).sort();
  const nowMonth  = new Date().toISOString().slice(0, 7);
  const months    = monthRange(allMonths[0], nowMonth);
  const freq      = new Map();
  for (const t of tags) freq.set(t.month, (freq.get(t.month) ?? 0) + 1);
  const counts = months.map(m => freq.get(m) ?? 0);

  return { total: tags.length, tags, months, counts };
}

module.exports = { collect };
