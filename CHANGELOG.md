# Changelog

## Unreleased

### Added

- Project metadata analysis for package-based projects.
- Deterministic detection of additional generated test and tooling artifacts.
- `core` rule pack version 2 to make the expanded rule inventory explicit.
- Consumer-style package verification for the npm archive and packaged GitHub Action.
- `forge-evidence` command for observed repository-health evidence suitable for gODtECH FORGE workflow consumption.
- Dedicated `steward-forge-evidence.schema.json` contract for the adapter artifact.
- Trusted external rule-pack manifest schema and security design. This design does not enable executable external packs.

### Changed

- Core repository-health coverage now includes package identity, description, and publishable-package completeness signals.
- Generated-output detection remains conservative and does not classify generic `dist/` or `build/` directories as disposable by default.
- Distribution verification now installs the generated package tarball offline and exercises the shipped CLI, Action, and Forge evidence artifacts.
- FORGE integration is explicitly separated from FORGE benchmark result generation; Steward does not fabricate benchmark or provider-telemetry fields.
- External rule-pack execution remains disabled pending trust verification, sandboxing, compatibility enforcement, and audit controls.

## 0.1.0

Initial development release line.

### Added

- Deterministic repository-health scanner.
- Terminal command-line interface (CLI) with scan, doctor, report, init, and safe-fix commands.
- Composite GitHub Action using the same compiled engine.
- Repository, security, documentation, dependency, maintenance, and hygiene rules.
- Explainable findings with severity, confidence, remediation, and machine-readable JSON output.
- Conservative, opt-in remediation with dry-run support.
