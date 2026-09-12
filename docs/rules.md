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

## Rules must not

- delete uncertain files;
- make network calls to establish ordinary repository facts;
- mutate the repository while scanning;
- hide errors by returning an empty result;
- emit credentials or sensitive values in findings.

## Adding a rule

1. Create a module under `src/rules/`.
2. Export a `StewardRule` implementation.
3. Register it in `src/core/rules.ts`.
4. Add focused tests under `test/`.
5. Run type checking, build, tests, and a CLI smoke test.
6. Update the README and `.forge/state.md` when product behavior changes.
