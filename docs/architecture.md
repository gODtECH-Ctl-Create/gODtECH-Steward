# gODtECH Steward architecture

## Product boundary

Steward is a deterministic repository-health and software-housekeeping engine. The core does not require a network service or artificial intelligence (AI) model to establish ordinary repository facts.

## Execution flow

```text
Repository
    |
    v
Configuration + Git facts
    |
    v
File collector
    |
    v
Rule registry
    |
    +--> repository
    +--> security
    +--> documentation
    +--> dependencies
    +--> maintenance
    +--> hygiene
    |
    v
Stable findings
    |
    +--> human report
    +--> JSON report
    +--> continuous integration (CI) gate
    +--> safe remediation
```

## Core contracts

`ScanContext` contains verified repository facts, the effective configuration, the collected files, and Git metadata scoped to the requested repository path.

`StewardRule` is a read-only analysis contract:

```ts
interface StewardRule {
  id: string;
  category: Category;
  description: string;
  run(context: ScanContext): Finding[];
}
```

Rules return findings rather than mutating the repository. Each finding identifies its rule, severity, confidence, location where available, remediation guidance, and whether safe automation is supported.

## Safety boundaries

- Scanning does not write files.
- Safe remediation is explicit with `--safe`.
- `--dry-run` never writes.
- Only findings marked `fixable` can be passed to the remediation engine.
- Security findings are never auto-remediated.
- The default rule set avoids speculative deletion and project-specific assumptions.

## Extension model

Future capabilities should become additional rule modules or adapters:

```text
Rules
  + language-aware analysis
  + dependency graph analysis
  + build/test adapters
  + GitHub metadata
  + architecture checks
  + policy evaluation
  + product-health checks

Interfaces
  + CLI
  + GitHub Action
  + editor integrations
  + Model Context Protocol (MCP) integration
```
