# gODtECH Steward architecture context

```text
Repository
    |
    v
Configuration + Git facts
    |
    v
File collector
    |
    v
Rule registry
    |
    +--> repository
    +--> security
    +--> documentation
    +--> dependencies
    +--> hygiene
    |
    v
Stable findings
    |
    +--> text report
    +--> JSON report
    +--> CI decision
    +--> safe remediation
```

## Design principles

1. One scan engine serves the CLI and GitHub Action.
2. Rules are independent modules behind one stable contract.
3. Findings are data, not hidden side effects.
4. Remediation is driven by findings and must be explicitly enabled.
5. Repository state, configuration, and deterministic facts are resolved before deeper reasoning.
6. New language-specific or product-health analyzers should be adapters around this core rather than replacements for it.
