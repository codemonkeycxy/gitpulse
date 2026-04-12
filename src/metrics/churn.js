'use strict';

const git = require('../git');

// Files that churn mechanically (dep bumps, generated code) and carry no design signal.
// Excluded by default; use --all-files to include.
const NOISE_NAMES = new Set([
  'go.sum', 'go.mod',
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  'Cargo.lock', 'Gemfile.lock', 'poetry.lock', 'composer.lock',
]);
const NOISE_PREFIXES = ['vendor/'];

function isNoise(filePath) {
  const name = filePath.split('/').pop();
  if (NOISE_NAMES.has(name)) return true;
  if (NOISE_PREFIXES.some(p => filePath.startsWith(p))) return true;
  return false;
}

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
async function collect(repoPath, { since, top = 20, allFiles = false }) {
  const churnOut = await git.run(
    ['log', `--since=${since}`, '--name-only', '--format=', '--diff-filter=ACDMRT'],
    repoPath
  );
  const bugOut = await git.run(
    ['log', `--since=${since}`, '-E', '--grep=fix|bug|patch|issue|broken', '-i', '--name-only', '--format='],
    repoPath
  );

  const churnMap = countLines(churnOut);
  const bugMap   = countLines(bugOut);

  // Strip noise files unless the caller asked for everything.
  // Track which ones were removed so the report can show a note.
  const filtered = [];
  if (!allFiles) {
    for (const [path, changes] of churnMap) {
      if (isNoise(path)) { filtered.push({ path, changes }); churnMap.delete(path); }
    }
    for (const path of bugMap.keys()) {
      if (isNoise(path)) bugMap.delete(path);
    }
    filtered.sort((a, b) => b.changes - a.changes);
  }

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

  return { files: [...files, ...extras], filtered: filtered.map(f => f.path) };
}

module.exports = { collect };
