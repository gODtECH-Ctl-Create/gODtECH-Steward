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
| **Rule packs** | Versioned `core` and `security` packs with pack-level or rule-level disabling |

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
RULE PACKS
    |
    v
RULE EXECUTION
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
godtech-steward --help
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

Inspect the active rule packs and individual rule states:

```bash
steward rules
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
  "packs": {
    "disabled": []
  },
  "rules": {
    "disabled": []
  }
}
```

Disable a complete built-in pack:

```json
{
  "packs": {
    "disabled": ["security"]
  }
}
```

Disable individual rules when finer control is required:

```json
{
  "rules": {
    "disabled": ["todo-fixme"]
  }
}
```

Pack-level policy is evaluated first, then individual rule-level policy. Steward does not currently load arbitrary executable third-party rule packs from configuration.

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

## Integration with the gODtECH ecosystem

Steward remains independently usable. It is a focused maintenance engine, not another orchestrator or scaffolding system.

```text
                    gODtECH FORGE
             orchestration / policy / workflow
                         |
             +-----------+-----------+
             |                       |
             v                       v
        StackPilot                Steward
        BUILD IT             KEEP IT HEALTHY
             |                       |
             +-----------+-----------+
                         v
                   TARGET PROJECT
```

- **gODtECH FORGE** may invoke Steward through the public command or machine-readable result contract when maintenance evidence is relevant.
- **StackPilot** may optionally consume generic Steward findings while keeping its own golden-path checks separate.
- Neither integration is required for Steward's standalone operation.
- Generic maintenance rules have one canonical implementation in Steward.

The stable integration result is versioned as `schemaVersion: 1`. See [`docs/integration.md`](docs/integration.md) and [`schemas/steward-result.schema.json`](schemas/steward-result.schema.json).

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
     config + Git       file collector     rule packs
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

See [`docs/architecture.md`](docs/architecture.md), [`docs/rules.md`](docs/rules.md), and [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Development

The repository follows the gODtECH FORGE delivery model: material work is tracked, implemented on a dedicated branch, verified, and documented before merge.

```bash
npm run check
npm run build
npm test
```

## Status

**Active development / rule-pack architecture**

The deterministic engine, CLI, reporting contract, configuration validation, versioned rule packs, first rule set, conservative remediation model, and GitHub Action integration are established. Future work can add trusted external rule-pack distribution, richer evidence and health deltas, language-aware analysis, dependency graphs, and broader product-health capabilities without replacing the core pipeline.
