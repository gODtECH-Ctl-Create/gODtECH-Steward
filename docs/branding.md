# gODtECH Steward branding

The product and CLI use **gODtECH** consistently. Terminal branding is rendered by the shared `@godtech/cli-identity` package so FORGE, STEWARD, and STACKPILOT use one canonical identity engine.

Primary CLI commands:

- `steward`
- `godtech-steward`

## Terminal identity behavior

Interactive human-readable commands show the canonical STEWARD identity banner.

Decorative output is automatically suppressed for:

- non-TTY output and pipes
- `--json`
- `--ci`
- `--version` / `-v`
- `forge-evidence`, whose stdout is machine-readable JSON

Set `STEWARD_NO_BANNER=1` to explicitly suppress the banner in an interactive terminal.

Set `STEWARD_ASCII=1` to use the ASCII fallback when Unicode block characters are not suitable for the terminal.
