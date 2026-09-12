# Decision 0002: conservative remediation

## Status
Accepted

## Decision

Steward may automatically apply only findings explicitly marked fixable by a deterministic rule, and only when the user supplies `--safe`. `--dry-run` must never mutate the repository.

## Why

Housekeeping can destroy valid project artifacts when intent is ambiguous. Observation is cheap; accidental deletion or architectural rewrites are expensive. Steward should optimize for trustworthy automation, not maximum automation.

## Current safe scope

- Remove trailing whitespace in supported source/configuration text files.
- Add a final newline to non-empty supported text files.

Security, dependency, Git, and generated-artifact findings remain advisory.
