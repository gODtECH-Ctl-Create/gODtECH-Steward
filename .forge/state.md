# gODtECH Steward state

## Current stage
FORGE EVIDENCE ADAPTER

## Current baseline

Steward has a deterministic scan engine, first-class rule contracts, versioned machine-readable reporting, repository-owned configuration, conservative safe remediation, a composite GitHub Action, a reproducible npm installation path, stable finding fingerprints, before/after health deltas, expanded deterministic repository-health coverage, and consumer-style distribution validation.

## Active rule packs

- `core@2`: repository, documentation, dependency, maintenance, metadata, and hygiene checks.
- `security@1`: high-confidence repository security and credential-pattern checks.

## Current CLI

- `init`
- `scan`
- `doctor`
- `report`
- `report --compare <report>`
- `forge-evidence`
- `rules`
- `fix --safe`

## FORGE evidence contract

**gODtECH FORGE (Framework for Orchestrated Reasoning, Governance & Engineering)** has a benchmark result schema for full controlled benchmark runs. Steward does not fabricate benchmark identifiers, control/assisted branches, task framing, provider billing, or productivity metrics.

`steward forge-evidence` emits a separate observed `repository-health` evidence artifact with its own `schemaVersion: 1`. It contains Steward health, scan scope, rule-pack state, safe finding references, the configured Continuous Integration (CI) threshold and observed result, and optional scan deltas.

Source contents, finding details, and detected secret values are intentionally omitted from the evidence projection.

## Distribution contract

The package manifest ships only the consumer-facing compiled engine under `dist/src`, schemas, README, license, and GitHub Action runner files. The development source tree is not included in the npm package.

`npm run verify:package` builds and inspects the actual npm tarball, installs it into a clean consumer directory with offline package installation, exercises both command aliases, validates the `schemaVersion: 1` result, exercises the `forge-evidence` command, executes the packaged Action runner, and verifies malformed Action argument payloads are rejected.

## Integration contract

The public machine-readable scan result is versioned as `schemaVersion: 1` and is the boundary for future gODtECH FORGE and StackPilot integration. Neither integration is a runtime dependency for Steward.

Findings expose stable SHA-256 fingerprints for consumer-side correlation. Comparison deltas and FORGE evidence contain only finding identity and location references, not source contents or secret values.

## Verification state

- Rule-pack milestone merged: `2effe817497a091d05b19bf7f615a7bdaabc3795`.
- Reproducible-install milestone merged: `84fa7f7765e3523cdb7daf7d737e319920e640d7`.
- Evidence/delta milestone merged: `8475f51ba40c8b99d5a3848f58e434b1a6864ca6`.
- Deterministic health expansion merged: `7d0934a4ee9cd4f9568bb7515a36b64bcf376e71`.
- Distribution validation merged: `0b9e5f88a9462c5e6f559b4b9ecce38f24edeebb`.

This FORGE evidence adapter must pass source checks, tests, schema validation, packaged distribution verification, and Steward scan before merge.

## Known limitations

- Language-aware static analysis is not yet part of the core.
- Security detection is intentionally high-confidence and does not replace dedicated secret-scanning services.
- External executable rule packs are deferred until trust, compatibility, and provenance rules exist.
- npm publication and release tagging have not yet been performed.
- Release-grade package signing and artifact provenance are future work.
