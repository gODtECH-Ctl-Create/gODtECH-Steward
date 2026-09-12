# Decision 0004: trusted external rule packs

## Status
Accepted

## Context

Steward already has versioned built-in rule packs and a stable machine-readable result contract. Future third-party analyzers could be useful, but loading executable packages creates a supply-chain and repository-integrity boundary that must be explicit before implementation.

## Decision

External executable rule packs will be opt-in and fail-closed. The first supported executable artifact format will be WebAssembly (WASM), not arbitrary JavaScript or Node.js modules.

A pack must present a versioned manifest that declares:

- stable pack identity and semantic version;
- publisher identity and signing key identifier;
- compatible Steward rule API and result schema versions;
- immutable artifact SHA-256 digest and size;
- allowed capabilities;
- bounded execution resources;
- a publisher signature.

Steward will verify the manifest, compatibility, digest, signature, repository/user policy, capabilities, and resource limits before execution.

The external pack host interface will be read-only. Network access, arbitrary filesystem access, process execution, environment/secret reads, repository writes, and remediation authority are not granted by default and are not part of the initial contract.

## Consequences

- Steward remains safe and useful without external packs.
- A compromised or malicious pack has a constrained execution surface.
- Pack versions can be audited and correlated with findings.
- Trusted publishers and compatibility rules can evolve without changing the built-in rule-pack contract.
- A future registry can be introduced only after local verification and sandbox behavior are proven.

## Rejected alternatives

### Arbitrary npm/Node.js rule packages

Rejected because package installation and module loading would grant code execution in Steward's process and make trust depend on the full transitive JavaScript package supply chain.

### Unrestricted subprocess plugins

Rejected because subprocesses expand the attack surface to the operating system, filesystem, network, credentials, and executable discovery.

### Unsigned local plugins by default

Rejected because repository ownership is not sufficient proof of artifact integrity when code may be downloaded, cached, or replaced outside version control.

## Rollout gate

This decision is design-only until the following are implemented and verified:

1. manifest validation;
2. digest and Ed25519 signature verification;
3. explicit trust policy;
4. WASM host capability restrictions;
5. bounded execution;
6. malicious/invalid pack test corpus;
7. audit output;
8. consumer-style distribution verification.

Until then, Steward must not execute arbitrary external rule packs.