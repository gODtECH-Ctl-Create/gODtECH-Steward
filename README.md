# gODtECH Steward

> Keep your software healthy.

**gODtECH Steward** turns software housekeeping into a repeatable engineering step. It scans repositories deterministically, produces explainable findings, and applies only explicitly enabled safe fixes.

<div align="center">

**CLI-first** · **GitHub Action** · **Deterministic** · **Safe by default**

</div>

> Built with **gODtECH FORGE** — Framework for Orchestrated Reasoning, Governance & Engineering.

---

## What Steward does

Steward is built for developers and teams that want repository maintenance to be visible, repeatable, and safe.

It currently checks:

| Area | Checks |
| --- | --- |
| **Repository** | README, `.gitignore`, large files, disposable tracked artifacts |
| **Security** | Tracked environment files and high-confidence credential patterns |
| **Documentation** | Broken and malformed local Markdown links |
| **Dependencies** | Package-manager and lockfile consistency, invalid `package.json` |
| **Maintenance** | Unresolved merge-conflict markers and TODO/FIXME maintenance markers |
| **Hygiene** | Trailing whitespace and missing final newlines |
| **Reporting** | Health score, severity counts, category counts, JSON output |

Steward deliberately does **not** delete uncertain files, rewrite architecture, or require artificial intelligence (AI) for deterministic repository facts.

## Workflow

```text
REPOSITORY
    |
    v
CONFIG + GIT FACTS
    |
    v
FILE COLLECTION
    |
    v
RULE REGISTRY
    |
    v
FINDINGS
    |
    +--> human report
    +--> JSON report
    +--> CI decision
    +--> explicit safe remediation
```

## Installation

Steward is currently developed from source.

```bash
git clone https://github.com/gODtECH-Ctl-Create/gODtECH-Steward.git
cd gODtECH-Steward
npm install
npm run build
npm install -g .
```

The command-line interface (CLI) is available as:

```bash
steward --help
gotek-steward --help
```

## CLI usage

Initialize repository configuration:

```bash
steward init
```

Scan a repository:

```bash
steward scan
```

Get a diagnostic view with category summary:

```bash
steward doctor
```

Get machine-readable output:

```bash
steward scan --json
```

Write a JSON report:

```bash
steward report --output .steward-report.json
```

Preview safe fixes without changing files:

```bash
steward fix --safe --dry-run
```

Apply only findings explicitly marked safe:

```bash
steward fix --safe
```

Fail a continuous integration (CI) job when the configured severity threshold is present:

```bash
steward scan --ci
```

## Configuration

`steward init` creates `.steward.json`. Configuration is repository-owned so forks and teams can change policy without changing the engine.

```json
{
  "version": 1,
  "exclude": ["vendor/**"],
  "maxFileSizeBytes": 10485760,
  "largeFileThresholdBytes": 5242880,
  "ci": {
    "failOn": "critical"
  },
  "rules": {
    "disabled": []
  }
}
```

`exclude` supports repository-relative wildcard patterns. Disabled entries use registered rule IDs such as `security`, `dependencies`, or `maintenance`.

## GitHub Action

Steward includes a composite GitHub Action that invokes the same compiled engine as the CLI.

```yaml
name: Steward

on:
  pull_request:
  push:

permissions:
  contents: read

jobs:
  steward:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: gODtECH-Ctl-Create/gODtECH-Steward@main
```

Custom arguments are passed as a JSON array to avoid shell re-parsing:

```yaml
      - uses: gODtECH-Ctl-Create/gODtECH-Steward@main
        with:
          args: '["scan", "--ci", "--json"]'
```

During development, pin the Action to a reviewed branch or release tag instead of a moving development reference.

## Safety model

Steward follows one rule: **observe first, explain second, modify only when the requested fix is deterministic and explicitly enabled**.

`fix` always refuses to modify files without `--safe`. `--dry-run` never writes. Security findings are observation-only. The current safe fixer only normalizes formatting-level hygiene findings.

## Architecture

```text
                    +----------------+
                    | CLI / Action   |
                    +-------+--------+
                            |
                            v
                    +---------------+
                    | Scan pipeline |
                    +-------+-------+
                            |
          +-----------------+-----------------+
          |                 |                 |
          v                 v                 v
     config + Git       file collector    rule registry
          |                 |                 |
          +-----------------+-----------------+
                            |
                            v
                       stable findings
                            |
              +-------------+-------------+
              |             |             |
              v             v             v
            text          JSON            CI
           report         report         gate
                            |
                            v
                      safe remediation
```

See [`docs/architecture.md`](docs/architecture.md) and [`docs/rules.md`](docs/rules.md).

## Development

The repository follows the gODtECH FORGE delivery model: material work is tracked, implemented on a dedicated branch, verified, and documented before merge.

```bash
npm run check
npm run build
npm test
```

## Status

**Early development / hardened foundation**

The deterministic engine, CLI, reporting contract, configuration validation, first rule set, conservative remediation model, and GitHub Action integration are established. Future work can add language-aware analysis, dependency graphs, richer GitHub metadata, architecture checks, and broader product-health capabilities without replacing the core pipeline.
