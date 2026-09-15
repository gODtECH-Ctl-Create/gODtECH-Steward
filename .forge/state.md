# gODtECH Steward state

## Current stage
PUBLIC RELEASE + TRUSTED PACK EXECUTION HARDENING

## Current baseline

Steward has a deterministic scan engine, first-class rule contracts, versioned machine-readable reporting, repository-owned configuration, conservative safe remediation, a composite GitHub Action, a reproducible npm installation path, stable finding fingerprints, before/after health deltas, expanded deterministic repository-health coverage, consumer-style package verification, a privacy-safe gODtECH FORGE evidence adapter, a documented StackPilot integration contract, trusted external rule-pack verification, a versioned no-import external rule ABI, and a security-gated WebAssembly (WASM) runtime harness with bounded resources and adversarial tests.

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

`npm run verify:package` builds and inspects the actual npm tarball, installs it offline into a clean consumer directory, exercises both CLI aliases, validates the scan contract, exercises `forge-evidence`, runs the packaged Action runner, rejects malformed Action argument payloads, and verifies the external rule API/runtime/worker artifacts are present.

## Release state

- Public npm package: `@godtech/steward@0.1.1`.
- Git release: `v0.1.1`.
- `v0.1.1` includes the shared gODtECH CLI Identity integration and versioned external rule ABI from PR #36.
- Release workflow uses npm Trusted Publishing and GitHub artifact attestations.
- GitHub Release assets include the package tarball, SHA-256 checksum file, and SPDX Software Bill of Materials (SBOM).
- Windows package verification remains part of the distribution gate.
- `MASTER` is ahead of the published release because PR #37 merged after `v0.1.1`.

## Trusted external rule-pack execution model

Executable third-party packs remain disabled in normal scans and the GitHub Action.

The current source model includes:

- versioned manifest and external rule ABI contracts;
- SHA-256 artifact verification;
- trusted Ed25519 publisher signatures;
- repository/user allow policy;
- deterministic repository-relative snapshot input;
- no-import WASM execution boundary;
- one defined bounded 32-bit linear memory with an explicit maximum;
- configured memory ceiling enforcement before worker startup;
- bounded serialized input and output;
- isolated worker execution with a hard timeout;
- pointer/range validation before memory reads/writes;
- strict returned-finding validation and `maxFindings` enforcement;
- adversarial tests for infinite loops, memory declarations/growth, forbidden imports, malformed/oversized output, and oversized input.

Arbitrary JavaScript/Node.js rule execution is not an accepted trust model. External packs cannot write repositories, spawn processes, access secrets, or use network/filesystem capabilities by default. Remediation remains Steward-owned and finding-driven.

## Verification state

- Rule-pack milestone merged: `2effe817497a091d05b19bf7f615a7bdaabc3795`.
- Reproducible-install milestone merged: `84fa7f7765e3523cdb7daf7d737e319920e640d7`.
- Evidence/delta milestone merged: `8475f51ba40c8b99d5a3848f58e434b1a6864ca6`.
- Deterministic health expansion merged: `7d0934a4ee9cd4f9568bb7515a36b64bcf376e71`.
- Distribution validation milestone merged: `0b9e5f88a9462c5e6f559b4b9ecce38f24edeebb`.
- FORGE evidence adapter merged: `c0d5d2364e7511a58fc86fb4d1e7c8ade92fbde5`.
- StackPilot adapter completed externally via `gODtECH-Ctl-Create/StackPilot#19`.
- Trusted rule-pack verification milestone merged and verified.
- External rule ABI/host contract merged through PR #36; issue #33 completed.
- Bounded WASM runtime and adversarial pack tests merged through PR #37; issue #34 completed.
- Shared CLI Identity integration merged through PR #38.
- Public `v0.1.1` release prepared through PR #39 and published successfully.

## Remaining product work

- Complete #35: structured audit records, artifact provenance policy, publisher/key revocation, explicit execution enablement, compatibility/rollback behavior, and end-to-end denial tests.
- Keep external execution disabled until #35 is complete and reviewed.
- Improve signal quality where test fixtures or intentional documentation markers create noisy self-findings.
- Add further deterministic health and language-aware analysis only where evidence quality justifies the added complexity.

## Safety boundary

Scanning is read-only. Safe remediation requires explicit `--safe`, dry runs do not write, security findings are observation-only, and external executable rule packs remain disabled in normal workflows until the complete audit, provenance, revocation, and explicit enablement gate is satisfied.
