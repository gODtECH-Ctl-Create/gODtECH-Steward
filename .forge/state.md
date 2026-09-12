# gODtECH Steward state

## Current stage
FORGE EVIDENCE ADAPTER

## Current baseline

Steward has a deterministic scan engine, first-class rule contracts, versioned machine-readable reporting, repository-owned configuration, conservative safe remediation, a composite GitHub Action, a reproducible npm installation path, stable finding fingerprints, before/after health deltas, expanded deterministic repository-health coverage, and consumer-style package verification.

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

## FORGE evidence adapter

`steward forge-evidence` emits an observed `repository-health` evidence artifact for gODtECH FORGE workflows. It is deliberately separate from FORGE's benchmark result schema and does not fabricate benchmark IDs, control/assisted runs, provider billing, or productivity claims.

The artifact is versioned independently as `schemaVersion: 1`, projects only safe finding identity/location fields, includes health and severity/category observations, carries optional Steward scan deltas, and explicitly records its limitations.

## Distribution contract

The package manifest ships only the consumer-facing compiled engine under `dist/src`, schemas, README, license, and GitHub Action runner files. The development source tree is not included in the npm package.

`npm run verify:package` builds and inspects the actual npm tarball, installs it into a clean consumer directory with offline package installation, exercises both command aliases, validates the `schemaVersion: 1` result, exercises `forge-evidence`, executes the packaged Action runner, and verifies malformed Action argument payloads are rejected.

The dedicated Distribution workflow runs this consumer-style verification on pushes and pull requests. This keeps the CLI, package archive, Action runner, and FORGE evidence adapter tied to the same compiled `dist/` artifact.

## Integration contract

The public scan result is versioned as `schemaVersion: 1` and remains the primary boundary for future gODtECH FORGE and StackPilot integration. The FORGE evidence adapter is an additional observed-evidence projection and does not replace the core scan contract.

Findings expose stable SHA-256 fingerprints for consumer-side correlation. Comparison deltas contain only finding identity and location references, not source contents or secret values.

## Verification state

- Rule-pack milestone merged: `2effe817497a091d05b19bf7f615a7bdaabc3795`.
- Reproducible-install milestone merged: `84fa7f7765e3523cdb7daf7d737e319920e640d7`.
- Evidence/delta milestone merged: `8475f51ba40c8b99d5a3848f58e434b1a6864ca6`.
- Deterministic health expansion merged: `7d0934a4ee9cd4f9568bb7515a36b64bcf376e71`.
- Distribution validation milestone merged: `0b9e5f88a9462c5e6f559b4b9ecce38f24edeebb`.

This FORGE evidence adapter milestone must pass the same Continuous Integration (CI), Steward scan, and package-distribution verification workflows before merge.

## Known limitations

- Language-aware static analysis is not yet part of the core.
- Security detection is intentionally high-confidence and does not replace dedicated secret-scanning services.
- External executable rule packs are deferred until trust, compatibility, and provenance rules exist.
- StackPilot integration remains planned and optional.
- npm publication and release tagging have not yet been performed.
- Release-grade package signing and artifact provenance are future work.
