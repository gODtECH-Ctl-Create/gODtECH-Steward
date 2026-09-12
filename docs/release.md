# gODtECH Steward release procedure

This project uses a tag-driven release workflow for the public npm package `@godtech/steward`.

## Release identity

The first public release is:

```text
Package: @godtech/steward
Version: 0.1.0
Git tag: v0.1.0
License: Apache-2.0
Repository: https://github.com/gODtECH-Ctl-Create/gODtECH-Steward.git
```

The tag must exactly match the version in `package.json`. The release workflow rejects mismatched tags.

## One-time npm Trusted Publishing setup

Configure a Trusted Publisher for the npm package before creating the first release:

```text
Provider: GitHub Actions
Owner / organization or user: gODtECH-Ctl-Create
Repository: gODtECH-Steward
Workflow filename: publish.yml
Environment: none
```

The workflow requires OpenID Connect (OIDC) token permission and publishes with `npm publish --access public`. Current npm Trusted Publishing requires a recent npm CLI and Node.js 22.14.0 or newer; Steward's release workflow uses Node.js 24.x.

Do not add an npm automation token to the repository for publishing. Trusted Publishing provides short-lived credentials and, for a public GitHub repository and public package, npm automatically generates package provenance attestations.

Official references:

- https://docs.npmjs.com/trusted-publishers/
- https://docs.npmjs.com/generating-provenance-statements/

## Release sequence

1. Merge the release-preparation pull request into `MASTER`.
2. Confirm `MASTER` is green.
3. Confirm the `package.json` version is `0.1.0`.
4. Create the annotated release tag `v0.1.0` from the verified `MASTER` commit.
5. Push the tag to GitHub.
6. GitHub Actions runs `.github/workflows/publish.yml`.
7. The workflow checks the package identity and tag, runs the full verification suite, runs package distribution verification, creates the npm tarball, generates `SHA256SUMS`, generates an SPDX SBOM, and creates signed artifact attestations.
8. The workflow publishes the package using npm Trusted Publishing.
9. The workflow verifies that `@godtech/steward@0.1.0` is available from the npm registry.
10. The workflow creates the GitHub Release and attaches the tarball, checksum file, and SBOM.

## Why the release is tag-driven

A release is a deliberate immutable version boundary. Normal branch pushes must never publish to npm.

The publish workflow only responds to tags matching `v*`, and then independently verifies that the tag is exactly `v${package.version}` before publishing.

## Provenance and signing

There are two complementary trust records:

### npm provenance

npm Trusted Publishing uses OpenID Connect and automatically generates provenance for public packages published from supported public repositories. The provenance links the package to its source and build workflow.

### GitHub artifact attestation

The release workflow also creates a GitHub artifact attestation for the actual npm tarball using `actions/attest@v4`. A second attestation binds the tarball to its SPDX SBOM. GitHub's attestation service uses Sigstore-backed signing for these records.

Official reference:

- https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations
- https://github.com/actions/attest

This is intentionally keyless release signing. We are not inventing or storing a long-lived GPG private key in GitHub Actions.

## Local release preflight

Before creating the tag, run:

```bash
npm ci
npm run verify:release
npm run verify
npm run verify:package
npm pack --silent
npm sbom --sbom-format spdx > sbom.spdx.json
```

`verify:release` checks package identity, repository URL, license, version, publish configuration, required release files, tag strategy, artifact attestation permissions, and the publish command.

## Release artifacts

The GitHub Release should contain:

```text
@godtech/steward-0.1.0.tgz
SHA256SUMS
sbom.spdx.json
```

Consumers can verify the tarball digest locally with:

```bash
sha256sum -c SHA256SUMS
```

Consumers using the GitHub Command Line Interface (CLI) can additionally verify the artifact attestation published with the release. GitHub supports attestation verification through `gh attestation verify` and offline verification.

Official reference:

- https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/verify-attestations-offline

## GitHub Action reference policy

For production projects, prefer a release tag or exact commit SHA rather than `@MASTER`:

```yaml
- uses: gODtECH-Ctl-Create/gODtECH-Steward@v0.1.0
```

For high-assurance environments, pin the Action to the exact release commit SHA and review the release artifacts before adoption.

## Release blockers

Do not publish until all of these are true:

- `MASTER` passes Continuous Integration (CI).
- `npm run verify:package` passes.
- `npm run verify:release` passes for the intended tag.
- Source and committed `dist/` remain consistent.
- External executable rule packs remain disabled unless their separate release gates have been completed.
- The npm Trusted Publisher is configured for `publish.yml`.
- The exact release tag points at the reviewed source commit.
