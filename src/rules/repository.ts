import type { FileEntry, Finding, ScanConfig } from "../core/types.js";

export function repositoryFindings(files: FileEntry[], config: ScanConfig): Finding[] {
  const findings: Finding[] = [];
  const paths = new Set(files.map((file) => file.relPath.toLowerCase()));

  if (!paths.has("readme.md") && !paths.has("readme")) {
    findings.push({ id: "repository.readme.missing", rule: "repository-readme", category: "repository", severity: "medium", message: "Repository has no README file.", fixable: false });
  }

  if (!paths.has(".gitignore")) {
    findings.push({ id: "repository.gitignore.missing", rule: "repository-gitignore", category: "repository", severity: "low", message: "Repository has no .gitignore file.", fixable: false });
  }

  for (const file of files) {
    if (file.size >= config.largeFileThresholdBytes) {
      findings.push({
        id: "repository.large-file",
        rule: "repository-large-file",
        category: "repository",
        severity: "medium",
        message: `Large file detected (${Math.ceil(file.size / 1024 / 1024)} MiB).`,
        path: file.relPath,
        fixable: false
      });
    }
  }
  return findings;
}
