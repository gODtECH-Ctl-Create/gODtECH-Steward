# gODtECH Steward integration contract

Steward is independently usable. Integrations with gODtECH FORGE and StackPilot use the public command-line interface (CLI) or versioned JSON output and must not import private Steward modules.

## Contract

Machine-readable scan output is versioned with `schemaVersion: 1` and follows [`../schemas/steward-result.schema.json`](../schemas/steward-result.schema.json).

Example:

```bash
godtech-steward scan --json
```

The JSON document contains:

- `schemaVersion`: integration contract version.
- `tool`: stable producer identity.
- `version`: Steward scan-result model version.
- `root`: inspected repository root.
- `scannedFiles` and `textFiles`: bounded scan scope.
- `findings`: deterministic maintenance findings with rule, category, severity, confidence, location, and remediation metadata.
- `healthScore`: deterministic health score from 0 to 100.
- `git`: sanitized Git facts; internal tracked-file sets are not serialized.
- `categoryCounts` and `ruleCounts`: aggregate finding counts.

## Consumers

### gODtECH FORGE

Forge may invoke Steward when repository maintenance or health evidence is relevant. Forge decides when to call Steward and what findings mean for workflow, policy, approval, and delivery.

### StackPilot

StackPilot may consume generic Steward findings while retaining ownership of golden-path correctness, scaffolding, and stack-aware adoption/remediation.

## Compatibility rules

1. Consumers should branch on `schemaVersion` before parsing fields.
2. Consumers must not assume internal TypeScript types, file layout, or implementation details.
3. New optional fields may be added only in a backward-compatible schema revision; breaking changes require a new schema version.
4. Finding rule IDs are stable identifiers within the contract and should be treated as data, not display text.
5. `fixable: true` describes that Steward has a deterministic remediation path; consumers still decide whether and when it is appropriate to invoke remediation.
6. Steward never requires Forge or StackPilot for standalone operation.

## Remediation boundary

Consumers should prefer the explicit safe remediation command when they intend Steward to modify a repository:

```bash
godtech-steward fix --safe
```

A consumer must not infer that every finding is safe to mutate merely because it is deterministic. The finding's `fixable` flag is the first capability signal, while Steward's own safety boundary remains authoritative.
