# gODtECH Steward product context

## Intent

Steward is a deterministic software and repository housekeeping engine that turns maintenance into a repeatable engineering step.

## Primary users

- Individual developers maintaining active repositories.
- Small engineering teams that want consistent repository hygiene.
- Continuous integration (CI) pipelines that need an auditable health signal.

## Core promise

Observe repository health, explain findings, and offer only conservative remediation when the fix is deterministic.

## Product boundary

Steward is not a compiler, a general-purpose static analyzer, or an autonomous coding agent. Language-aware and artificial intelligence (AI)-assisted analysis may be added later as explicit adapters, but deterministic facts remain the foundation.

## Current delivery surfaces

- Terminal command-line interface (CLI)
- Composite GitHub Action
- Repository-owned `.steward.json` configuration
- Human-readable and JSON reporting

## Safety principle

No destructive or uncertain cleanup is automatic. Security findings are observation-only in the current release line.
