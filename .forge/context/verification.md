# Steward verification strategy

## Required local checks

- TypeScript type checking (`npm run check`)
- Production compilation (`npm run build`)
- Automated tests (`npm test`)
- Command-line interface (CLI) smoke tests for scan, doctor, report, fix, and CI behavior
- Safe-fix boundary tests, including dry-run non-mutation
- JSON serialization checks

## Required remote checks

- Steward self-scan workflow on push/pull request
- General CI workflow for type checking, build, and tests

## Safety checks

A security-sensitive finding must never be auto-fixed. Any mutation must require explicit `--safe`; `--dry-run` must never write.

## Release checks

Before a release tag, verify package metadata, distributable files, GitHub Action entrypoint, README commands, license, and changelog together. Do not publish until the current source and compiled distribution are consistent.
