# Trusted external rule packs

External rule packs are an opt-in extension point for gODtECH Steward. Built-in rules remain the default and Steward remains fully useful without third-party executable packs.

External packs are **analysis-only**. They may inspect the deterministic repository snapshot Steward deliberately provides and emit findings. They may not mutate repositories, spawn processes, access secrets or ambient environment state, use the network, or invoke Steward remediation.

The supported executable artifact format is WebAssembly (WASM). Arbitrary JavaScript or Node.js executable plugins are intentionally outside the trust model.

## Trust and execution are separate decisions

A pack can be **verified** without being **execution-admitted**.

Verification proves the artifact and publisher facts that Steward can check. Execution admission is a separate repository/user policy decision and defaults to disabled.

```text
manifest + artifact
      |
      v
verification
  allowlist
  publisher trust
  publisher/key revocation
  API compatibility
  SHA-256 integrity
  Ed25519 signature
  WASM validity
      |
      v
verified pack
      |
      v
execution governance
  explicit execution.enabled=true
  signed provenance present
  trusted source repository
  exact pack version pin
  exact artifact SHA-256 pin
      |
      v
governance-admitted pack
      |
      v
bounded WASM runtime gate
```

Normal `steward scan` and the GitHub Action still do not automatically execute external packs. The governance layer establishes the safe admission contract before any future opt-in execution surface is enabled.

## Manifest and signed provenance

The manifest schema is [`../schemas/steward-rule-pack-manifest.schema.json`](../schemas/steward-rule-pack-manifest.schema.json).

A pack may verify without provenance, but it cannot be execution-admitted without provenance metadata covered by the publisher signature:

```json
{
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
    "uri": "file:./pack.wasm"
  },
  "provenance": {
    "sourceRepository": "https://github.com/example-org/security-hygiene",
    "sourceCommit": "0123456789abcdef0123456789abcdef01234567",
    "builder": "github-actions/example-org/security-hygiene"
  },
  "capabilities": ["repository.read"],
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

The signature covers the manifest content other than the signature field itself, including provenance. Steward therefore treats provenance as a publisher-attested build statement, not an unsigned comment.

## Repository/user policy

The policy schema is [`../schemas/steward-external-pack-policy.schema.json`](../schemas/steward-external-pack-policy.schema.json).

```json
{
  "externalPacks": {
    "requireSigned": true,
    "allow": ["example.security-hygiene"],
    "trustedPublishers": ["example-org"],
    "trustedKeys": {
      "ed25519:example-key-1": "-----BEGIN PUBLIC KEY-----..."
    },
    "revokedPublishers": [],
    "revokedKeys": [],
    "execution": {
      "enabled": true,
      "trustedSourceRepositories": [
        "https://github.com/example-org/security-hygiene"
      ],
      "pins": {
        "example.security-hygiene": {
          "version": "1.2.0",
          "sha256": "<64-hex-digest>"
        }
      }
    }
  }
}
```

Execution defaults to `false`. Enabling execution requires signed packs, at least one trusted source repository, and at least one explicit version/digest pin. Malformed configuration fails closed.

Verification does not imply execution. A verified pack still receives an `execution_disabled`, provenance, source-trust, or pin-related denial unless every execution policy gate passes.

## Revocation

`revokedPublishers` and `revokedKeys` override allowlists and trust configuration.

A publisher or signing key present in a revocation list is rejected before execution admission even if it is also present in `trustedPublishers` or `trustedKeys`.

Recommended incident response for a compromised pack or key:

1. Add the publisher or key ID to the appropriate revocation list.
2. Disable `externalPacks.execution.enabled` while the incident is investigated.
3. Remove or replace affected execution pins.
4. Re-run `steward pack verify` and preserve the generated audit record.
5. Rotate the publisher key and review provenance before re-enabling execution admission.

## Compatibility and rollback

Manifest compatibility is exact and fail-closed for the current rule API and result schema. Steward does not guess compatibility across rule API changes.

Execution pins make upgrades and rollbacks explicit:

- an unpinned pack is never execution-admitted;
- a different pack version is denied with `pin_version_mismatch`;
- a different artifact digest is denied with `pin_digest_mismatch`;
- rollback means deliberately changing the pin to a previously reviewed version and its known SHA-256 digest;
- a Steward or rule-API upgrade that makes an older pack incompatible causes verification to fail before execution admission.

This prevents a registry, local replacement, or compromised publisher from silently swapping a previously reviewed artifact.

## Audit records

`steward pack verify` emits governance information in JSON output and can persist a standalone structured audit record:

```bash
steward pack verify manifest.json --artifact pack.wasm --json
steward pack verify manifest.json --artifact pack.wasm --audit-output steward-pack-audit.json
```

The audit contract is [`../schemas/steward-external-pack-audit.schema.json`](../schemas/steward-external-pack-audit.schema.json).

Audit records include:

- pack ID and version;
- publisher ID and key ID;
- artifact format and SHA-256 digest;
- rule API and result schema versions;
- signed provenance identity when present;
- verification acceptance/rejection and a stable reason code;
- execution-policy request state and admission decision.

Audit records intentionally exclude trusted public-key contents, repository secret values, and local artifact paths.

## Capability boundary

ABI v1 grants only the repository facts Steward deliberately serializes into the deterministic snapshot.

It does not grant:

```text
network
process.exec
filesystem.write
filesystem.arbitrary
environment.read
secrets.read
credential-store.read
Git mutation
Steward remediation
```

The accepted external rule ABI is no-import. A module cannot smuggle new host capabilities into ABI v1 through WebAssembly imports.

## Runtime safety

The security-gated runtime harness from the #34 milestone enforces:

- one defined bounded 32-bit linear memory with an explicit maximum;
- configured memory ceilings;
- bounded serialized input and output;
- isolated worker execution;
- hard wall-clock timeout;
- pointer and memory-range validation;
- strict UTF-8/JSON result parsing;
- `maxFindings` enforcement;
- fail-closed handling of malformed and adversarial modules.

Adversarial fixtures cover infinite loops, memory growth attempts, missing memory bounds, forbidden imports, invalid pointers, malformed JSON, oversized input/output, and excessive findings.

## Current rollout status

The trusted-pack security chain now has distinct layers for verification, ABI/runtime safety, and governance admission.

Normal repository scans and the GitHub Action still do not automatically run third-party executable packs. Any future execution surface must consume the same verified pack, governance decision, audit contract, and bounded runtime rather than bypassing them.

A public marketplace/registry and automatic remote pack download/update remain out of scope.
