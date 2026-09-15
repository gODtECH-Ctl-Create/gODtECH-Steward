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

## README and website hero policy

The public product presentation must avoid fragile external image dependencies.

- The repository README references `./site/assets/steward-hero.svg` using a repository-relative path so GitHub resolves the asset through the repository rather than through a hard-coded `raw.githubusercontent.com` URL.
- The GitHub Pages hero graphic is rendered inline in `site/index.html`, so the primary website header cannot disappear because an external image URL, branch-qualified raw URL, content type, or cache path fails.
- `site/assets/steward-hero.svg` remains the reusable static repository hero asset and should be kept GitHub-safe: standalone SVG, no external scripts, no remote image references, and no external font dependency required for legibility.
- README/site release badges, installation examples, and release links must be updated together when a new public version is published.

When changing product presentation, verify both the GitHub README view and the deployed Pages site rather than treating one as proof that the other renders correctly.
