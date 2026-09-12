# Trusted external rule packs

External rule packs are a future extension point for gODtECH Steward. This document defines the security and compatibility boundary before any executable third-party pack is allowed to run.

## Core decision

Steward must remain useful without external packs. Built-in packs stay the default, and external packs are opt-in.

External packs are **analysis-only**. A pack may inspect repository facts exposed by Steward, emit findings, and declare deterministic resource limits. A pack may not mutate the repository, execute arbitrary child processes, access secrets, or invoke Steward remediation.

The first supported executable artifact format should be **WebAssembly (WASM)** with an explicit capability-limited host interface. Loading arbitrary JavaScript or Node.js packages as trusted rule code is intentionally out of scope.

## Trust model

A pack is eligible to progress toward execution only when all checks pass:

1. The manifest validates against the versioned rule-pack manifest schema.
2. The declared Steward rule API is compatible with the installed Steward version.
3. The artifact digest matches the manifest's SHA-256 digest.
4. The manifest has a valid signature from a configured trusted publisher key.
5. The pack identifier is permitted by repository/user policy.
6. The requested capabilities are allowed. The default capability set is read-only repository facts with no network, process, environment, or write access.
7. Runtime limits are present and within Steward's allowed maximums.
8. The WASM module passes the sandbox admission probe.

Unsigned, unverifiable, incompatible, or disallowed packs must fail closed before execution.

## Current implementation status

Steward currently provides **verification and sandbox admission tooling only**. External packs are **not loaded by normal scans or the GitHub Action**.

The CLI surface is:

```bash
steward pack verify manifest.json --artifact pack.wasm
steward pack verify manifest.json --artifact pack.wasm --sandbox --json
```

This implementation verifies identity, policy, compatibility, SHA-256 integrity, Ed25519 signature, and WASM validity. The optional sandbox probe rejects imported host capabilities and performs bounded worker-based module instantiation.

The probe is intentionally a prototype. It does not yet expose the repository host API, invoke arbitrary exported rule functions, or provide complete runtime accounting for WASM linear memory. Those gaps are release blockers for actual third-party rule execution.

## Manifest

The public manifest is versioned independently from the scan result contract.

```json
{
  "$schema": "https://gODtECH-Ctl-Create.github.io/gODtECH-Steward/schemas/steward-rule-pack-manifest.schema.json",
  "schemaVersion": 1,
  "kind": "steward-rule-pack",
  "id": "example.security-hygiene",
  "version": "1.2.0",
  "publisher": {
    "id": "example-org",
    "keyId": "ed25519:example-key-1"
  },
  "compatibility": {
    "ruleApi": 1,
    "resultSchema": 1
  },
  "artifact": {
    "format": "wasm",
    "sha256": "<64-hex-digest>",
    "sizeBytes": 123456,
    "uri": "<registry-or-file-reference>"
  },
  "capabilities": [
    "repository.read"
  ],
  "limits": {
    "maxExecutionMs": 1000,
    "maxMemoryMiB": 64,
    "maxFindings": 500
  },
  "signature": {
    "algorithm": "ed25519",
    "value": "<base64-signature>"
  }
}
```

The schema requires stable identity, compatibility, artifact integrity, declared capabilities, bounded resources, and signature metadata. The exact registry transport remains unspecified until the verification model is fully released.

## Capability boundary

The initial host API is intentionally narrow:

```text
repository.read
  repository metadata
  bounded file metadata/content already collected by Steward
  tracked-file facts
  Git facts
```

Never grant an external rule pack by default:

```text
network
process.exec
filesystem.write
filesystem.arbitrary
environment.read
secrets.read
credential-store.read
```

A rule pack also cannot write a file through the host API. Remediation remains a Steward-owned, finding-driven capability.

## Version negotiation

There are three independent versions:

- `schemaVersion`: the manifest format itself;
- `ruleApi`: the host interface available to the pack;
- `resultSchema`: the finding/result contract expected from Steward.

A pack must declare exact compatible versions or explicit supported ranges. Steward must reject ambiguous compatibility declarations rather than guessing.

Built-in pack versions such as `core@2` remain separate from the external manifest version.

## Policy

Repository-owned configuration controls admission:

```json
{
  "externalPacks": {
    "requireSigned": true,
    "allow": ["example.security-hygiene"],
    "trustedPublishers": ["example-org"],
    "trustedKeys": {
      "ed25519:example-key-1": "-----BEGIN PUBLIC KEY-----..."
    }
  }
}
```

The policy is opt-in and fails closed when malformed. The default configuration contains no allowed external packs and no trusted publishers.

The policy schema is [`../schemas/steward-external-pack-policy.schema.json`](../schemas/steward-external-pack-policy.schema.json).

## Supply-chain requirements

Before an external pack can execute in a release build, Steward needs:

- signed manifest verification;
- artifact hash verification;
- immutable version identity;
- publisher-key rotation and revocation rules;
- compatibility enforcement;
- reproducible packaging where practical;
- provenance information for the artifact build;
- explicit offline behavior when registry access is unavailable;
- audit output showing which external packs were accepted or rejected and why;
- full malicious-pack and resource-exhaustion test coverage.

A future registry must not silently replace an already accepted artifact.

## Execution safety

External execution must happen in a sandbox with:

- no network by default;
- no arbitrary filesystem access;
- no process spawning;
- bounded memory and execution time;
- bounded output/findings;
- deterministic host inputs;
- no access to raw secret values.

A failed pack must degrade to a finding about the pack execution problem. It must not terminate unrelated built-in rules or mutate repository state.

## Rollout order

1. Manifest schema and compatibility tests. **Complete.**
2. Trust-policy configuration model. **Complete.**
3. Signature and digest verification. **Complete as verification-only tooling.**
4. WASM host interface and sandbox prototype. **Admission prototype complete; host API and full resource enforcement remain.**
5. Consumer-style tests with malicious/invalid packs. **In progress.**
6. Documentation and audit output. **In progress.**
7. Only then consider a public registry or third-party pack publishing workflow.

Until the remaining gates are complete, Steward must continue to reject arbitrary external executable rule packs during normal scans and GitHub Action execution.
