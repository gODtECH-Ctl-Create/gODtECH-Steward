import type { Finding, ScanContext, StewardRule } from "../core/types.js";

const GENERATED_PATTERNS = [
  /^coverage\//,
  /^\.next\//,
  /^\.nyc_output\//,
  /^\.turbo\//,
  /^\.vite\//,
  /^playwright-report\//,
  /^test-results\//,
  /(^|\/)npm-debug\.log(?:\.\d+)?$/,
  /(^|\/)yarn-debug\.log$/,
  /(^|\/)yarn-error\.log$/,
  /(^|\/)\.DS_Store$/,
  /(^|\/)Thumbs\.db$/,
  /(^|\/)[^/]+\.tsbuildinfo$/,
  /(^|\/)\.eslintcache$/
];

function hasFile(context: ScanContext, path: string): boolean {
  const expected = path.toLowerCase();
  return context.files.some((file) => file.relPath.toLowerCase() === expected)
    || [...context.trackedFiles].some((tracked) => tracked.toLowerCase() === expected);
}

function trackedGeneratedFiles(context: ScanContext): string[] {
  return [...context.trackedFiles]
    .filter((path) => GENERATED_PATTERNS.some((pattern) => pattern.test(path)))
    .sort();
}

function requiredGitignorePatterns(context: ScanContext): string[] {
  const patterns = [".env", ".env.*"];
  if (hasFile(context, "package.json")) patterns.push("node_modules/");
  return patterns;
}

function gitignoreNeeds(content: string | undefined, patterns: string[]): string[] {
  if (!content) return patterns;
  const lines = new Set(content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
  return patterns.filter((pattern) => !lines.has(pattern));
}

export const repositoryRule: StewardRule = {
  id: "repository",
  category: "repository",
  description: "Checks core repository structure, tracked artifacts, and Git ignore hygiene.",
  run(context): Finding[] {
    const findings: Finding[] = [];
    if (!hasFile(context, "README.md") && !hasFile(context, "README")) {
      findings.push({
        id: "repository.missing-readme",
        rule: "missing-readme",
        category: "repository",
        severity: "medium",
        message: "No README file was found at the repository root.",
        fixable: false,
        confidence: "high",
        remediation: "Add a root README that explains the project and its supported workflow."
      });
    }

    const gitignore = context.files.find((file) => file.relPath === ".gitignore");
    if (!gitignore) {
      findings.push({
        id: "repository.missing-gitignore",
        rule: "missing-gitignore",
        category: "repository",
        severity: context.git.isRepository ? "medium" : "low",
        message: "No .gitignore file was found.",
        fixable: false,
        confidence: "high",
        remediation: "Add a .gitignore appropriate to the project's languages and tooling."
      });
    } else if (gitignore.content) {
      for (const pattern of gitignoreNeeds(gitignore.content, requiredGitignorePatterns(context))) {
        findings.push({
          id: `repository.gitignore-missing.${pattern.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}`,
          rule: "gitignore-baseline",
          category: "repository",
          severity: "low",
          message: `.gitignore does not explicitly ignore ${pattern}.`,
          path: ".gitignore",
          fixable: false,
          confidence: "medium",
          remediation: `Consider adding ${pattern} if it is generated or contains local-only data.`
        });
      }
    }

    const large = context.files
      .filter((file) => file.size >= context.config.largeFileThresholdBytes)
      .sort((a, b) => b.size - a.size);
    for (const file of large) {
      findings.push({
        id: `repository.large-file.${file.relPath}`,
        rule: "large-file",
        category: "repository",
        severity: "medium",
        message: `Large file detected (${file.size.toLocaleString()} bytes).`,
        path: file.relPath,
        fixable: false,
        confidence: "high",
        remediation: "Review whether the file belongs in source control or should use an artifact/storage workflow."
      });
    }

    for (const path of trackedGeneratedFiles(context)) {
      findings.push({
        id: `repository.tracked-generated.${path}`,
        rule: "tracked-generated-output",
        category: "repository",
        severity: "medium",
        message: "A commonly generated output or local artifact is tracked by Git.",
        path,
        fixable: false,
        confidence: "high",
        remediation: "Remove the artifact from version control only after confirming it is disposable, then add an appropriate ignore rule."
      });
    }

    return findings;
  }
};
