# gODtECH Steward state

## Current stage
PUBLIC RELEASE + PRODUCT PRESENTATION

## Current baseline

Steward has a deterministic scan engine, first-class rule contracts, versioned machine-readable reporting, repository-owned configuration, conservative safe remediation, a composite GitHub Action, a reproducible npm installation path, stable finding fingerprints, before/after health deltas, expanded deterministic repository-health coverage, consumer-style package verification, a privacy-safe gODtECH FORGE evidence adapter, a documented StackPilot integration contract, trusted external rule-pack verification, and a conservative WebAssembly (WASM) sandbox probe.

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
- `pack verify`

## Integration contracts

The public scan result is versioned as `schemaVersion: 1` and remains the primary integration boundary.

`steward forge-evidence` emits a separately defined `repository-health` evidence artifact for gODtECH FORGE. It does not fabricate FORGE benchmark identity, task framing, control versus assisted runs, provider billing, or productivity claims.

StackPilot consumes Steward's public scan contract optionally and observationally. StackPilot owns scaffolding and `readiness-v1`; Steward remains the canonical owner of generic housekeeping.

## Distribution contract

The package manifest ships the consumer-facing compiled engine under `dist/src`, schemas, README, license, and GitHub Action runner files. Development TypeScript source and `node_modules` are not included.

`npm run verify:package` builds and inspects the actual npm tarball, installs it offline into a clean consumer directory, exercises both CLI aliases, validates the scan contract, exercises `forge-evidence`, runs the packaged Action runner, and rejects malformed Action argument payloads.

## Release state

- Public npm package: `@godtech/steward@0.1.0`.
- Git release: `v0.1.0`.
- Release workflow uses npm Trusted Publishing and GitHub artifact attestations.
- Package and GitHub Release were verified after the corrected tag-driven release run.
- Windows end-user smoke test verified `steward.cmd --version`, help, scan, JSON output, and doctor flow.

## Trusted external rule-pack design

The design and verification prototype are complete, but executable third-party packs remain disabled.

The accepted design requires a versioned manifest, explicit Steward rule API compatibility, SHA-256 artifact verification, trusted Ed25519 publisher signatures, repository/user allow policy, a read-only capability boundary, WebAssembly (WASM) execution, bounded resources, and audit output.

Arbitrary JavaScript/Node.js rule execution is not an accepted trust model. External packs cannot write repositories, spawn processes, access secrets, or use network/filesystem capabilities by default. Remediation remains Steward-owned and finding-driven.

## Product presentation

- GitHub Pages landing page is maintained under `site/`.
- Static Pages deployment workflow is `.github/workflows/pages.yml`.
- Product README now links to the npm package, public release, website, install paths, ecosystem integrations, and release provenance.
- Presentation should continue to reflect verified product behavior and must not turn prototypes into production claims.

## Verification state

- Rule-pack milestone merged: `2effe817497a091d05b19bf7f615a7bdaabc3795`.
- Reproducible-install milestone merged: `84fa7f7765e3523cdb7daf7d737e319920e640d7`.
- Evidence/delta milestone merged: `8475f51ba40c8b99d5a3848f58e434b1a6864ca6`.
- Deterministic health expansion merged: `7d0934a4ee9cd4f9568bb7515a36b64bcf376e71`.
- Distribution validation milestone merged: `0b9e5f88a9462c5e6f559b4b9ecce38f24edeebb`.
- FORGE evidence adapter merged: `c0d5d2364e7511a58fc86fb4d1e7c8ade92fbde5`.
- StackPilot adapter completed externally via `gODtECH-Ctl-Create/StackPilot#19`.
- Trusted rule-pack verification milestone merged and verified.
- Release preparation, Windows distribution fix, release cleanup, and release-workflow ordering fix merged through PRs #27-#30.
- Public `v0.1.0` release verified successfully.

## Remaining product work

- Improve signal quality where test fixtures or intentional documentation markers create noisy self-findings.
- Add further deterministic health and language-aware analysis only where evidence quality justifies the added complexity.
- Complete the full audited execution model before enabling trusted external executable packs.

## Safety boundary

Scanning is read-only. Safe remediation requires explicit `--safe`, dry runs do not write, security findings are observation-only, and external executable rule packs remain disabled until the complete trust, host API, resource accounting, audit, provenance, and malicious-pack gates are satisfied.
