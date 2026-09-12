# Scan deltas and finding evidence

Steward can compare a current scan with a previous JSON scan report without changing the scanner's deterministic behavior.

## Stable finding fingerprints

Every emitted finding receives a SHA-256 fingerprint derived from its stable finding identity and repository path. The line number is intentionally excluded so moving the same issue within a file does not turn it into a new finding.

Fingerprints do not contain source contents or secret values.

## Compare reports

Generate a current report and compare it with an earlier report:

```bash
steward report . --output current.json --compare previous.json
```

The resulting JSON contains an optional `delta` object with:

- health score before, after, and the signed change;
- whether the score improved, regressed, or stayed unchanged;
- added and resolved finding references;
- unchanged finding count;
- severity count deltas;
- category count deltas.

Only finding identity, path, and line references are included in delta items. Steward does not copy source-file contents into the comparison result.

## Integration boundary

The base scan result remains `schemaVersion: 1`. The `delta` field is an optional extension of that result and consumers must tolerate its absence.
