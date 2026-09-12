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

## Near-term priorities

- [ ] Reproducible package installation with a committed npm lockfile and `npm ci` verification.
- [ ] Broader deterministic repository analysis where the evidence is provable and the scope is justified.
- [ ] Richer evidence and health deltas comparing repository state before and after changes.
- [ ] Trusted external rule-pack distribution with explicit compatibility and safety rules.
- [ ] Forge adapter using the public result contract.
- [ ] Optional StackPilot adapter for generic maintenance signals.
- [ ] Release-grade package distribution and signed artifacts.

## Rule-pack architecture

Rule packs are the canonical extension boundary for Steward's own analyzers. Built-in packs are versioned and selected deterministically. External executable packs are intentionally deferred until trust, compatibility, and provenance rules are defined.

Current built-in packs:

```text
core@1
  repository
  documentation
  dependencies
  maintenance
  hygiene

security@1
  security
```

A generic housekeeping capability belongs here rather than being copied into Forge or StackPilot.

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
