'use strict';

const { execFileSync } = require('child_process');

const MAX_BUFFER = 200 * 1024 * 1024; // 200MB — handles large repo histories
const OPTS = (cwd) => ({ cwd, encoding: 'utf8', stdio: 'pipe', maxBuffer: MAX_BUFFER });

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

function getGithubUrl(repoPath) {
  try {
    const remote = execFileSync('git', ['remote', 'get-url', 'origin'], OPTS(repoPath)).trim();
    // Handles https://github.com/owner/repo.git, git@github.com:owner/repo.git,
    // and ssh://git@github.com/owner/repo.git
    const match = remote.match(/github\.com[:/](.+?)(?:\.git)?$/);
    if (!match) return null;
    return 'https://github.com/' + match[1];
  } catch {
    return null;
  }
}

module.exports = { run, isGitRepo, getGitRoot, getGithubUrl };
