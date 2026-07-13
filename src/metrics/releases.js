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

// A tag is a hotfix when it looks like a semver and the patch segment is > 0.
// e.g. v1.2.1, 3.0.2 → hotfix; v1.2.0, 2.0.0, non-semver → release.
function tagKind(name) {
  const m = name.replace(/^v/i, '').match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return 'release';
  return parseInt(m[3], 10) > 0 ? 'hotfix' : 'release';
}

async function collect(repoPath, { since }) {
  let output;
  try {
    output = git.run(
      ['tag', '--sort=creatordate', '--format=%(creatordate:format:%Y-%m-%d) %(refname:short)'],
      repoPath
    );
  } catch {
    return { total: 0, totalReleases: 0, totalHotfixes: 0, tags: [], months: [], releaseCounts: [], hotfixCounts: [] };
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
    const kind  = tagKind(name);
    tags.push({ name, date: dateStr, month, kind });
  }

  if (tags.length === 0) {
    return { total: 0, totalReleases: 0, totalHotfixes: 0, tags: [], months: [], releaseCounts: [], hotfixCounts: [] };
  }

  const allMonths = tags.map(t => t.month).sort();
  const nowMonth  = new Date().toISOString().slice(0, 7);
  const months    = monthRange(allMonths[0], nowMonth);

  const releaseFreq = new Map();
  const hotfixFreq  = new Map();
  for (const t of tags) {
    const map = t.kind === 'hotfix' ? hotfixFreq : releaseFreq;
    map.set(t.month, (map.get(t.month) ?? 0) + 1);
  }

  const releaseCounts = months.map(m => releaseFreq.get(m) ?? 0);
  const hotfixCounts  = months.map(m => hotfixFreq.get(m)  ?? 0);
  const totalReleases = tags.filter(t => t.kind === 'release').length;
  const totalHotfixes = tags.filter(t => t.kind === 'hotfix').length;

  return { total: tags.length, totalReleases, totalHotfixes, tags, months, releaseCounts, hotfixCounts };
}

module.exports = { collect };
