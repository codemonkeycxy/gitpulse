#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { program } = require('commander');
const git = require('../src/git');
const churn = require('../src/metrics/churn');
const momentum = require('../src/metrics/momentum');
const contributors = require('../src/metrics/contributors');
const silos = require('../src/metrics/silos');
const firefighting = require('../src/metrics/firefighting');
const { render } = require('../src/renderer/html');

// Minimal TTY spinner — no extra dependencies.
// Returns a stop() function that clears the line so the next console.log is clean.
function startSpinner(msg) {
  if (!process.stdout.isTTY) {
    process.stderr.write(msg + '\n');
    return () => {};
  }
  const frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
  let i = 0;
  process.stdout.write(frames[0] + ' ' + msg);
  const id = setInterval(() => {
    process.stdout.write('\r' + frames[++i % frames.length] + ' ' + msg);
  }, 80);
  return () => {
    clearInterval(id);
    process.stdout.write('\r' + ' '.repeat(msg.length + 2) + '\r');
  };
}

function getDefaultSince() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().slice(0, 10);
}

function getSinceLabel(since, isDefault) {
  return isDefault ? '12 months' : since;
}

async function main() {
  const defaultSince = getDefaultSince();

  program
    .name('gitpulse')
    .argument('[repo]', 'repo path', process.cwd())
    .option('--output <file>', 'output file (default: gitpulse-<repo>.html)')
    .option('--no-open', 'do not open the generated report')
    .option('--json', 'print JSON to stdout')
    .option('--since <date>', 'collect data since date', defaultSince)
    .option('--top <n>', 'number of top files to include', (value) => parseInt(value, 10), 20)
    .option('--all-files', 'include noise files (lock files, go.sum, vendor/) in churn list')
    .parse(process.argv);

  const opts = program.opts();
  const repoInput = program.args[0] || process.cwd();
  const repoPath = path.resolve(repoInput);
  const since = opts.since;
  const shouldOpen = opts.open !== false;

  try {
    execFileSync('git', ['--version'], { stdio: 'pipe' });
  } catch {
    console.error('✖ git is not installed or not in PATH.');
    console.error('  Install git: https://git-scm.com/downloads');
    process.exit(1);
  }

  if (!git.isGitRepo(repoPath)) {
    console.error(`✖ Not a git repository: ${repoPath}`);
    process.exit(1);
  }

  const rootPath = git.getGitRoot(repoPath);
  const repoName = path.basename(rootPath);
  const outPath = opts.output
    ? path.resolve(opts.output)
    : path.join(process.cwd(), 'gitpulse-' + repoName + '.html');
  const metricOptions = { since, top: opts.top, allFiles: opts.allFiles || false };

  const stopSpinner = startSpinner(`Analysing ${repoName}…`);

  const [
    churnData,
    momentumData,
    contributorsData,
    silosData,
    firefightingData,
  ] = await Promise.all([
    churn.collect(rootPath, metricOptions),
    momentum.collect(rootPath, metricOptions),
    contributors.collect(rootPath, metricOptions),
    silos.collect(rootPath, metricOptions),
    firefighting.collect(rootPath, metricOptions),
  ]);

  stopSpinner();

  const data = {
    meta: {
      repoName,
      repoPath: rootPath,
      since,
      sinceLabel: getSinceLabel(since, since === defaultSince),
      totalCommits: contributorsData.total,
      generatedAt: new Date().toISOString(),
      githubUrl: git.getGithubUrl(rootPath),
    },
    churn: churnData,
    momentum: momentumData,
    contributors: contributorsData,
    silos: silosData,
    firefighting: firefightingData,
  };

  if (opts.json) {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
    return;
  }

  fs.writeFileSync(outPath, render(data), 'utf8');

  console.log(`✔ Report saved to ${outPath}${shouldOpen ? ' (opening in browser…)' : ''}`);

  if (shouldOpen) {
    const { default: open } = await import('open');
    await open(outPath);
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
