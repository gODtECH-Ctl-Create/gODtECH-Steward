<a name="readme-top"></a>

<p align="center">
  <img src="./site/assets/steward-hero.svg" alt="gODtECH Steward repository health control room" width="100%" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@godtech/steward"><img src="https://img.shields.io/npm/v/@godtech/steward?style=for-the-badge&label=npm" alt="npm version" /></a>
  <a href="https://github.com/gODtECH-Ctl-Create/gODtECH-Steward/releases/tag/v0.1.1"><img src="https://img.shields.io/badge/release-v0.1.1-8bffb0?style=for-the-badge&labelColor=0b0d12" alt="Steward v0.1.1 release" /></a>
  <a href="https://github.com/gODtECH-Ctl-Create/gODtECH-Steward/actions"><img src="https://img.shields.io/github/actions/workflow/status/gODtECH-Ctl-Create/gODtECH-Steward/ci.yml?branch=MASTER&style=for-the-badge&label=CI" alt="CI status" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-72e7ff?style=for-the-badge&labelColor=0b0d12" alt="Apache License 2.0" /></a>
</p>

<p align="center">
  <strong>Deterministic software and repository housekeeping.</strong><br />
  Scan without guessing. Explain what is unhealthy. Fix only what is safe. Track health with stable evidence.
</p>

<p align="center">
  <a href="https://godtech-ctl-create.github.io/gODtECH-Steward/">Website</a> ·
  <a href="https://www.npmjs.com/package/@godtech/steward">npm</a> ·
  <a href="https://github.com/gODtECH-Ctl-Create/gODtECH-Steward/releases/tag/v0.1.1">Release</a> ·
  <a href="#-quick-start">Quick start</a> ·
  <a href="#-what-steward-checks">What it checks</a> ·
  <a href="#-architecture">Architecture</a>
</p>

---

## ⚡ The 30-second version

**gODtECH Steward** turns software housekeeping into a repeatable engineering step.

It inspects a repository deterministically, produces explainable findings, calculates a health signal, and offers only explicitly supported safe remediation. The normal scan path does not require artificial intelligence (AI), a hosted service, or a model call.

```text
REPOSITORY
    ↓
CONFIG + GIT FACTS
    ↓
FILE COLLECTION
    ↓
RULE PACKS
    ↓
FINDINGS + FINGERPRINTS
    ↓
REPORT / JSON / CI / FORGE EVIDENCE
    ↓
EXPLICIT SAFE REMEDIATION
```

Steward is intentionally focused: it keeps repositories healthy without trying to become another orchestrator, scaffolder, or autonomous coding agent.

## 🚀 Quick start

### Install the current public release

```bash
npm install -g @godtech/steward@0.1.1
steward --version
```

On Windows PowerShell, when script execution policy blocks the generated `.ps1` shim, invoke the Windows command shim directly:

```powershell
steward.cmd --version
```

### Scan a repository

```bash
steward scan .
steward scan . --json
steward doctor .
```

Preview safe remediation:

```bash
steward fix . --safe --dry-run
```

## 🧭 What Steward checks

| Area | Checks |
| --- | --- |
| **Repository** | README, `.gitignore`, large files, disposable tracked artifacts, generated test/tool outputs |
| **Security** | Tracked environment files and high-confidence credential patterns |
| **Documentation** | Broken and malformed local Markdown links |
| **Dependencies** | Package-manager and lockfile consistency, invalid `package.json` |
| **Project metadata** | Package identity and publishable-package metadata completeness |
| **Maintenance** | Merge-conflict markers and TODO/FIXME maintenance markers |
| **Hygiene** | Trailing whitespace and missing final newlines |
| **Reporting** | Health score, severity/category counts, JSON output, stable fingerprints |
| **Rule packs** | Versioned `core` and `security` packs with pack-level or rule-level disabling |
| **Deltas** | Deterministic before/after health and finding changes |
| **FORGE evidence** | Safe observed repository-health evidence for gODtECH FORGE workflows |
| **Trusted packs** | Manifest, compatibility, digest, signature, policy, WebAssembly boundary verification, and source-level runtime hardening |

Steward deliberately does **not** delete uncertain files, rewrite architecture, or require artificial intelligence for deterministic repository facts.

## 🌀 How it works

```mermaid
flowchart LR
    A[Repository] --> B[Config + Git facts]
    B --> C[File collection]
    C --> D[Rule packs]
    D --> E[Deterministic findings]
    E --> F[Report / JSON / CI]
    E --> G[FORGE evidence]
    E --> H[Safe remediation]
```

Rules are read-only analyzers. Findings carry severity, confidence, remediation guidance, and a stable fingerprint. Safe remediation is a separate explicit operation.

## 🛡️ Safety model

**Observe first. Explain second. Modify only when the requested fix is deterministic and explicitly enabled.**

`scan` never writes. `fix` refuses to modify files without `--safe`. `--dry-run` never writes. Security findings are observation-only.

External executable rule packs are not part of the normal scan path. Verification, trust policy, WebAssembly isolation, resource limits, and execution governance remain separate security gates.

## 📦 GitHub Action

Steward ships a composite GitHub Action using the same compiled engine as the CLI:

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
      - uses: gODtECH-Ctl-Create/gODtECH-Steward@v0.1.1
```

For machine-readable CI output:

```yaml
      - uses: gODtECH-Ctl-Create/gODtECH-Steward@v0.1.1
        with:
          args: '["scan", "--ci", "--json"]'
```

For production, pin the Action to a reviewed release tag or exact commit.

## 📊 Reports and evidence

Write a report:

```bash
steward report . --output current.json
```

Compare against an earlier report:

```bash
steward report . --output current.json --compare previous.json
```

Export observed repository-health evidence for gODtECH FORGE:

```bash
steward forge-evidence . --output .steward-forge-evidence.json
```

Steward's evidence adapter reports observed repository facts only. It does not invent benchmark identities, provider billing, productivity claims, or control-versus-assisted measurements.

## 🔐 Trusted external rule packs

The public `v0.1.1` line remains verification-first. Verification covers:

```text
manifest schema
+ exact rule API compatibility
+ allowlist policy
+ trusted publisher
+ SHA-256 artifact match
+ Ed25519 signature verification
+ valid WASM module boundary
+ optional sandbox probe
```

Current `MASTER` also contains the post-`v0.1.1` bounded WASM runtime hardening from PR #37: worker isolation, explicit memory ceilings, execution timeouts, input/output limits, pointer validation, and adversarial execution tests. Those post-release changes are **not claimed as part of the published `0.1.1` npm artifact**.

Normal scans and the GitHub Action still do not automatically execute third-party packs. See [`docs/trusted-rule-packs.md`](docs/trusted-rule-packs.md) and [`docs/external-rule-api.md`](docs/external-rule-api.md).

## 🔗 gODtECH ecosystem

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

- **gODtECH FORGE** may invoke Steward through the public CLI, JSON result contract, or `forge-evidence` adapter when repository health matters.
- **StackPilot** may consume generic Steward findings while keeping scaffolding and golden-path checks under its own control.
- Neither integration is required for Steward to work.

## 🧠 Architecture

```text
CLI / GitHub Action
        |
        v
Configuration + Git facts
        |
        v
File collector
        |
        v
Versioned rule packs
   |    |    |    |
   v    v    v    v
 repo security docs maintenance ...
        |
        v
Stable findings + fingerprints
     /   |    |    \
    v    v    v     v
 report JSON  CI  evidence
        |
        v
 explicit safe remediation
```

See [`docs/architecture.md`](docs/architecture.md), [`docs/rules.md`](docs/rules.md), [`docs/integration.md`](docs/integration.md), [`docs/deltas.md`](docs/deltas.md), and [`docs/ROADMAP.md`](docs/ROADMAP.md).

## 🧰 Command map

| Command | Purpose |
| --- | --- |
| `steward init` | Create repository-owned configuration |
| `steward scan` | Scan and report repository health |
| `steward doctor` | Diagnose repository health with aggregate counts |
| `steward rules` | Inspect active rule packs and rule states |
| `steward report` | Write JSON health reports and compare deltas |
| `steward forge-evidence` | Export observed health evidence for FORGE |
| `steward fix --safe` | Apply only explicitly supported safe fixes |
| `steward pack verify` | Verify trusted external pack artifacts without enabling normal-scan execution |

## 📍 Status

**Published: v0.1.1**

The public package includes the deterministic engine, CLI, GitHub Action, stable machine-readable contracts, safe remediation model, health deltas, FORGE evidence adapter, StackPilot integration boundary, trusted-pack verification foundation, and shared gODtECH CLI identity.

**Current source:** `MASTER` is ahead of the published release and includes additional bounded external-WASM runtime hardening merged in PR #37. Governance/admission work continues separately before any dedicated opt-in third-party execution surface is considered.

## 📄 License

gODtECH Steward is available under the **Apache License 2.0**. See [`LICENSE`](LICENSE).

---

<p align="center">
  <strong>Keep your software healthy.</strong><br />
  <a href="https://www.npmjs.com/package/@godtech/steward">Install from npm</a> ·
  <a href="https://godtech-ctl-create.github.io/gODtECH-Steward/">Visit the website</a> ·
  <a href="https://github.com/gODtECH-Ctl-Create/gODtECH-Steward/releases/tag/v0.1.1">View v0.1.1</a>
</p>
