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
 * Collect file churn data.
 * @param {string} repoPath
 * @param {{ since: string, top?: number, allFiles?: boolean }} options
 * @returns {Promise<{ files: Array<{path, changes}>, filtered: string[] }>}
 */
async function collect(repoPath, { since, top = 20, allFiles = false }) {
  const churnOut = await git.run(
    ['log', `--since=${since}`, '--name-only', '--format=', '--diff-filter=ACDMRT'],
    repoPath
  );

  const churnMap = countLines(churnOut);

  // Strip noise files unless the caller asked for everything.
  // Track which ones were removed so the report can show a note.
  const filtered = [];
  if (!allFiles) {
    for (const [path, changes] of churnMap) {
      if (isNoise(path)) { filtered.push({ path, changes }); churnMap.delete(path); }
    }
    filtered.sort((a, b) => b.changes - a.changes);
  }

  const files = [...churnMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([path, changes]) => ({ path, changes }));

  return { files, filtered: filtered.map(f => f.path) };
}

module.exports = { collect };
