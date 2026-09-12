# gODtECH Steward state

## Current stage
ECOSYSTEM INTEGRATION READY

## Current baseline

Steward has a deterministic scan engine, first-class rule contracts, versioned machine-readable reporting, repository-owned configuration, conservative safe remediation, a composite GitHub Action, a reproducible npm installation path, stable finding fingerprints, before/after health deltas, expanded deterministic repository-health coverage, consumer-style package verification, and a privacy-safe gODtECH FORGE evidence adapter.

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

StackPilot integration remains optional and should consume generic Steward findings through the public contract without copying generic housekeeping rules.

## Distribution contract

The package manifest ships the consumer-facing compiled engine under `dist/src`, schemas, README, license, and GitHub Action runner files. Development TypeScript source and `node_modules` are not included.

`npm run verify:package` builds and inspects the actual npm tarball, installs it offline into a clean consumer directory, exercises both CLI aliases, validates the scan contract, exercises `forge-evidence`, runs the packaged Action runner, and rejects malformed Action argument payloads.

## Verification state

- Rule-pack milestone merged: `2effe817497a091d05b19bf7f615a7bdaabc3795`.
- Reproducible-install milestone merged: `84fa7f7765e3523cdb7daf7d737e319920e640d7`.
- Evidence/delta milestone merged: `8475f51ba40c8b99d5a3848f58e434b1a6864ca6`.
- Deterministic health expansion merged: `7d0934a4ee9cd4f9568bb7515a36b64bcf376e71`.
- Distribution validation milestone merged: `0b9e5f88a9462c5e6f559b4b9ecce38f24edeebb`.
- FORGE evidence adapter merged: `c0d5d2364e7511a58fc86fb4d1e7c8ade92fbde5`.

All completed milestones were verified through the repository's Continuous Integration (CI), Steward scan, and relevant distribution gates before merge.

## Remaining product work

- Optional StackPilot adapter.
- Trusted external rule-pack distribution with explicit compatibility, trust, and provenance controls.
- npm publication and release tagging.
- Release-grade package signing and artifact provenance.
- Further deterministic health and language-aware analysis only where evidence quality justifies the added complexity.

## Safety boundary

Scanning is read-only. Safe remediation requires explicit `--safe`, dry runs do not write, security findings are observation-only, and consumers must not treat `fixable` as permission to mutate without Steward's own safety checks.
