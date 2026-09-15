# Changelog

## Unreleased

### Added

- Project metadata analysis for package-based projects.
- Deterministic detection of additional generated test and tooling artifacts.
- `core` rule pack version 2 to make the expanded rule inventory explicit.
- Consumer-style package verification for the npm archive and packaged GitHub Action.
- `forge-evidence` command for observed repository-health evidence suitable for gODtECH FORGE workflow consumption.
- Dedicated `steward-forge-evidence.schema.json` contract for the adapter artifact.
- Trusted external rule-pack manifest schema and security design.
- Repository-owned external rule-pack trust policy schema.
- `steward pack verify` for manifest, policy, compatibility, digest, signature, and WebAssembly (WASM) validation.
- Conservative WASM sandbox probe that rejects imported host capabilities and bounds startup/instantiation time.
- Versioned no-import external rule ABI with deterministic repository snapshots and strict result validation.
- Security-gated external rule runtime harness with bounded linear memory, execution timeout, input/output byte ceilings, pointer/range validation, and isolated worker execution.
- Adversarial executable-pack tests covering memory declarations/growth, infinite loops, forbidden imports, oversized payloads, malformed JSON, and excessive findings.

### Changed

- Core repository-health coverage now includes package identity, description, and publishable-package completeness signals.
- Generated-output detection remains conservative and does not classify generic `dist/` or `build/` directories as disposable by default.
- Distribution verification now installs the generated package tarball offline and exercises the shipped CLI, Action, Forge evidence, external rule contract, runtime, and worker artifacts.
- FORGE integration is explicitly separated from FORGE benchmark result generation; Steward does not fabricate benchmark or provider-telemetry fields.
- External rule-pack execution remains disabled in normal scans pending structured audit output, provenance policy, publisher/key revocation, and explicit execution enablement.
- Malformed external-pack trust configuration fails closed during `steward pack verify`.

## 0.1.0

Initial development release line.

### Added

- Deterministic repository-health scanner.
- Terminal command-line interface (CLI) with scan, doctor, report, init, and safe-fix commands.
- Composite GitHub Action using the same compiled engine.
- Repository, security, documentation, dependency, maintenance, and hygiene rules.
- Explainable findings with severity, confidence, remediation, and machine-readable JSON output.
- Conservative, opt-in remediation with dry-run support.
