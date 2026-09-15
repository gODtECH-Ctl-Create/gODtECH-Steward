# Steward External Rule API v1

This document defines the first execution contract for future trusted external gODtECH Steward rule packs.

The contract is intentionally **not enabled for normal scan execution yet**. Steward v0.1.x continues to verify external packs without executing them until the audit, provenance, revocation, and explicit enablement gates are complete.

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

Steward validates all pointers and lengths against the module's current linear-memory bounds before reading or writing bytes.

No imports are permitted in ABI v1. A module that declares any import is not eligible for execution.

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

The snapshot is derived from Steward's existing repository collector, so configured exclusions and collection limits remain authoritative. The runtime also applies an aggregate serialized-input byte limit before starting a worker.

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
- bounded serialized output bytes;
- bounded message/remediation fields;
- safe repository-relative paths only;
- bounded positive line numbers.

External findings do not carry remediation authority. A pack may provide explanatory remediation text, but it cannot mark a finding as automatically fixable or invoke Steward's safe-fix machinery.

## Runtime guard model

`src/core/external-rule-runtime.ts` and `src/core/external-rule-worker.ts` provide a security-gated execution harness for testing the ABI without wiring external execution into normal scans.

Admission and execution are fail-closed:

1. The artifact must use one defined 32-bit WebAssembly linear memory with an explicit maximum.
2. The declared memory maximum must be less than or equal to the configured `maxMemoryMiB` limit.
3. Serialized input must fit the host input-byte ceiling.
4. Compilation and execution occur in an isolated worker with a hard wall-clock timeout.
5. The worker rejects every WebAssembly import before instantiation.
6. Memory size is checked before allocation, after allocation, and after `steward_run`.
7. Input and output pointers/lengths are validated against the module's current linear-memory bounds.
8. Output length is rejected before bytes are copied when it exceeds the configured ceiling.
9. Returned bytes must decode as valid UTF-8 JSON and pass the strict external-result contract.
10. Findings remain bounded by the manifest's `maxFindings` limit.

Requiring an explicit WebAssembly memory maximum is important: it makes `memory.grow` intrinsically unable to exceed the admitted ceiling. Worker termination protects the parent process from non-terminating rule code.

The adversarial test suite exercises unbounded memory declarations, over-limit memory declarations, forbidden imports, memory growth, infinite loops, oversized input/output, malformed JSON, and excessive findings.

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

The implementation now provides:

- deterministic snapshot construction;
- strict result parsing and validation;
- structural WebAssembly inspection for the required exports and zero-import rule;
- bounded linear-memory admission;
- isolated worker execution with wall-clock termination;
- input/output byte ceilings;
- pointer/range validation;
- adversarial runtime coverage;
- npm distribution verification for the runtime and worker artifacts.

This still does **not** enable external rule execution in `scan`, the GitHub Action, or any automatic workflow. The current `steward pack verify` command remains verification-only and reports `executionEnabled: false`.

Execution stays disabled until the remaining security gates tracked from issue #24 are complete, including structured audit evidence, artifact provenance policy, publisher/key revocation, explicit execution enablement, compatibility/rollback behavior, and end-to-end denial tests.
