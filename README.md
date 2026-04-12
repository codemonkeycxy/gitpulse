# gitpulse

> Mine git history. Understand any codebase before reading a single file.

`gitpulse` analyses a git repository and generates a self-contained HTML health report — a dark analytics dashboard covering the five things that matter most when approaching an unfamiliar codebase.

## Usage

```bash
# Run from inside any repo — zero install required
npx @codemonkeycxy/gitpulse

# Point at a local path
npx @codemonkeycxy/gitpulse ./path/to/repo

# Point at a GitHub URL (shallow-clones automatically)
npx @codemonkeycxy/gitpulse https://github.com/owner/repo

# Skip auto-opening the browser
npx @codemonkeycxy/gitpulse --no-open
```

## Report sections

| Section | What it shows |
|---|---|
| **File Churn** | Top changed files by commit count in the analysis window |
| **Project Momentum** | Monthly commit trend — growing, declining, or stable |
| **Contributor Distribution** | Commit share per author; warns when knowledge is dangerously concentrated |
| **Knowledge Silos** | Files only one person has touched, grouped by sole owner |
| **Firefighting Frequency** | Reverts, hotfixes, and rollbacks per month with spike detection |

## Options

| Flag | Default | Description |
|---|---|---|
| `--output <file>` | `gitpulse-<repo>.html` | Output file path |
| `--since <date>` | 1 year ago | Analyse commits since this date (YYYY-MM-DD) |
| `--top <n>` | `20` | Number of files in the churn section |
| `--no-open` | — | Don't auto-open the report in the browser |
| `--json` | — | Output raw collected data as JSON |
| `--all-files` | — | Include noise files (lock files, go.sum, vendor/) in the churn list |

## Inspiration

The core insight — that you can understand a codebase's health before reading a single line of code — comes from [*Git Commands I Use Before Reading Code*](https://piechowski.io/post/git-commands-before-reading-code/) by Grzegorz Piechowski. gitpulse automates those ideas and packages them into a visual dashboard.

## License

MIT
