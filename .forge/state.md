# gODtECH Steward state

## Current stage
DETERMINISTIC HEALTH EXPANSION

## Current baseline

Steward has a deterministic scan engine, first-class rule contracts, versioned machine-readable reporting, repository-owned configuration, conservative safe remediation, a composite GitHub Action, a reproducible npm installation path, stable finding fingerprints, and before/after health deltas.

## Active rule packs

- `core@2`: repository, documentation, dependency, maintenance, metadata, and hygiene checks.
- `security@1`: high-confidence credential and security-pattern checks.

The core pack was bumped from version 1 to version 2 because its rule inventory changed.

Pack-level disabling is evaluated before individual rule-level disabling. External executable rule packs are intentionally not loaded from arbitrary configuration paths.

## Current deterministic coverage

The core pack now reports project metadata gaps for package-based projects and tracks strong generated test/tool artifacts such as coverage output, Playwright reports, test-result directories, build-tool caches, TypeScript build-info files, and common local debug artifacts.

Steward intentionally avoids treating generic `dist/` or `build/` directories as automatically disposable because some packages ship compiled output.

## Current CLI

- `init`
- `scan`
- `doctor`
- `report`
- `report --compare <report>`
- `rules`
- `fix --safe`

## Integration contract

The public machine-readable result is versioned as `schemaVersion: 1` and is the boundary for future gODtECH FORGE and StackPilot integration. Neither integration is a runtime dependency for Steward.

Findings expose stable SHA-256 fingerprints for consumer-side correlation. Comparison deltas contain only finding identity and location references, not source contents or secret values.

## Verification state

- Rule-pack milestone merged: `2effe817497a091d05b19bf7f615a7bdaabc3795`.
- Reproducible-install milestone merged: `84fa7f7765e3523cdb7daf7d737e319920e640d7`.
- Evidence/delta milestone merged: `8475f51ba40c8b99d5a3848f58e434b1a6864ca6`.
- Evidence/delta branch passed type checking, build, tests, and Steward scan before merge. The first test attempt exposed and corrected a fixture issue rather than a production defect.

This deterministic-health expansion adds project metadata analysis, stronger generated-artifact evidence, `core@2` versioning, regression coverage, and documentation. It must pass the same remote verification before merge.

## Known limitations

- Language-aware static analysis is not yet part of the core.
- Security detection is intentionally high-confidence and does not replace dedicated secret-scanning services.
- External executable rule packs are deferred until trust, compatibility, and provenance rules exist.
- npm publication and release tagging have not yet been performed.
- Release-grade package signing and artifact provenance are future work.
