# gitpulse

> Mine git history. Understand any codebase before reading a single file.

`gitpulse` analyses a git repository and generates a self-contained HTML health report — a dark analytics dashboard covering the five things that matter most when approaching an unfamiliar codebase.

## Usage

```bash
# Run from inside any repo
npx gitpulse

# Or point at a path
npx gitpulse ./path/to/repo
```

## Report sections

| Section | What it shows |
|---|---|
| **File Churn + Bug Hotspots** | Top changed files, color-coded by risk (churn + bugs = danger zone) |
| **Project Momentum** | Monthly commit trend — growing, declining, or stable |
| **Contributor Distribution** | Who owns what, and your bus factor risk |
| **Knowledge Silos** | Files only one person has touched in the analysis window |
| **Firefighting Frequency** | Reverts, hotfixes, and rollback frequency with spike detection |

## Options

| Flag | Default | Description |
|---|---|---|
| `--output <file>` | `gitpulse-report.html` | Output file path |
| `--since <date>` | 1 year ago | Analyse commits since this date (YYYY-MM-DD) |
| `--top <n>` | `20` | Number of files in the churn section |
| `--no-open` | — | Don't auto-open the report in the browser |
| `--json` | — | Output raw collected data as JSON |

## Inspiration

The core insight — that you can understand a codebase's health before reading a single line of code — comes from [*Git Commands I Use Before Reading Code*](https://piechowski.io/post/git-commands-before-reading-code/) by Grzegorz Piechowski. gitpulse automates those ideas and packages them into a visual dashboard.

## License

MIT
