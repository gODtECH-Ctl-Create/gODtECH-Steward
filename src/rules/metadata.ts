import type { Finding, ScanContext, StewardRule } from "../core/types.js";

interface PackageMetadata {
  private?: unknown;
  name?: unknown;
  version?: unknown;
  description?: unknown;
  license?: unknown;
}

function packageJson(context: ScanContext): { file: ScanContext["files"][number]; metadata: PackageMetadata } | undefined {
  const file = context.files.find((entry) => entry.relPath === "package.json");
  if (!file || !file.content) return undefined;

  try {
    const metadata = JSON.parse(file.content) as unknown;
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return undefined;
    return { file, metadata: metadata as PackageMetadata };
  } catch {
    return undefined;
  }
}

function missingString(value: unknown): boolean {
  return typeof value !== "string" || value.trim().length === 0;
}

export const metadataRule: StewardRule = {
  id: "project-metadata",
  category: "configuration",
  description: "Checks package metadata for clear project identity and publishable-package completeness.",
  run(context: ScanContext): Finding[] {
    const source = packageJson(context);
    if (!source) return [];

    const { file, metadata } = source;
    const findings: Finding[] = [];

    if (missingString(metadata.name)) {
      findings.push({
        id: "metadata.package-name-missing",
        rule: "package-metadata",
        category: "configuration",
        severity: "medium",
        message: "package.json does not define a non-empty package name.",
        path: file.relPath,
        fixable: false,
        confidence: "high",
        remediation: "Add a stable package name that identifies the project in its ecosystem."
      });
    }

    if (missingString(metadata.description)) {
      findings.push({
        id: "metadata.package-description-missing",
        rule: "package-metadata",
        category: "configuration",
        severity: "low",
        message: "package.json does not define a non-empty project description.",
        path: file.relPath,
        fixable: false,
        confidence: "high",
        remediation: "Add a concise description so tooling and registries can identify the project's purpose."
      });
    }

    if (metadata.private !== true && missingString(metadata.version)) {
      findings.push({
        id: "metadata.package-version-missing",
        rule: "package-metadata",
        category: "configuration",
        severity: "low",
        message: "A non-private package.json does not define a non-empty version.",
        path: file.relPath,
        fixable: false,
        confidence: "high",
        remediation: "Add a semantic package version before treating the project as a publishable package."
      });
    }

    if (metadata.private !== true && missingString(metadata.license)) {
      findings.push({
        id: "metadata.package-license-missing",
        rule: "package-metadata",
        category: "configuration",
        severity: "low",
        message: "A non-private package.json does not define a license.",
        path: file.relPath,
        fixable: false,
        confidence: "high",
        remediation: "Declare the package license and keep it consistent with the repository's license file and policy."
      });
    }

    return findings;
  }
};
