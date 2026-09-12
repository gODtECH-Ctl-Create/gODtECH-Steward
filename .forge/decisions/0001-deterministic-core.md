# Decision 0001: deterministic core

## Status
Accepted

## Decision

Steward's core scan engine will remain deterministic and dependency-light. It will establish repository facts and execute modular rules locally before any optional intelligent analysis is considered.

## Why

Repository existence, file size, Git tracking, configuration validity, local link resolution, and known credential patterns can be established more reliably with deterministic tooling. This follows the gODtECH FORGE reasoning-economy model.

## Consequences

- The initial product is useful without model credentials or network access.
- Findings are repeatable and auditable.
- AI can later explain, prioritize, or propose bounded fixes without owning basic facts.
