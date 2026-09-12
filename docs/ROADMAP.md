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

## Near-term priorities

- [x] Define trusted external rule-pack distribution with explicit compatibility and safety rules.
- [x] Implement trusted external rule-pack verification and sandbox prototype.
- [ ] Release-grade package distribution, signing, and artifact provenance.
- [ ] Additional deterministic health checks where evidence is strong and false-positive cost is low.

## Rule-pack architecture

Rule packs are the canonical extension boundary for Steward's own analyzers. Built-in packs are versioned and selected deterministically. External executable packs remain disabled until trust, compatibility, provenance, and sandbox rules are implemented.

Current built-in packs:

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

The `core` pack was bumped from version 1 to version 2 because the rule inventory changed. Consumers can therefore distinguish the expanded deterministic health baseline from the previous pack behavior.

## Trusted external rule-pack design

The design milestone establishes these release gates before any external executable rule runs:

1. Versioned manifest schema.
2. Explicit Steward rule API compatibility.
3. SHA-256 artifact integrity verification.
4. Trusted publisher signature verification using Ed25519.
5. Repository/user allow policy with fail-closed malformed configuration.
6. Read-only capability boundary.
7. WebAssembly (WASM) sandbox as the supported executable artifact format.
8. Bounded memory, execution time, and finding output.
9. No network, arbitrary filesystem, process, environment, or secret access.
10. Audit output for accepted and rejected external packs.

Arbitrary JavaScript/Node.js executable rule packs are not a supported trust model. Remediation remains Steward-owned and finding-driven.

The manifest design is documented in [`trusted-rule-packs.md`](./trusted-rule-packs.md), the manifest schema is `schemas/steward-rule-pack-manifest.schema.json`, and the repository-owned trust policy schema is `schemas/steward-external-pack-policy.schema.json`.

## Trusted verification implementation

The current implementation provides a **verification-only** path:

```text
manifest
  -> schema/semantic validation
  -> pack allowlist
  -> publisher allowlist
  -> SHA-256 artifact match
  -> Ed25519 signature verification
  -> WASM validation
  -> optional sandbox probe
```

The CLI surface is:

```bash
steward pack verify manifest.json --artifact pack.wasm
steward pack verify manifest.json --artifact pack.wasm --sandbox --json
```

The sandbox prototype compiles the WASM artifact, rejects modules with imports, and performs bounded worker-based instantiation so a start function cannot block the main process indefinitely. The current prototype does **not** expose the repository host API, does not execute arbitrary exported rule functions, and does not provide full runtime accounting for WASM linear memory. Therefore external executable rule packs remain disabled in repository scans and GitHub Action execution.

Unsigned verification can be represented by policy, but the default policy requires signatures. Signed mode requires an explicit trusted Ed25519 public key for the declared publisher key ID. Malformed trust configuration fails closed for pack verification.

## Deterministic health expansion

The current core expansion focuses on evidence with low speculation:

- package project identity and description checks;
- version/license completeness for non-private packages;
- tracked coverage and test-report artifacts;
- tracked test/tool output directories;
- common local build caches, TypeScript build-info files, and lint caches.

Steward deliberately does not treat generic `dist/` or `build/` directories as disposable because some projects intentionally ship compiled output.

## Scan evidence and deltas

Every finding may expose a stable SHA-256 fingerprint derived from its identity and path. The fingerprint is intentionally independent of line number so the same issue remains correlated when code moves.

`steward report . --output current.json --compare previous.json` produces a deterministic delta covering health change, added and resolved finding references, unchanged findings, severity changes, and category changes.

Comparison output never copies source-file contents or secret values into delta evidence.

## FORGE evidence adapter

**gODtECH FORGE (Framework for Orchestrated Reasoning, Governance & Engineering)** owns orchestration and benchmark framing. Steward now provides a separate `steward forge-evidence` artifact for observed repository-health evidence.

The adapter deliberately does not fabricate FORGE benchmark fields such as benchmark IDs, control versus assisted runs, task framing, provider billing, or productivity claims. It carries the Steward scan contract into a safe evidence projection, including repository state, health, findings, rule packs, Continuous Integration (CI) outcome, and optional scan deltas.

## StackPilot integration

StackPilot may consume Steward's `schemaVersion: 1` scan result as an optional observational input. It owns scaffolding, golden paths, and its `readiness-v1` model. StackPilot does not execute Steward remediation or duplicate generic housekeeping rules.

## Distribution validation

The distribution gate builds the actual npm tarball, inspects the published file set, installs it into a clean consumer directory without registry access, executes both CLI aliases, validates the versioned JSON output, exercises `forge-evidence`, runs the packaged GitHub Action, and rejects malformed Action argument payloads.

The package intentionally excludes the TypeScript source tree and `node_modules` while shipping the compiled engine required by both package consumers and the Action runner.

## Release line

The package currently identifies as version `0.1.0`, but the first public release remains gated on release-grade artifact provenance, signing, trusted distribution metadata, and a final package/Action smoke test from the tagged source tree.

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

- **gODtECH FORGE** may invoke Steward when repository-health evidence or safe maintenance is relevant.
- **StackPilot** may optionally consume generic Steward findings while retaining its own golden-path semantics.
- Steward remains independently useful without either product.
- Integrations must use stable machine-readable contracts rather than private implementation imports.

## Non-goals

Steward will not become:

- a replacement for gODtECH FORGE;
- a project scaffolding generator;
- an AI coding agent;
- a StackPilot golden-path validator;
- an autonomous destructive cleanup service.
