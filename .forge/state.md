# gODtECH Steward state

## Current stage
TRUSTED RULE-PACK DESIGN COMPLETE

## Current baseline

Steward has a deterministic scan engine, first-class rule contracts, versioned machine-readable reporting, repository-owned configuration, conservative safe remediation, a composite GitHub Action, a reproducible npm installation path, stable finding fingerprints, before/after health deltas, expanded deterministic repository-health coverage, consumer-style package verification, a privacy-safe gODtECH FORGE evidence adapter, and a documented StackPilot integration contract.

## Active rule packs

- `core@2`: repository, documentation, dependency, maintenance, metadata, and hygiene checks.
- `security@1`: high-confidence repository security and credential-pattern checks.

## Current CLI

- `init`
- `scan`
- `doctor`
- `report`
- `report --compare <report>`
- `rules`
- `forge-evidence`
- `fix --safe`

## Integration contracts

The public scan result is versioned as `schemaVersion: 1` and remains the primary integration boundary.

`steward forge-evidence` emits a separately defined `repository-health` evidence artifact for gODtECH FORGE. It does not fabricate FORGE benchmark identity, task framing, control versus assisted runs, provider billing, or productivity claims.

StackPilot consumes Steward's public scan contract optionally and observationally. StackPilot owns scaffolding and `readiness-v1`; Steward remains the canonical owner of generic housekeeping.

## Distribution contract

The package manifest ships the consumer-facing compiled engine under `dist/src`, schemas, README, license, and GitHub Action runner files. Development TypeScript source and `node_modules` are not included.

`npm run verify:package` builds and inspects the actual npm tarball, installs it offline into a clean consumer directory, exercises both CLI aliases, validates the scan contract, exercises `forge-evidence`, runs the packaged Action runner, and rejects malformed Action argument payloads.

## Trusted external rule-pack design

The external pack design is complete but executable third-party packs remain disabled.

The accepted design requires a versioned manifest, explicit Steward rule API compatibility, SHA-256 artifact verification, trusted Ed25519 publisher signatures, repository/user allow policy, a read-only capability boundary, WebAssembly (WASM) execution, bounded resources, and audit output.

Arbitrary JavaScript/Node.js rule execution is not an accepted trust model. External packs cannot write repositories, spawn processes, access secrets, or use network/filesystem capabilities by default. Remediation remains Steward-owned and finding-driven.

## Verification state

- Rule-pack milestone merged: `2effe817497a091d05b19bf7f615a7bdaabc3795`.
- Reproducible-install milestone merged: `84fa7f7765e3523cdb7daf7d737e319920e640d7`.
- Evidence/delta milestone merged: `8475f51ba40c8b99d5a3848f58e434b1a6864ca6`.
- Deterministic health expansion merged: `7d0934a4ee9cd4f9568bb7515a36b64bcf376e71`.
- Distribution validation milestone merged: `0b9e5f88a9462c5e6f559b4b9ecce38f24edeebb`.
- FORGE evidence adapter merged: `c0d5d2364e7511a58fc86fb4d1e7c8ade92fbde5`.
- StackPilot adapter completed externally via `gODtECH-Ctl-Create/StackPilot#19`.

The trust-design milestone must pass the repository's normal Continuous Integration (CI) and Steward scan gates before merge. No external executable pack loading is introduced by this milestone.

## Remaining product work

- Implement the trusted external rule-pack verification and sandbox prototype.
- npm publication and release tagging.
- Release-grade package signing and artifact provenance.
- Further deterministic health and language-aware analysis only where evidence quality justifies the added complexity.

## Safety boundary

Scanning is read-only. Safe remediation requires explicit `--safe`, dry runs do not write, security findings are observation-only, and external rule packs are not executable until the trust and sandbox gates are implemented and verified.
