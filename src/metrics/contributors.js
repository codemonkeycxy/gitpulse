'use strict';

const git = require('../git');

async function collect(repoPath, { since }) {
  const output = await git.run(
    ['shortlog', '-sn', '--no-merges', '--since=' + since],
    repoPath
  );

  const lines = output.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { authors: [], total: 0, busFactor: 0 };

  const parsed = lines.map(line => {
    const tab = line.indexOf('\t');
    return {
      name:    line.slice(tab + 1).trim(),
      commits: parseInt(line.slice(0, tab).trim(), 10),
    };
  }).sort((a, b) => b.commits - a.commits);

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
