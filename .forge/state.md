# gODtECH Steward state

## Current stage
RULE-PACK ARCHITECTURE

## Current baseline

Steward has a deterministic scan engine, first-class rule contracts, versioned machine-readable reporting, repository-owned configuration, conservative safe remediation, and a composite GitHub Action using the same compiled engine.

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

## Integration contract

The public machine-readable result is versioned as `schemaVersion: 1` and is the boundary for future gODtECH FORGE and StackPilot integration. Neither integration is a runtime dependency for Steward.

## Verification state

The integration-contract milestone was merged into the foundation branch at commit `9b3db201d6996b1c94e350b3a9b05cea4870c21e`. The exact head passed both required GitHub workflows before this rule-pack branch was created.

This rule-pack change adds deterministic pack selection, pack visibility in reports, CLI diagnostics, and regression coverage. It must pass the same Continuous Integration (CI) and Steward scan workflows before merge.

## Known limitations

- Language-aware static analysis is not yet part of the core.
- Security detection is intentionally high-confidence and does not replace dedicated secret-scanning services.
- External executable rule packs are deferred until trust, compatibility, and provenance rules exist.
- npm publication and release tagging have not yet been performed.
- A committed npm lockfile and `npm ci`-based reproducible install path should be added before treating the package as a release-grade distribution artifact.
