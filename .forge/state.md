# gODtECH Steward state

## Current stage
SCAN EVIDENCE + HEALTH DELTAS

## Current baseline

Steward has a deterministic scan engine, first-class rule contracts, versioned machine-readable reporting, repository-owned configuration, conservative safe remediation, a composite GitHub Action, and a reproducible npm installation path.

## Active rule packs

- `core@1`: repository, documentation, dependency, maintenance, and hygiene checks.
- `security@1`: high-confidence credential and security-pattern checks.

Pack-level disabling is evaluated before individual rule-level disabling. External executable rule packs are intentionally not loaded from arbitrary configuration paths.

## Current CLI

- `init`
- `scan`
- `doctor`
- `report`
- `rules`
- `fix --safe`

`report --compare <report>` now attaches deterministic before/after health and finding deltas.

## Integration contract

The public machine-readable result is versioned as `schemaVersion: 1` and is the boundary for future gODtECH FORGE and StackPilot integration. Neither integration is a runtime dependency for Steward.

Findings expose stable SHA-256 fingerprints for consumer-side correlation. Comparison deltas contain only finding identity and location references, not source contents.

## Verification state

The rule-pack milestone was merged into the foundation branch at commit `2effe817497a091d05b19bf7f615a7bdaabc3795`. The reproducible-install milestone was verified with `npm ci`, type checking, build, tests, and Steward scan before merge at commit `84fa7f7765e3523cdb7daf7d737e319920e640d7`.

This evidence/delta milestone adds stable finding fingerprints, deterministic comparison output, schema coverage, CLI report comparison, regression coverage, and documentation. It must pass the same Continuous Integration (CI) and Steward scan workflows before merge.

## Known limitations

- Language-aware static analysis is not yet part of the core.
- Security detection is intentionally high-confidence and does not replace dedicated secret-scanning services.
- External executable rule packs are deferred until trust, compatibility, and provenance rules exist.
- npm publication and release tagging have not yet been performed.
- Release-grade package signing and artifact provenance are future work.
