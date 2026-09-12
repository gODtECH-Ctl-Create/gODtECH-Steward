export function repositoryFindings(files, config) { const out = []; const paths = new Set(files.map(f => f.relPath.toLowerCase())); if (!paths.has("readme.md") && !paths.has("readme"))
    out.push({ id: "repository.readme.missing", rule: "repository-readme", category: "repository", severity: "medium", message: "Repository has no README file.", fixable: false }); if (!paths.has(".gitignore"))
    out.push({ id: "repository.gitignore.missing", rule: "repository-gitignore", category: "repository", severity: "low", message: "Repository has no .gitignore file.", fixable: false }); for (const f of files)
    if (f.size >= config.largeFileThresholdBytes)
        out.push({ id: "repository.large-file", rule: "repository-large-file", category: "repository", severity: "medium", message: `Large file detected (${Math.ceil(f.size / 1024 / 1024)} MiB).`, path: f.relPath, fixable: false }); return out; }
