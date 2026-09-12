# Steward rule authoring

A rule is a deterministic analyzer that receives a `ScanContext` and returns data-only findings.

## Contract

```ts
export interface StewardRule {
  id: string;
  category: Category;
  description: string;
  run(context: ScanContext): Finding[];
}
```

Every finding should include:

- a stable identifier and rule name;
- a category and severity;
- a useful location when one exists;
- confidence based on the strength of the evidence;
- whether a safe fix is actually supported;
- a concrete remediation explanation.

## Rule packs

Rules are grouped into versioned built-in packs so Steward can grow without turning the scanner into one hard-coded rule list.

Current packs:

| Pack | Version | Purpose |
| --- | ---: | --- |
| `core` | 1 | Repository, documentation, dependency, maintenance, and hygiene checks |
| `security` | 1 | High-confidence credential and security-pattern checks |

Disable a complete pack in `.steward.json`:

```json
{
  "packs": {
    "disabled": ["security"]
  }
}
```

Disable individual rules when finer control is required:

```json
{
  "rules": {
    "disabled": ["todo-fixme"]
  }
}
```

Pack disabling is applied before individual rule disabling. Duplicate rule IDs are ignored deterministically so a future pack cannot cause a rule to execute twice.

Use `steward rules` to inspect the active built-in packs and rule states.

## Rules must not

- delete uncertain files;
- make network calls to establish ordinary repository facts;
- mutate the repository while scanning;
- hide errors by returning an empty result;
- emit credentials or sensitive values in findings.

## Adding a rule

1. Create a module under `src/rules/`.
2. Export a `StewardRule` implementation.
3. Add it to the appropriate pack in `src/core/rule-packs.ts`.
4. Add focused tests under `test/`.
5. Run type checking, build, tests, and a CLI smoke test.
6. Update the README and `.forge/state.md` when product behavior changes.

## Future external packs

External rule packs are intentionally not loaded from arbitrary paths or configuration values yet. Future package-based rule packs must use an explicit trust and compatibility contract before executable third-party code can participate in scans.
