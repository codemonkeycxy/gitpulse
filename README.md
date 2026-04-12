# gitpulse

> A quick health check for any git repository.

`gitpulse` analyses a git repository's commit history and generates a visual health report. Point it at any repo to get a quick read on potential problem areas like churn hotspots, knowledge silos, and firefighting patterns.

## Usage

```bash
# Run from inside any repo
npx @codemonkeycxy/gitpulse

# Point at a local path
npx @codemonkeycxy/gitpulse ./path/to/repo

# Point at a GitHub URL
npx @codemonkeycxy/gitpulse https://github.com/owner/repo

# Skip auto-opening the browser
npx @codemonkeycxy/gitpulse --no-open
```

## Report sections

| Section | What it shows |
|---|---|
| **File Churn** | Most frequently changed files over the configured time range |
| **Project Momentum** | Monthly commit trend (growing, declining, or stable) |
| **Contributor Distribution** | Commit share per author; warns when knowledge is heavily concentrated in one person |
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
| `--all-files` | — | Include noise files (lock files, generated files, and vendor directories) in the churn list |

## Inspiration

The core insight, that you can understand a codebase's health before reading a single line of code, comes from [*Git Commands I Use Before Reading Code*](https://piechowski.io/post/git-commands-before-reading-code/) by Grzegorz Piechowski. gitpulse automates those ideas.

## License

MIT
