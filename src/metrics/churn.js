'use strict';

const git = require('../git');

function countLines(output) {
  const counts = new Map();
  for (const line of output.split('\n')) {
    const f = line.trim();
    if (f) counts.set(f, (counts.get(f) ?? 0) + 1);
  }
  return counts;
}

/**
 * Collect file churn and bug hotspot data.
 * @param {string} repoPath
 * @param {{ since: string, top?: number }} options
 * @returns {Promise<{ files: Array<{path,changes,bugFixes,category}> }>}
 */
async function collect(repoPath, { since, top = 20 }) {
  const churnOut = git.run(
    ['log', `--since=${since}`, '--name-only', '--format=', '--diff-filter=ACDMRT'],
    repoPath
  );
  const bugOut = git.run(
    ['log', `--since=${since}`, '-E', '--grep=fix|bug|patch|issue|broken', '-i', '--name-only', '--format='],
    repoPath
  );

  const churnMap = countLines(churnOut);
  const bugMap   = countLines(bugOut);

  const sorted   = [...churnMap.entries()].sort((a, b) => b[1] - a[1]);
  const topFiles = sorted.slice(0, top);
  const topPaths = new Set(topFiles.map(([p]) => p));

  const files = topFiles.map(([path, changes]) => ({
    path,
    changes,
    bugFixes: bugMap.get(path) ?? 0,
    category: (bugMap.get(path) ?? 0) > 0 ? 'danger' : 'churn',
  }));

  const extras = [...bugMap.entries()]
    .filter(([path, count]) => !topPaths.has(path) && count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([path, bugFixes]) => ({
      path,
      changes: churnMap.get(path) ?? 0,
      bugFixes,
      category: 'bugs',
    }));

  return { files: [...files, ...extras] };
}

module.exports = { collect };
