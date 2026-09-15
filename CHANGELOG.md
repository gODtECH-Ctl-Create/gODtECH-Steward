# Changelog

## Unreleased

### Added

- Security-gated external rule runtime harness with bounded WebAssembly linear memory, execution timeout, input/output byte ceilings, pointer/range validation, and isolated worker execution.
- Adversarial executable-pack tests covering bounded-memory declarations, memory growth attempts, infinite loops, forbidden imports, invalid output pointers, oversized payloads, malformed JSON, and excessive findings.

### Changed

- External executable rule packs remain disabled in normal scans and GitHub Action execution while the remaining governance/admission gate is completed.
- Distribution verification now also checks that the external rule API/runtime/worker artifacts are present in the packaged npm archive.

## 0.1.1 — 2026-09-14

### Added

- Shared gODtECH CLI Identity integration for interactive Steward commands.
- `STEWARD_NO_BANNER=1` suppression for explicit no-banner operation.
- `STEWARD_ASCII=1` support for ASCII-only terminals.
- Versioned no-import external rule ABI with deterministic repository snapshots and strict returned-finding validation.
- Public `steward-external-rule-api.schema.json` contract.
- Dedicated product landing page under GitHub Pages.

### Changed

- Decorative CLI identity output is suppressed for JSON, CI, version, FORGE evidence, non-TTY, and GitHub Action usage so machine-readable output remains clean.
- README and public product presentation were redesigned around verified installation, release provenance, ecosystem boundaries, and safety behavior.
- Release preflight and publish workflow were made version-aware rather than hard-coded to the first release.
- The CLI Identity dependency was pinned to the install-safe reviewed commit used by the 0.1.1 package.

### Release

- Published `@godtech/steward@0.1.1` to npm.
- Published Git tag and GitHub Release `v0.1.1`.
- Release assets include the npm tarball, `SHA256SUMS`, and SPDX Software Bill of Materials (SBOM).

## 0.1.0 — 2026-09-12

### Added

- Deterministic repository-health scanner.
- Terminal command-line interface (CLI) with scan, doctor, report, init, rule inspection, FORGE evidence, and safe-fix commands.
- Composite GitHub Action using the same compiled engine.
- Repository, security, documentation, dependency, maintenance, metadata, and hygiene rules.
- Versioned built-in `core@2` and `security@1` rule packs.
- Explainable findings with severity, confidence, remediation, stable fingerprints, and machine-readable JSON output.
- Deterministic before/after health and finding deltas.
- Conservative, opt-in remediation with dry-run support.
- Consumer-style npm archive and packaged GitHub Action verification on Linux and Windows.
- `forge-evidence` command and dedicated schema for privacy-safe observed repository-health evidence suitable for gODtECH FORGE workflows.
- Trusted external rule-pack manifest schema and repository-owned trust policy.
- `steward pack verify` for manifest, compatibility, allow policy, SHA-256 digest, Ed25519 signature, and WebAssembly validation.
- Conservative WebAssembly sandbox admission probe that rejects imported host capabilities and bounds startup/instantiation time.
- Tag-driven npm Trusted Publishing release workflow with GitHub artifact attestations, SHA-256 checksums, and SPDX SBOM generation.

### Safety

- Scanning is read-only.
- `fix` refuses to write without explicit `--safe`.
- `--dry-run` never writes.
- Security findings are observation-only.
- Arbitrary JavaScript/Node.js external rule execution is not supported.
- External executable rule packs are not loaded by normal scans or the GitHub Action.
