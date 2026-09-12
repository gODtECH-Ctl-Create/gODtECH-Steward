# Security Policy

## Supported scope

gODtECH Steward is repository-analysis tooling. It may inspect source files, Git metadata, configuration, and repository-local documentation.

The `0.1.x` release line is the supported public release line. Development branches may contain incomplete functionality and are not supported for production use.

Steward is intentionally conservative: scanning does not mutate repositories, safe fixes require explicit `--safe`, and security findings are never automatically remediated.

## Reporting a vulnerability

Please do not publish sensitive vulnerability details in a public issue. Use GitHub's private vulnerability reporting for this repository when available, or contact the repository owner privately through the GitHub profile associated with `gODtECH-Ctl-Create`.

When reporting, include the affected version or commit, reproduction steps, expected behavior, observed behavior, and any relevant sanitized logs.

For supply-chain or release-integrity issues, include the package version, Git release tag, SHA-256 digest if available, and any GitHub artifact attestation or npm provenance reference.

Do not include real credentials, private keys, tokens, or other secrets in reports.

## External rule-pack boundary

External executable rule packs are disabled in the `0.1.x` release line. The current external-pack feature verifies manifests, policy, artifact hashes, signatures, and WebAssembly (WASM) validity, with a conservative sandbox-admission prototype.

Do not treat the verification path as permission to execute arbitrary third-party code. Full host API restrictions, runtime resource accounting, malicious-pack coverage, audit records, provenance, and revocation controls remain release gates before external execution is enabled.

## Release security

Public releases are intended to be produced only from reviewed release tags. The release workflow uses GitHub Actions OpenID Connect (OIDC) for npm Trusted Publishing and GitHub artifact attestations for release artifacts. Long-lived npm publishing tokens should not be added to repository secrets.
