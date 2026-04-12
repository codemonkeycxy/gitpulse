'use strict';

const git = require('../git');

async function collect(repoPath, { since }) {
  const listOut = await git.run(
    ['log', '--since=' + since, '--name-only', '--format=', '--diff-filter=ACDMRT'],
    repoPath
  );

  const uniqueFiles = [
    ...new Set(listOut.split('\n').map(l => l.trim()).filter(Boolean)),
  ];

  if (uniqueFiles.length === 0) return { files: [] };

  const silos = [];

  for (const file of uniqueFiles) {
    const logOut = await git.run(
      ['log', '--since=' + since, '--format=%an|%ad', '--date=format:%Y-%m-%d', '--', file],
      repoPath
    );

    const entries = logOut.split('\n').map(l => l.trim()).filter(Boolean);
    if (entries.length === 0) continue;

    const authors = new Set(entries.map(e => e.split('|')[0]));
    if (authors.size !== 1) continue;

    const dates = entries.map(e => e.split('|')[1]).sort();
    silos.push({
      path:        file,
      owner:       [...authors][0],
      lastTouched: dates[dates.length - 1],
      commits:     entries.length,
    });
  }

  silos.sort((a, b) => a.lastTouched.localeCompare(b.lastTouched));

  return { files: silos };
}

module.exports = { collect };
