# Changelog

## Unreleased

### Added

- Project metadata analysis for package-based projects.
- Deterministic detection of additional generated test and tooling artifacts.
- `core` rule pack version 2 to make the expanded rule inventory explicit.

### Changed

- Core repository-health coverage now includes package identity, description, and publishable-package completeness signals.
- Generated-output detection remains conservative and does not classify generic `dist/` or `build/` directories as disposable by default.

## 0.1.0

Initial development release line.

### Added

- Deterministic repository-health scanner.
- Terminal command-line interface (CLI) with scan, doctor, report, init, and safe-fix commands.
- Composite GitHub Action using the same compiled engine.
- Repository, security, documentation, dependency, maintenance, and hygiene rules.
- Explainable findings with severity, confidence, remediation, and machine-readable JSON output.
- Conservative, opt-in remediation with dry-run support.
