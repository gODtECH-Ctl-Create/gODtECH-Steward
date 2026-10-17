# gODtECH Steward engineering contract

Steward follows the gODtECH FORGE engineering approach.

## Before changing code

- Inspect the current repository, configuration, tests, and documented product context.
- Prefer deterministic tooling over model judgment for deterministic facts.
- Make material work traceable to a GitHub issue and a dedicated branch.
- Keep the smallest robust scope that solves the real problem.
- Do not weaken safety or verification to make a task easier.

## Product rules

- Steward observes before it modifies.
- Findings must be explainable and carry stable rule IDs.
- Safe fixes are opt-in and must correspond to explicit fixable findings.
- Security findings are never automatically remediated.
- The command-line interface (CLI) and GitHub Action must use the same engine.
- Avoid unnecessary runtime dependencies.

## Verification gate

Before considering material work complete, evaluate the applicable checks:

- TypeScript type checking
- production build
- automated tests
- CLI smoke tests
- security behavior
- GitHub Action packaging/invocation
- README and documentation accuracy

Never claim a check passed when it was not actually run.
