# gitpulse — Design Spec

**Date:** 2026-04-11
**Status:** approved

---

## Overview

`gitpulse` is a Node.js CLI tool that runs git analysis on any repository and generates a self-contained, visual HTML report. The core insight comes from [this article](https://piechowski.io/post/git-commands-before-reading-code/): you can learn where a codebase hurts — and where the risk is — before reading a single line of code, just by mining git history.

Run it with `npx gitpulse` from any repo. It produces a dark analytics dashboard saved as a single HTML file, auto-opened in the browser.

---

## Architecture

```
gitpulse/
├── bin/
│   └── gitpulse.js          # CLI entry point (commander)
├── src/
│   ├── metrics/
│   │   ├── churn.js          # file churn + bug hotspot overlap
│   │   ├── momentum.js       # monthly commit counts
│   │   ├── contributors.js   # distribution + bus factor
│   │   ├── silos.js          # single-author files
│   │   └── firefighting.js   # reverts/hotfixes/rollbacks
│   ├── renderer/
│   │   └── html.js           # takes collected data, outputs HTML string
│   └── git.js                # shared helper: runs git commands, returns parsed output
├── templates/
│   └── report.html           # Chart.js + CSS inlined, data injected as JSON
└── package.json
```

**Key principle:** `git.js` is the only file that calls `child_process`. Metric modules never shell out directly — they call helpers from `git.js`. Each metric module exports a single async function:

```js
// e.g. src/metrics/churn.js
async function collect(repoPath, options) { ... }
module.exports = { collect };
```

The renderer merges all metric outputs into one data object, injects it as a JSON blob into the HTML template, and Chart.js reads it on page load. The report is fully self-contained — no network requests, works offline.

---

## CLI Interface

```bash
# Run from inside a repo (auto-detects git root)
npx gitpulse

# Point at a repo path
npx gitpulse ./path/to/repo

# Flags
--output <file>   # default: gitpulse-report.html in current dir
--no-open         # don't auto-open the report in browser after generating
--json            # print raw collected data as JSON instead of generating HTML
--since <date>    # default: 1 year ago (e.g. --since 2024-01-01)
```

On success:
```
✔ Report saved to gitpulse-report.html (opened in browser)
```

On error (not a git repo, git not installed, etc.): prints a clear human-readable message and exits with code 1.

---

## Metrics

Five sections in the report, covering six underlying metrics:

### 1. File Churn + Bug Hotspots *(merged)*
**Git commands:**
- `git log --format="%H" --diff-filter=M` — all modifying commits per file
- `git log --grep="fix\|bug\|patch\|issue\|broken" --name-only` — commits with bug-fix keywords

**Output:** Top 20 files by change count (configurable via `--top <n>`, default 20). Each file is flagged by category:
- **Red** — high churn *and* bug-prone → danger zone
- **Purple** — high churn, few bugs → actively developed, probably fine
- **Yellow** — low churn but bug-prone → neglected problem area

Displayed as a horizontal bar chart with color-coded bars and inline badges.

### 2. Project Momentum
**Git command:** `git log --format="%ad" --date=format:"%Y-%m"`

**Output:** Commit counts grouped by month, rendered as a filled area chart. Includes a trend label (growing / declining / stable) based on comparing the last 3 months to the prior 3 months.

### 3. Contributor Distribution
**Git command:** `git shortlog -sn --no-merges`

**Output:** Author → commit count. Rendered as a donut chart. Bus factor = number of authors whose combined commits cover ≥80% of total commits. Displayed as a risk badge alongside the chart.

### 4. Knowledge Silos
**Git command:** `git log --format="%an" -- <file>` per file

**Output:** Files where `DISTINCT(authors) = 1`, sorted by last-touched date ascending (oldest first — highest abandonment risk at the top). Rendered as a table with columns: file path, sole owner, last touched, commit count. Scoped to files modified at least once in the analysis window to keep it performant.

### 5. Firefighting Frequency
**Git command:** `git log --grep="revert\|hotfix\|rollback\|emergency\|incident" --format="%ad" --date=format:"%Y-%m"`

**Output:** Incident counts per month, rendered as a dashed line chart. Spikes (months > 2× the average) are annotated inline.

All metrics are scoped to `--since` (default: 1 year ago).

---

## HTML Report

- **Default view:** Scrolling sections — each metric gets its own full-width card with a title, subtitle, and chart
- **Toggle:** "Grid view" button in the header switches to a compact all-at-a-glance layout (2+3 grid). Toggle state persisted in `localStorage`.
- **Self-contained:** Chart.js bundled inline, no CDN, works offline
- **Theme:** Dark (`#0f172a` background), indigo/red/green accent palette
- **No framework:** Vanilla HTML/CSS/JS only

---

## Distribution

```json
{
  "name": "gitpulse",
  "bin": { "gitpulse": "./bin/gitpulse.js" },
  "dependencies": {
    "commander": "^12.0.0",
    "open": "^10.0.0"
  }
}
```

- `npx gitpulse` — zero-install, works on demand
- `npm install -g gitpulse` — for permanent install
- Chart.js inlined in template — no CDN, no network required at report-open time
- README: one-line install, animated GIF/screenshot of the report as hero image

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Not a git repo | Print clear error, exit 1 |
| `git` not installed | Print install instructions, exit 1 |
| Repo has no commits | Print message, exit 0 with empty report |
| `--since` date has no commits | Warn in report, show empty state per section |
| Output file not writable | Print error with suggested path, exit 1 |
