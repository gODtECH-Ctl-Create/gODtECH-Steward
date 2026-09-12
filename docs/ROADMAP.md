# gODtECH Steward Roadmap

gODtECH Steward is an independent deterministic repository and software-maintenance engine. Its specialty is keeping an existing project healthy through auditable findings and conservative remediation.

## Product boundary

Steward answers:

> **What can we prove is unhealthy or stale in this repository, and what safe maintenance can we offer?**

Steward should remain a focused maintenance engine rather than becoming a second orchestration framework, scaffolding system, or general AI product-development platform.

## Near-term priorities

- [x] Deterministic scanner with modular rule contracts.
- [x] Human and JSON reporting with stable findings.
- [x] Health scoring and Continuous Integration (CI) mode.
- [x] Conservative `--safe` remediation and `--dry-run` support.
- [x] GitHub Action path using the same compiled engine.
- [ ] Add a stable machine-readable integration contract for external orchestrators.
- [ ] Define a Forge adapter that lets gODtECH FORGE invoke Steward without taking a dependency on Steward internals.
- [ ] Define optional StackPilot integration for generic repository-health findings and safe remediation metadata.
- [ ] Keep StackPilot-specific golden-path checks outside Steward.

## Standalone operation

Steward must remain fully useful without Forge or StackPilot.

Supported standalone surfaces should include:

```text
CLI
  scan / doctor / report / fix

GitHub Action
  repository quality gates

Reusable engine
  embeddable by trusted integrations through stable contracts
```

## Forge relationship

**gODtECH FORGE** owns orchestration, product-development lifecycle decisions, policies, project context, workflows, memory, and cross-tool coordination.

Steward supplies deterministic repository-health evidence to Forge when repository maintenance is relevant:

```text
FORGE
   |
   +--> prepare / plan
   |
   +--> Steward scan
           |
           +--> findings
           +--> health score
           +--> safe-fix metadata
   |
   +--> policy / approval / remediation decision
   |
   +--> verification evidence
```

Forge must not reimplement Steward rules merely to consume the results. Steward must not become responsible for Forge task planning or product decisions.

## StackPilot relationship

**StackPilot** owns project scaffolding, golden paths, recipe rendering, stack selection, generated-project correctness, and stack-aware adoption/remediation.

Steward may supply generic repository-maintenance findings to StackPilot through an optional adapter. Steward must remain ignorant of StackPilot's golden-path assumptions.

```text
StackPilot
   |
   +--> scaffold / adopt / validate stack
   |
   +--> optional Steward adapter
           |
           +--> generic maintenance findings
           +--> safe remediation metadata
```

The canonical implementation rule is strict: a generic housekeeping capability belongs in Steward; a StackPilot-specific capability belongs in StackPilot.

## Contract direction

The preferred integration boundary is a versioned JSON contract, for example:

```json
{
  "schemaVersion": 1,
  "healthScore": 94,
  "findings": [],
  "fixableFindings": [],
  "generatedAt": "..."
}
```

The exact schema will be specified before adapter implementation. Integrations should use the contract rather than importing private Steward modules.

## Future direction

- Broader deterministic repository analysis where the rule is provable and language support is justified.
- Pluggable rule packs without weakening the safety boundary.
- Richer evidence and health deltas that compare repository state before and after changes.
- Forge integration as an optional adapter, not a dependency.
- StackPilot integration as an optional consumer of generic maintenance signals.
- Release-grade package distribution with reproducible dependency installation and signed artifacts.

## Non-goals

Steward will not become:

- a replacement for gODtECH FORGE;
- a project scaffolding generator;
- an AI coding agent;
- a StackPilot golden-path validator;
- an autonomous destructive cleanup service.
