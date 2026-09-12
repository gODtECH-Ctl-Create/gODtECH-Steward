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
| `core` | 2 | Repository, documentation, dependency, maintenance, metadata, and hygiene checks |
| `security` | 1 | High-confidence credential and security-pattern checks |

The `core` pack was bumped to version 2 because its rule inventory changed with project metadata checks and expanded generated-artifact detection.

Disable a complete built-in pack in `.steward.json`:

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

## Current deterministic coverage

The core pack includes package metadata checks for `package.json` projects. Missing name is treated as a medium-severity identity gap; missing description, version, or license are low-severity completeness gaps, with version and license checks skipped for explicitly private packages.

Repository artifact detection includes strong generated signals such as coverage reports, Playwright reports, test-result directories, build-tool caches, TypeScript build-info files, and common local debug artifacts. The rule does not assume that directories such as `dist/` or `build/` are disposable because some packages intentionally ship compiled output.

## Rules must not

- delete uncertain files;
- make network calls to establish ordinary repository facts;
- mutate the repository while scanning;
- hide errors by returning an empty result;
- emit credentials or sensitive values in findings.

## Adding a rule

1. Create a module under `src/rules/`.
2. Export a `StewardRule` implementation.
3. Add it to the appropriate pack in `src/core/rule-packs.ts` and bump that pack's version when its inventory changes.
4. Add focused tests under `test/`.
5. Run type checking, build, tests, and a CLI smoke test.
6. Update the README and `.forge/state.md` when product behavior changes.

## Future external packs

External rule packs are intentionally not loaded from arbitrary paths or configuration values yet. Future package-based rule packs must use an explicit trust and compatibility contract before executable third-party code can participate in scans.
