# gODtECH ecosystem

Steward is an independent repository-health engine that fits alongside gODtECH FORGE and StackPilot.

```text
FORGE      → orchestrate / govern / verify
StackPilot → scaffold / generate / validate
Steward    → inspect / explain / maintain health
```

## Boundaries

**gODtECH Steward** owns deterministic repository housekeeping, health findings, machine-readable scan contracts, before/after deltas, and conservative remediation.

**StackPilot** owns project scaffolding, golden paths, generated-project validation, and stack-aware readiness.

**gODtECH FORGE** owns AI-assisted engineering orchestration, repository preparation, workflow governance, approvals, and evidence-aware delivery.

## Integration

Steward can operate completely independently. Consumers may use its `steward` or `godtech-steward` command, versioned `schemaVersion: 1` scan output, or the `forge-evidence` adapter.

FORGE may invoke Steward when repository health or safe maintenance is relevant. StackPilot may consume Steward's scan result observationally. Neither integration requires private module imports or makes Steward a runtime dependency.

The three products are intentionally connected through public contracts rather than shared private implementation.

## Public release

- [Steward repository](https://github.com/gODtECH-Ctl-Create/gODtECH-Steward)
- [Steward npm package](https://www.npmjs.com/package/@godtech/steward)
- [Steward v0.1.0](https://github.com/gODtECH-Ctl-Create/gODtECH-Steward/releases/tag/v0.1.0)
- [StackPilot Steward integration](https://github.com/gODtECH-Ctl-Create/StackPilot/blob/main/docs/steward-integration.md)
- [FORGE ecosystem architecture](https://github.com/gODtECH-Ctl-Create/gODtECH-FORGE/blob/main/forge/internal/ROADMAP.md)
