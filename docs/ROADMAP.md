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

## Near-term priorities

- [ ] Trusted external rule-pack distribution with explicit compatibility and safety rules.
- [ ] Forge adapter using the public result contract.
- [ ] Optional StackPilot adapter for generic maintenance signals.
- [ ] Release-grade package distribution, signing, and artifact provenance.
- [ ] Additional deterministic health checks where evidence is strong and false-positive cost is low.

## Rule-pack architecture

Rule packs are the canonical extension boundary for Steward's own analyzers. Built-in packs are versioned and selected deterministically. External executable packs are intentionally deferred until trust, compatibility, and provenance rules are defined.

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

## Distribution validation

The distribution gate builds the actual npm tarball, inspects the published file set, installs it into a clean consumer directory, executes both CLI aliases, validates the versioned JSON output, runs the packaged GitHub Action, and rejects malformed Action argument payloads.

The package intentionally excludes the TypeScript source tree and `node_modules` while shipping the compiled engine required by both package consumers and the Action runner.

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
