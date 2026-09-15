# gODtECH Steward state

## Current stage
PUBLIC RELEASE v0.2.0

## Current baseline

Steward has a deterministic scan engine, first-class rule contracts, versioned machine-readable reporting, repository-owned configuration, conservative safe remediation, a composite GitHub Action, reproducible npm installation, stable finding fingerprints, before/after health deltas, expanded repository-health coverage, consumer-style package verification, a privacy-safe gODtECH FORGE evidence adapter, a documented StackPilot integration contract, trusted external rule-pack verification, a versioned no-import external rule ABI, a bounded WebAssembly runtime harness with adversarial tests, and explicit governance/admission for trusted external packs.

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
- `pack verify`
- `pack verify --audit-output <file>`

## Integration contracts

The public scan result is versioned as `schemaVersion: 1` and remains the primary integration boundary.

`steward forge-evidence` emits a separately defined `repository-health` evidence artifact for gODtECH FORGE. It does not fabricate FORGE benchmark identity, task framing, control-versus-assisted runs, provider billing, or productivity claims.

StackPilot consumes Steward's public scan contract optionally and observationally. StackPilot owns scaffolding and `readiness-v1`; Steward remains the canonical owner of generic housekeeping.

## Distribution contract

The package ships the consumer-facing compiled engine under `dist/src`, schemas, README, license, and GitHub Action runner files. Development TypeScript source and `node_modules` are excluded.

`npm run verify:package` builds and inspects the npm tarball, installs it offline into a clean consumer directory, exercises both CLI aliases, validates the scan contract, exercises `forge-evidence`, runs the packaged Action runner, rejects malformed Action argument payloads, and verifies the external rule API/runtime/worker/governance artifacts and schemas are present.

## Release state

- Release line: `@godtech/steward@0.2.0` / `v0.2.0`.
- Release workflow uses npm Trusted Publishing and GitHub artifact attestations.
- Release assets include the package tarball, SHA-256 checksum file, and SPDX Software Bill of Materials (SBOM).
- Linux and Windows package verification are release gates.
- `v0.2.0` promotes the post-`v0.1.1` bounded WASM runtime and trusted-pack governance/admission work into the public release line.

## Trusted external rule-pack execution model

Executable third-party packs remain disabled in normal scans and the GitHub Action.

The public `v0.2.0` model includes:

- versioned manifest and external rule ABI contracts;
- SHA-256 artifact verification;
- trusted Ed25519 publisher signatures;
- repository/user allow policy;
- publisher and signing-key revocation lists that override trust configuration;
- deterministic repository-relative snapshot input;
- no-import WASM execution boundary;
- one defined bounded 32-bit linear memory with an explicit maximum;
- configured memory ceiling enforcement before worker startup;
- bounded serialized input and output;
- isolated worker execution with a hard timeout;
- pointer/range validation before memory reads/writes;
- strict returned-finding validation and `maxFindings` enforcement;
- adversarial tests for infinite loops, memory declarations/growth, forbidden imports, malformed/oversized output, and oversized input;
- publisher-signed provenance metadata for source repository, source commit, and builder identity;
- explicit trusted-source repository policy;
- explicit execution enablement independent from verification;
- exact pack version and artifact SHA-256 pins for controlled upgrades and rollback;
- privacy-safe structured audit records for accepted and rejected verification/admission decisions.

Verification and execution admission are separate. A verified pack is not execution-admitted unless the execution switch, provenance, trusted source, and exact version/digest pin gates all pass.

Arbitrary JavaScript/Node.js rule execution is not an accepted trust model. External packs cannot write repositories, spawn processes, access secrets, or use network/filesystem capabilities by default. Remediation remains Steward-owned and finding-driven.

## Verification state

- Rule-pack verification milestone completed.
- External rule ABI/host contract completed through PR #36 / issue #33.
- Bounded WASM runtime and adversarial pack tests completed through PR #37 / issue #34.
- Shared CLI Identity integration completed through PR #38.
- `v0.1.1` published through PR #39.
- README/Pages/release-state cleanup completed through PRs #40, #42, and #43.
- Trusted-pack governance/admission completed through PR #41 / issue #35.
- Parent trusted-pack security gate #24 closed as completed after #33, #34, and #35 were satisfied.

## Remaining product work

- Decide whether Steward should expose a dedicated opt-in external-pack execution surface; normal scans and the GitHub Action must not bypass governance or runtime gates.
- Improve signal quality where intentional test fixtures or documentation markers create noisy findings.
- Add further deterministic health and language-aware analysis only where evidence quality justifies the added complexity.

## Safety boundary

Scanning is read-only. Safe remediation requires explicit `--safe`, dry runs do not write, security findings are observation-only, and external executable rule packs remain disabled in normal workflows. Any future opt-in execution surface must require successful verification, a positive governance admission decision, and the bounded WASM runtime; none of those layers may be bypassed.
