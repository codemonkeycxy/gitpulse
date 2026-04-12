'use strict';

const { execFileSync } = require('child_process');

const OPTS = (cwd) => ({ cwd, encoding: 'utf8', stdio: 'pipe' });

function run(args, repoPath) {
  return execFileSync('git', args, OPTS(repoPath));
}

function isGitRepo(repoPath) {
  try {
    execFileSync('git', ['rev-parse', '--git-dir'], OPTS(repoPath));
    return true;
  } catch {
    return false;
  }
}

function getGitRoot(repoPath) {
  return run(['rev-parse', '--show-toplevel'], repoPath).trim();
}

module.exports = { run, isGitRepo, getGitRoot };
