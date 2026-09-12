import { writeFileSync } from "node:fs";
import type { FileEntry, Finding } from "../core/types.js";

const SAFE_TRAILING_WHITESPACE_EXTENSIONS = new Set([
  ".cjs", ".css", ".cue", ".html", ".ini", ".java", ".js", ".jsx", ".json", ".mjs", ".py", ".rb", ".rs", ".sh", ".sql", ".toml", ".ts", ".tsx", ".txt", ".vue", ".xml", ".yaml", ".yml"
]);

export function hygieneFindings(files: FileEntry[]): Finding[] {
  const findings: Finding[] = [];
  for (const file of files) {
    if (!file.isText || file.content === undefined) continue;
    const ext = file.relPath.slice(file.relPath.lastIndexOf(".")).toLowerCase();
    if (SAFE_TRAILING_WHITESPACE_EXTENSIONS.has(ext) && /[ \t]+$/m.test(file.content)) {
      findings.push({ id: "hygiene.trailing-whitespace", rule: "trailing-whitespace", category: "code", severity: "low", message: "Trailing whitespace detected in a source/configuration file.", path: file.relPath, fixable: true });
    }
    if (!file.content.endsWith("\n")) {
      findings.push({ id: "hygiene.missing-final-newline", rule: "final-newline", category: "code", severity: "low", message: "Text file does not end with a newline.", path: file.relPath, fixable: true });
    }
  }
  return findings;
}

export function applySafeFixes(files: FileEntry[]): string[] {
  const changed: string[] = [];
  for (const file of files) {
    if (!file.isText || file.content === undefined) continue;
    const ext = file.relPath.slice(file.relPath.lastIndexOf(".")).toLowerCase();
    let next = file.content;
    if (SAFE_TRAILING_WHITESPACE_EXTENSIONS.has(ext)) next = next.replace(/[ \t]+$/gm, "");
    if (!next.endsWith("\n")) next += "\n";
    if (next !== file.content) {
      writeFileSync(file.absPath, next, "utf8");
      changed.push(file.relPath);
    }
  }
  return changed;
}
