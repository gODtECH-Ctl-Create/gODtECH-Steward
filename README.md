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
| **Repository** | README, `.gitignore`, large files, disposable tracked artifacts, generated test/tool outputs |
| **Security** | Tracked environment files and high-confidence credential patterns |
| **Documentation** | Broken and malformed local Markdown links |
| **Dependencies** | Package-manager and lockfile consistency, invalid `package.json` |
| **Project metadata** | Package identity and publishable-package metadata completeness |
| **Maintenance** | Unresolved merge-conflict markers and TODO/FIXME maintenance markers |
| **Hygiene** | Trailing whitespace and missing final newlines |
| **Reporting** | Health score, severity counts, category counts, JSON output, stable finding fingerprints |
| **Rule packs** | Versioned `core` and `security` packs with pack-level or rule-level disabling |
| **Deltas** | Deterministic before/after health, finding, severity, and category changes |
| **FORGE evidence** | Safe observed repository-health evidence for gODtECH FORGE workflows |
| **Trusted packs** | Manifest, compatibility, artifact digest, publisher signature, policy, and WASM boundary verification |

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
FINDINGS + FINGERPRINTS
    |
    +--> human report
    +--> JSON report
    +--> CI decision
    +--> before/after delta
    +--> FORGE evidence
    +--> explicit safe remediation

EXTERNAL PACK (OPT-IN ONLY)
    |
    v
MANIFEST VALIDATION
    |
    v
POLICY + PUBLISHER TRUST
    |
    v
SHA-256 + Ed25519
    |
    v
WASM VALIDATION / SANDBOX PROBE
    |
    v
EXECUTION STILL DISABLED IN 0.1.x
```

## Installation

Steward is currently developed from source.

```bash
git clone https://github.com/gODtECH-Ctl-Create/gODtECH-Steward.git
cd gODtECH-Steward
npm ci
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

Compare the current repository with an earlier Steward report:

```bash
steward report --output current.json --compare previous.json
```

The comparison adds deterministic health, finding, severity, and category deltas. Finding fingerprints remain stable when an issue moves within the same file, and comparison output never copies source contents into delta evidence.

Export observed repository-health evidence for gODtECH FORGE (Framework for Orchestrated Reasoning, Governance & Engineering):

```bash
steward forge-evidence
```

Write the evidence artifact for a workflow step or retained benchmark evidence:

```bash
steward forge-evidence . --output .steward-forge-evidence.json
```

The evidence artifact is intentionally **not** a FORGE benchmark result. It contains observed Steward scan data only and does not invent benchmark IDs, control/assisted runs, provider metrics, or productivity claims.

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

Verify a future external rule-pack artifact against repository trust policy:

```bash
steward pack verify manifest.json --artifact pack.wasm
```

Run the conservative WebAssembly (WASM) sandbox probe as an additional verification step:

```bash
steward pack verify manifest.json --artifact pack.wasm --sandbox --json
```

The command validates the manifest, allowlist, trusted publisher, artifact size, SHA-256 digest, Ed25519 signature, and WASM module boundary. It does **not** enable third-party rule execution in the current release line.

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
  },
  "externalPacks": {
    "requireSigned": true,
    "allow": ["example.security-hygiene"],
    "trustedPublishers": ["example-org"],
    "trustedKeys": {
      "ed25519:example-key-1": "-----BEGIN PUBLIC KEY-----..."
    }
  }
}
```

The external-pack policy is **opt-in**. A malformed trust policy fails closed for `steward pack verify`. The current engine does not load arbitrary executable third-party rule packs during repository scans.

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

## GitHub Action

Steward includes a composite GitHub Action that invokes the same compiled engine as the CLI.

```yaml
name: Steward

on:
  pull_request:
  push

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

## Trusted external rule packs

External packs are not part of Steward's built-in scan path. They must first pass the versioned trust contract in [`schemas/steward-rule-pack-manifest.schema.json`](schemas/steward-rule-pack-manifest.schema.json) and the repository policy described in [`schemas/steward-external-pack-policy.schema.json`](schemas/steward-external-pack-policy.schema.json).

Trust verification requires:

```text
manifest schema
+ exact rule API compatibility
+ exact result schema compatibility
+ allowlisted pack identity
+ trusted publisher
+ SHA-256 artifact match
+ Ed25519 signature verification
+ valid WASM artifact
+ capability declaration
+ bounded execution metadata
```

The sandbox prototype additionally rejects WASM modules with imports and performs a bounded worker-based instantiation probe. The probe is intentionally not a permission to execute third-party rules in the release scanner yet. Memory accounting for arbitrary defined WASM linear memory and the full rule host API remain future work.

Arbitrary JavaScript or Node.js rule packages are not a supported trust mechanism.

See [`docs/trusted-rule-packs.md`](docs/trusted-rule-packs.md) for the complete security model.

## Distribution verification

Before a release, Steward can verify the actual npm package consumers receive:

```bash
npm run verify:package
```

The verification builds the package, inspects its archive contents, installs the generated tarball into a clean consumer directory, executes both `steward` and `godtech-steward`, validates the versioned JSON scan contract, exercises the `forge-evidence` command, runs the packaged GitHub Action, and confirms malformed Action argument payloads are rejected.

The distribution workflow runs this verification remotely on every push and pull request. This keeps the CLI, package archive, Action runner, and Forge evidence adapter tied to the same compiled `dist/` artifact.

## Safety model

Steward follows one rule: **observe first, explain second, modify only when the requested fix is deterministic and explicitly enabled**.

`fix` always refuses to modify files without `--safe`. `--dry-run` never writes. Security findings are observation-only. The current safe fixer only normalizes formatting-level hygiene findings.

External packs add a separate trust boundary: **verification first, execution last**. A pack that fails identity, compatibility, integrity, signature, policy, or sandbox checks is rejected before execution. External packs cannot invoke Steward remediation.

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

- **gODtECH FORGE** may invoke Steward through the public command, JSON result contract, or `forge-evidence` adapter when repository-health evidence is relevant.
- **StackPilot** may optionally consume generic Steward findings while keeping its own golden-path checks separate.
- Neither integration is required for Steward's standalone operation.
- Generic maintenance rules have one canonical implementation in Steward.
- External rule packs remain Steward-owned and must use the versioned trust boundary rather than private FORGE or StackPilot APIs.

The stable scan result is versioned as `schemaVersion: 1`. The dedicated FORGE evidence artifact is separately versioned as `schemaVersion: 1` and explicitly identifies itself as observed `repository-health` evidence rather than a benchmark result. See [`docs/integration.md`](docs/integration.md), [`docs/deltas.md`](docs/deltas.md), [`schemas/steward-result.schema.json`](schemas/steward-result.schema.json), and [`schemas/steward-rule-pack-manifest.schema.json`](schemas/steward-rule-pack-manifest.schema.json).

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
                    stable findings + fingerprints
                            |
              +-------------+-------------+
              |             |             |
              v             v             v
            text          JSON            CI
           report         report         gate
                            |
                            +---------> FORGE evidence
                            |
                            v
                      safe remediation
                            |
                            v
                     optional delta

External pack verification is a separate opt-in path:
manifest -> policy -> digest -> signature -> WASM boundary -> sandbox probe
```

See [`docs/architecture.md`](docs/architecture.md), [`docs/rules.md`](docs/rules.md), [`docs/deltas.md`](docs/deltas.md), [`docs/integration.md`](docs/integration.md), [`docs/trusted-rule-packs.md`](docs/trusted-rule-packs.md), and [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Development

The repository follows the gODtECH FORGE delivery model: material work is tracked, implemented on a dedicated branch, verified, and documented before merge.

```bash
npm ci
npm run check
npm run build
npm test
npm run verify:package
```

## Status

**Active development / evidence-aware maintenance**

The deterministic engine, CLI, reporting contract, reproducible installation path, configuration validation, versioned rule packs, stable finding fingerprints, before/after deltas, broader repository-health checks, consumer-style package verification, Forge evidence adapter, StackPilot report adapter boundary, conservative remediation model, and GitHub Action integration are established. Trusted external pack verification and a conservative WASM sandbox probe are now prototyped; external executable rule execution remains disabled until the full host API, resource accounting, provenance, audit, and malicious-pack test suite are release-ready.
