# gODtECH Steward Roadmap

Steward is an independent deterministic repository and software-maintenance engine. Its specialty is keeping an existing project healthy through auditable findings and conservative remediation.

## Product boundary

Steward answers:

> **What can we prove is unhealthy or stale in this repository, and what safe maintenance can we offer?**

Steward is not a second orchestration framework, project scaffolder, or autonomous coding agent.

## Current foundation

- [x] Deterministic scanner with modular rule contracts.
- [x] Human and JSON reporting with stable findings.
- [x] Health scoring and Continuous Integration (CI) mode.
- [x] Conservative `--safe` remediation and `--dry-run` support.
- [x] GitHub Action path using the same compiled engine.
- [x] Versioned machine-readable result contract.
- [x] Built-in versioned rule packs with pack-level and rule-level policy.
- [x] Reproducible package installation with a committed npm lockfile and `npm ci` verification.
- [x] Stable finding fingerprints and deterministic before/after health deltas.
- [x] Project metadata checks for package identity and publishable-package completeness.
- [x] Expanded tracking detection for high-confidence generated test/tool artifacts.
- [x] Consumer-style npm package and GitHub Action distribution verification.
- [x] Standalone gODtECH FORGE evidence adapter using the public result contract.
- [x] StackPilot-side optional Steward report adapter and contract boundary.
- [x] Trusted external rule-pack verification and conservative sandbox prototype.
- [x] Versioned no-import external rule execution ABI and deterministic snapshot/result contracts.
- [x] Security-gated WASM runtime harness with bounded memory, timeout, payload limits, and adversarial tests.
- [x] Public npm release with tag-driven provenance and artifact attestations.
- [x] Product landing page deployed through GitHub Pages.
- [x] Product README aligned with the public install path and ecosystem boundary.

## Near-term priorities

- [ ] Complete #35: structured audit, provenance, publisher/key revocation, compatibility/rollback, and explicit execution enablement policy.
- [ ] Keep third-party executable packs disabled in normal scans and the GitHub Action until the governance gate is complete and reviewed.
- [ ] Improve signal quality where intentional test fixtures or documentation markers create noisy findings.
- [ ] Add additional deterministic health checks only where evidence is strong and false-positive cost is low.
- [ ] Expand language-aware analysis selectively, without turning Steward into a general-purpose static analyzer.

## Rule-pack architecture

Rule packs are the canonical extension boundary for Steward's analyzers. Built-in packs are versioned and selected deterministically.

```text
core@2
  repository
  documentation
  dependencies
  maintenance
  metadata
  hygiene

security@1
  security
```

External executable packs remain outside normal scans. The current source tree contains verification, ABI, and bounded-runtime layers, while governance/admission remains the final active gate.

## Trusted external rule-pack design

The design requires these gates before a dedicated opt-in execution surface could be considered:

1. Versioned manifest schema.
2. Exact Steward rule API/result schema compatibility.
3. SHA-256 artifact integrity verification.
4. Trusted Ed25519 publisher signature verification.
5. Repository/user allow policy with fail-closed malformed configuration.
6. Read-only capability boundary.
7. WebAssembly as the supported executable artifact format.
8. Bounded memory, execution time, input/output bytes, and finding output.
9. No network, arbitrary filesystem, process, environment, or secret access.
10. Structured audit output.
11. Publisher/key revocation and signed provenance policy.
12. Explicit execution enablement separate from verification.
13. Compatibility and rollback behavior.

Arbitrary JavaScript/Node.js executable rule packs are not a supported trust model. Remediation remains Steward-owned and finding-driven.

## Current verification/runtime path

```text
manifest
  -> schema/semantic validation
  -> pack allowlist
  -> publisher allowlist
  -> SHA-256 artifact match
  -> Ed25519 signature verification
  -> WASM validation
  -> optional sandbox admission probe
  -> bounded runtime harness (source-level, not normal scan execution)
```

The external rule ABI is versioned and no-import. Steward constructs a deterministic repository-relative JSON snapshot, exchanges bytes through module-owned linear memory, and validates returned findings fail-closed.

The source-level runtime harness requires explicit bounded linear memory, enforces memory ceilings, input/output limits and timeouts, rejects imports, validates pointer ranges, validates output JSON, enforces `maxFindings`, and is covered by adversarial executable fixtures.

## FORGE and StackPilot

**gODtECH FORGE** owns orchestration, benchmark framing, policy, and workflow decisions. Steward emits observed repository-health evidence through `steward forge-evidence` without fabricating benchmark identity, provider billing, or productivity claims.

**StackPilot** owns scaffolding and `readiness-v1`. It may consume Steward's public scan contract observationally without duplicating generic housekeeping rules.

## Distribution validation

The distribution gate builds the npm tarball, inspects the published file set, installs it into a clean consumer directory without registry access, executes both CLI aliases, validates JSON output, exercises `forge-evidence`, runs the packaged GitHub Action, rejects malformed Action argument payloads, and verifies the external rule API/runtime worker artifacts are shipped.

The package intentionally excludes the TypeScript source tree and `node_modules`.

## Release line

The current public release is **`@godtech/steward@0.1.1`**, tagged **`v0.1.1`**. Releases are tag-driven and use npm Trusted Publishing, GitHub artifact attestations, SHA-256 checksums, and an SPDX Software Bill of Materials (SBOM).

`MASTER` may be ahead of the public release. Post-release changes must stay identified as unreleased until a new reviewed tag is published.

## Product presentation

The GitHub Pages site lives under `site/`. README, Pages, changelog, release documentation, and project state should share the same verified release facts and distinguish published behavior from current-source work.

## gODtECH ecosystem

```text
                    gODtECH FORGE
             orchestration / policy / workflow
                         |
             +-----------+-----------+
             |                       |
             v                       v
        StackPilot                Steward
        BUILD IT             KEEP IT HEALTHY
             |                       |
             +-----------+-----------+
                         v
                   TARGET PROJECT
```

## Non-goals

Steward will not become:

- a replacement for gODtECH FORGE;
- a project scaffolding generator;
- an AI coding agent;
- a StackPilot golden-path validator;
- an autonomous destructive cleanup service.
