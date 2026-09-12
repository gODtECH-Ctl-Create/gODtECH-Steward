# gODtECH Steward integration contract

Steward is independently usable. Integrations with gODtECH FORGE and StackPilot use the public command-line interface (CLI), versioned JSON output, or the dedicated evidence adapter. Consumers must not import private Steward modules.

## Core scan contract

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
- `findings`: deterministic maintenance findings with rule, category, severity, confidence, location, remediation metadata, and an optional stable fingerprint.
- `healthScore`: deterministic health score from 0 to 100.
- `git`: sanitized Git facts; internal tracked-file sets are not serialized.
- `categoryCounts` and `ruleCounts`: aggregate finding counts.
- `rulePacks`: active built-in pack identifiers and versions when available.
- `delta`: optional before/after health and finding comparison data when a report is generated with `--compare`.

## gODtECH FORGE evidence adapter

**gODtECH FORGE (Framework for Orchestrated Reasoning, Governance & Engineering)** has a benchmark result schema designed for complete benchmark runs. Steward does not fabricate benchmark fields such as control branches, task IDs, provider metrics, or human interventions.

Instead, Steward exposes a standalone observed-evidence artifact:

```bash
steward forge-evidence
```

Write it to a file:

```bash
steward forge-evidence . --output .steward-forge-evidence.json
```

Compare against a previous Steward scan at the same time:

```bash
steward forge-evidence . --output .steward-forge-evidence.json --compare previous.json
```

The artifact follows [`../schemas/steward-forge-evidence.schema.json`](../schemas/steward-forge-evidence.schema.json) and contains:

- the Steward producer identity and result-contract version;
- the repository path and Git state observed during the scan;
- health score, scan scope, rule-pack state, severity/category counts, and safe finding references;
- the configured continuous integration (CI) threshold and the resulting observed pass/fail status;
- optional before/after delta information;
- explicit limitations stating that this is Steward evidence, not a FORGE benchmark result.

Finding `details`, source contents, and detected secret values are not projected into the adapter artifact.

FORGE can place the serialized evidence artifact into a workflow step's evidence field or retain it alongside benchmark records. FORGE remains responsible for benchmark identity, task framing, control versus assisted comparisons, and publication claims.

## Consumers

### gODtECH FORGE

FORGE may invoke Steward when repository maintenance or health evidence is relevant. FORGE decides when to call Steward and what findings mean for workflow, policy, approval, and delivery.

### StackPilot

StackPilot may consume generic Steward findings while retaining ownership of golden-path correctness, scaffolding, and stack-aware adoption/remediation.

## Compatibility rules

1. Consumers should branch on `schemaVersion` before parsing fields.
2. Consumers must not assume internal TypeScript types, file layout, or implementation details.
3. New optional fields may be added only in a backward-compatible schema revision; breaking changes require a new schema version.
4. Finding rule IDs and fingerprints are stable data identifiers and should not be treated as display text.
5. Rule-pack identifiers and versions describe which built-in analysis families were active for the scan.
6. `delta` is optional. Consumers must tolerate its absence.
7. Delta item payloads contain only finding identity and location references; they do not contain source-file contents or detected secret values.
8. The Forge evidence artifact is intentionally separate from FORGE's benchmark result schema.
9. `fixable: true` describes that Steward has a deterministic remediation path; consumers still decide whether and when it is appropriate to invoke remediation.
10. Steward never requires FORGE or StackPilot for standalone operation.

## Remediation boundary

Consumers should prefer the explicit safe remediation command when they intend Steward to modify a repository:

```bash
godtech-steward fix --safe
```

A consumer must not infer that every finding is safe to mutate merely because it is deterministic. The finding's `fixable` flag is the first capability signal, while Steward's own safety boundary remains authoritative.
