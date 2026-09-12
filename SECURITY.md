# Security Policy

## Scope

gODtECH Steward is repository-analysis tooling. It may inspect source files, Git metadata, configuration, and repository-local documentation.

Steward is intentionally conservative: scanning does not mutate repositories, safe fixes require explicit `--safe`, and security findings are never automatically remediated.

## Reporting a vulnerability

Please do not publish sensitive vulnerability details in a public issue. Use a private security-reporting channel supported by the repository owner.

When reporting, include the affected version or commit, reproduction steps, expected behavior, observed behavior, and any relevant sanitized logs.

Do not include real credentials, private keys, tokens, or other secrets in reports.
