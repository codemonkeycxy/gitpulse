'use strict';

const git = require('../git');

async function collect(repoPath, { since }) {
  // git shortlog --since silently ignores the date filter in some git versions;
  // use git log --format=%aN and aggregate manually instead.
  const output = await git.run(
    ['log', '--format=%aN', '--no-merges', '--since=' + since],
    repoPath
  );

  const lines = output.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { authors: [], total: 0, busFactor: 0 };

  const freq = new Map();
  for (const name of lines) freq.set(name, (freq.get(name) || 0) + 1);
  const parsed = [...freq.entries()]
    .map(([name, commits]) => ({ name, commits }))
    .sort((a, b) => b.commits - a.commits);

  const total = parsed.reduce((s, a) => s + a.commits, 0);

  let cumulative = 0;
  let busFactor  = 0;
  for (const author of parsed) {
    cumulative += author.commits;
    busFactor++;
    if (cumulative / total >= 0.8) break;
  }

  const TOP = 10;
  const authors = parsed.length <= TOP
    ? parsed
    : [
        ...parsed.slice(0, TOP),
        { name: 'others', commits: parsed.slice(TOP).reduce((s, a) => s + a.commits, 0) },
      ];

  return { authors, total, busFactor };
}

module.exports = { collect };
