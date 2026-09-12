# Contributing to gODtECH Steward

## Development model

Steward follows the gODtECH FORGE workflow. Material changes should have a GitHub issue, use a dedicated branch, preserve a clean history, and include verification evidence.

## Rule changes

Rules should be deterministic, explainable, and conservative. A new rule should include a stable rule ID, a focused test, useful remediation guidance, and an explicit decision about whether automated fixing is safe.

## Local verification

```bash
npm install
npm run check
npm run build
npm test
```

For command-line interface (CLI) behavior, also exercise the changed command against a temporary fixture. For GitHub Action changes, verify the packaged `dist/` files and action inputs together.

## Pull requests

Describe what changed, why it changed, security or data implications, verification performed, and any known limitations. Do not include secrets or sensitive repository content in issues, commits, or pull requests.
