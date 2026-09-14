# Steward External Rule API v1

This document defines the first execution contract for future trusted external gODtECH Steward rule packs.

The contract is intentionally **not enabled for normal scan execution yet**. Steward v0.1.x continues to verify external packs without executing them until the runtime accounting, adversarial testing, audit, provenance, revocation, and explicit enablement gates are complete.

## Design goal

External rules should be able to inspect a deterministic repository snapshot and return findings without receiving ambient host capabilities.

The v1 design therefore uses a **snapshot-in / result-out, no-import WebAssembly ABI**.

```text
Steward repository collector
          |
          v
sanitized deterministic JSON snapshot
          |
          v
   WASM linear memory
          |
          v
   steward_run(...)
          |
          v
strictly validated JSON findings
          |
          v
Steward finding/report pipeline
```

The WebAssembly module receives no host imports. It cannot call Steward to open arbitrary files, access the network, inspect environment variables or secrets, spawn processes, modify the repository, or invoke remediation.

## Required exports

A v1 executable pack must export exactly the capabilities Steward needs to exchange bytes with it:

- `memory` — WebAssembly linear memory.
- `steward_alloc(len: i32) -> i32` — returns a pointer to writable module memory large enough for the input payload.
- `steward_run(input_ptr: i32, input_len: i32) -> i64` — consumes UTF-8 JSON input and returns a packed output pointer/length pair.

The `i64` result uses the high 32 bits for the unsigned output pointer and the low 32 bits for the unsigned output length:

```text
result = (output_ptr << 32) | output_len
```

Steward must validate all pointers and lengths against the module's current linear-memory bounds before reading output bytes.

No imports are permitted in ABI v1. A module that declares any import is not structurally eligible for execution.

## Input contract

The host input is UTF-8 JSON matching `schemas/steward-external-rule-api.schema.json` with:

```json
{
  "abiVersion": 1,
  "kind": "steward-rule-input",
  "repository": {
    "branch": "main",
    "commit": "...",
    "dirty": false,
    "files": []
  }
}
```

Files are sorted by repository-relative path for deterministic input. The snapshot contains no absolute filesystem paths. Each file entry may include:

- repository-relative `path` using `/` separators;
- `sizeBytes`;
- `isText`;
- whether the path is Git-tracked;
- `content` only when Steward's normal collection policy has admitted text content.

The snapshot is derived from Steward's existing repository collector, so configured exclusions and collection limits remain authoritative. Aggregate execution-input limits are a separate runtime gate and are not enabled by this contract alone.

## Output contract

The module returns UTF-8 JSON:

```json
{
  "abiVersion": 1,
  "kind": "steward-rule-output",
  "findings": [
    {
      "rule": "publisher.rule-id",
      "category": "repository",
      "severity": "medium",
      "message": "Explainable finding",
      "path": "README.md",
      "line": 10,
      "confidence": "high",
      "remediation": "Suggested manual remediation"
    }
  ]
}
```

Steward validates external output fail-closed before accepting it. Validation includes:

- exact ABI version and result kind;
- known fields only;
- valid rule identifiers;
- known category, severity, and confidence values;
- bounded finding count;
- bounded message/remediation fields;
- safe repository-relative paths only;
- bounded positive line numbers.

External findings do not carry remediation authority. A pack may provide explanatory remediation text, but it cannot mark a finding as automatically fixable or invoke Steward's safe-fix machinery.

## Capability boundary

`repository.read` means access to the sanitized repository snapshot that Steward deliberately constructs for the pack. It does **not** mean ambient filesystem access.

ABI v1 grants no direct capability for:

- network access;
- process creation;
- arbitrary filesystem reads;
- filesystem or repository writes;
- environment-variable or secret access;
- shell execution;
- Git mutation;
- Steward configuration mutation;
- remediation execution.

Any future capability expansion requires a new reviewed contract. It must not be smuggled into ABI v1 through WebAssembly imports.

## Current implementation boundary

`src/core/external-rule-api.ts` currently provides:

- deterministic snapshot construction;
- strict result parsing and validation;
- structural WebAssembly inspection for the required exports and zero-import rule.

This does **not** enable external rule execution. The current `steward pack verify` command remains verification-only and reports `executionEnabled: false`.

Execution stays disabled until the follow-up security gates tracked from issue #24 are complete, including bounded memory/time/output accounting, adversarial packs, structured audit evidence, provenance, publisher/key revocation, and explicit policy enablement.
