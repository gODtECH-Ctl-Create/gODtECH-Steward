import { writeFileSync } from "node:fs";
import type { Finding, FileEntry, ScanContext, StewardRule } from "../core/types.js";

const SAFE_EXTENSIONS = new Set([
  ".cjs", ".css", ".cue", ".html", ".ini", ".java", ".js", ".jsx", ".json", ".mjs",
  ".py", ".rb", ".rs", ".sh", ".sql", ".toml", ".ts", ".tsx", ".txt", ".vue", ".xml", ".yaml", ".yml"
]);

function extension(path: string): string {
  const index = path.lastIndexOf(".");
  return index >= 0 ? path.slice(index).toLowerCase() : "";
}

function hygieneFindingsForFile(file: FileEntry): Finding[] {
  if (!file.isText || file.content === undefined) return [];
  const findings: Finding[] = [];
  if (SAFE_EXTENSIONS.has(extension(file.relPath)) && /[ \t]+$/m.test(file.content)) {
    findings.push({
      id: `hygiene.trailing-whitespace.${file.relPath}`,
      rule: "trailing-whitespace",
      category: "code",
      severity: "low",
      message: "Trailing whitespace detected in a source/configuration file.",
      path: file.relPath,
      fixable: true,
      confidence: "high",
      remediation: "Remove trailing spaces and tabs without changing other content."
    });
  }
  if (file.content.length > 0 && !file.content.endsWith("\n")) {
    findings.push({
      id: `hygiene.missing-final-newline.${file.relPath}`,
      rule: "final-newline",
      category: "code",
      severity: "low",
      message: "Text file does not end with a newline.",
      path: file.relPath,
      fixable: true,
      confidence: "high",
      remediation: "Append one final newline."
    });
  }
  return findings;
}

export const hygieneRule: StewardRule = {
  id: "hygiene",
  category: "code",
  description: "Detects conservative, formatting-only maintenance opportunities.",
  run(context: ScanContext): Finding[] {
    return context.files.flatMap(hygieneFindingsForFile);
  }
};

export function applySafeFixes(files: readonly FileEntry[], findings: readonly Finding[]): string[] {
  const targetPaths = new Set(findings.filter((finding) => finding.fixable && finding.path).map((finding) => finding.path));
  const changed: string[] = [];
  for (const file of files) {
    if (!targetPaths.has(file.relPath) || !file.isText || file.content === undefined) continue;
    let next = file.content;
    if (SAFE_EXTENSIONS.has(extension(file.relPath))) next = next.replace(/[ \t]+$/gm, "");
    if (next.length > 0 && !next.endsWith("\n")) next += "\n";
    if (next !== file.content) {
      writeFileSync(file.absPath, next, "utf8");
      changed.push(file.relPath);
    }
  }
  return changed.sort();
}
