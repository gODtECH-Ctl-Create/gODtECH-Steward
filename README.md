# gODtECH Steward

> Keep your software healthy.

**gODtECH Steward** is a deterministic software and repository housekeeping engine. It scans a codebase for concrete maintenance, security, documentation, and repository-health issues, produces auditable findings, and applies only explicitly requested safe fixes.

<div align="center">

**CLI-first** · **GitHub Action** · **Deterministic** · **Safe by default**

</div>

> Built with **gODtECH FORGE** — Framework for Orchestrated Reasoning, Governance & Engineering.

---

## What is Steward?

Steward is for developers and teams who want repository maintenance to become an inspectable engineering step instead of a pile of forgotten cleanup tasks.

The first release intentionally stays conservative. It does not delete uncertain code, rewrite architecture, or require an artificial intelligence model to decide deterministic facts.

## Workflow

```text
REPOSITORY
    |
    v
SCAN
    |
    +--> FINDINGS
    |      |
    |      +--> human report
    |      +--> JSON report
    |      +--> CI decision
    |
    +--> SAFE FIXES (explicit opt-in)
```

## Capabilities

| Capability | Outcome |
| --- | --- |
| **Repository checks** | Detect missing README / `.gitignore` and oversized files |
| **Security checks** | Flag tracked environment files and strong known-secret patterns |
| **Documentation checks** | Detect broken local Markdown links |
| **Hygiene checks** | Detect and safely normalize selected source/configuration whitespace |
| **Health score** | Turn findings into a simple, repeatable repository signal |
| **JSON output** | Make findings consumable by automation and future integrations |

## Installation

Steward is in early development. Install from a local checkout:

```bash
git clone https://github.com/gODtECH-Ctl-Create/gODtECH-Steward.git
cd gODtECH-Steward
npm install
npm run build
npm install -g .
```

The installed commands are:

```bash
steward --help
gotek-steward --help
```

## Usage

Initialize repository configuration:

```bash
steward init
```

Scan a repository:

```bash
steward scan
```

Run the diagnostic view:

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

Apply only the currently supported safe fixes:

```bash
steward fix --safe
```

For continuous integration (CI), Steward can fail when a configured severity threshold is found:

```bash
steward scan --ci
```

## Configuration

`steward init` creates `.steward.json`. The configuration is intentionally small and repository-owned so a fork can change its own housekeeping policy without changing the engine.

```json
{
  "version": 1,
  "exclude": ["vendor"],
  "maxFileSizeBytes": 2097152,
  "largeFileThresholdBytes": 5242880,
  "ci": {
    "failOn": "critical"
  }
}
```

## GitHub Action

The repository includes a composite GitHub Action using the same compiled Steward engine as the CLI.

After the project is merged to the default branch or released, a consumer workflow can use the repository as an Action:

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

During development, pin the Action to the development branch or a release tag rather than relying on moving references.

## Architecture

```text
File collector + Git facts
            |
            v
       Rule modules
            |
            v
         Findings
            |
     +------+------+-----+
     |      |      |     |
   Text    JSON    CI   Safe fix
   report  report        engine
```

Read the implementation notes in [`docs/architecture.md`](docs/architecture.md).

## Safety model

Steward follows a conservative rule: **observe first, explain second, modify only when the fix is deterministic and explicitly requested**.

Security findings are never automatically remediated by the current engine. `fix` refuses to modify a repository unless `--safe` is present.

## Status

**Foundation / early development**

The core scanning model, initial rules, CLI, JSON reporting, safe remediation path, configuration format, tests, and Action entrypoint are established. Broader language-aware analysis, dependency graph analysis, richer GitHub metadata checks, and product-health checks remain planned.
