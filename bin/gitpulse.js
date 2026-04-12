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
    .option('--output <file>', 'output file', 'gitpulse-report.html')
    .option('--no-open', 'do not open the generated report')
    .option('--json', 'print JSON to stdout')
    .option('--since <date>', 'collect data since date', defaultSince)
    .option('--top <n>', 'number of top files to include', (value) => parseInt(value, 10), 20)
    .parse(process.argv);

  const opts = program.opts();
  const repoInput = program.args[0] || process.cwd();
  const repoPath = path.resolve(repoInput);
  const outPath = path.resolve(opts.output);
  const since = opts.since;
  const shouldOpen = opts.open !== false;

  execFileSync('git', ['--version'], { encoding: 'utf8', stdio: 'pipe' });

  if (!git.isGitRepo(repoPath)) {
    throw new Error(`Not a git repository: ${repoPath}`);
  }

  const rootPath = git.getGitRoot(repoPath);
  const repoName = path.basename(rootPath);
  const metricOptions = { since, top: opts.top };

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

  const data = {
    meta: {
      repoName,
      repoPath: rootPath,
      since,
      sinceLabel: getSinceLabel(since, since === defaultSince),
      totalCommits: contributorsData.total,
      generatedAt: new Date().toISOString(),
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

  if (shouldOpen) {
    const { default: open } = await import('open');
    await open(outPath);
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
