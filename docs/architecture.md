# gODtECH Steward architecture

## Product boundary

Steward is a deterministic repository-health and housekeeping engine. The first release does not attempt to understand an entire application semantically, auto-delete uncertain code, or require an artificial intelligence model.

## Execution flow

```text
Repository
    |
    v
Config loader (.steward.json)
    |
    v
File collector + Git facts
    |
    +--> Repository rules
    +--> Security rules
    +--> Documentation rules
    +--> Hygiene rules
    |
    v
Findings
    |
    +--> Human report
    +--> JSON report
    +--> CI decision
    +--> Safe remediation
```

## Core design rules

1. Deterministic checks own facts. They should not need a model to decide whether a file exists, a link resolves, a token pattern is present, or whitespace is inconsistent.
2. Every finding carries a stable rule identifier, category, severity, location when available, and whether safe automation is allowed.
3. Safe remediation is opt-in. `fix` refuses to modify files unless `--safe` is explicitly supplied.
4. Security findings are never auto-fixed by the current engine.
5. CLI and GitHub Action use the same compiled engine so they cannot silently drift into separate implementations.
6. The rule engine is intentionally modular so future language-aware, dependency-aware, architecture, and product-health rules can be added without replacing the scanner.

## First-release rule set

- Missing README
- Missing `.gitignore`
- Large files
- Tracked environment files
- Strong known-secret patterns
- Broken local Markdown links
- Safe source/configuration whitespace cleanup
- Missing final newline

The rule set is deliberately conservative. False positives are more damaging than a smaller initial rule surface.

## Future extension points

```text
Rules
  + language analysis
  + dependency graph analysis
  + test/build adapters
  + GitHub metadata checks
  + architecture checks
  + policy evaluation
  + product-health checks

Fixers
  + safe deterministic fixes
  + reviewable patch generation

Adapters
  + CLI
  + GitHub Action
  + future editor / CI integrations
```
