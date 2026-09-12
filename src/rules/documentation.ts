import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { FileEntry, Finding } from "../core/types.js";

function localTarget(raw: string): string | null {
  const value = raw.trim().replace(/^<|>$/g, "");
  if (!value || value.startsWith("#") || value.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("//")) return null;
  return value.split(/[?#]/, 1)[0] ?? null;
}

export function documentationFindings(root: string, files: FileEntry[]): Finding[] {
  const findings: Finding[] = [];
  for (const file of files) {
    if (!file.isText || file.content === undefined || !/\.mdx?$/i.test(file.relPath)) continue;
    const regex = /\[[^\]]*\]\(([^)]+)\)/g;
    for (const match of file.content.matchAll(regex)) {
      const target = localTarget(match[1] ?? "");
      if (!target) continue;
      const candidate = resolve(root, dirname(file.relPath), target);
      const relative = candidate.startsWith(`${resolve(root)}\\`) || candidate.startsWith(`${resolve(root)}/`);
      if (!relative || !existsSync(candidate)) {
        const line = file.content.slice(0, match.index ?? 0).split(/\r?\n/).length;
        findings.push({ id: "documentation.broken-local-link", rule: "broken-local-link", category: "documentation", severity: "medium", message: "Markdown link points to a missing local target.", path: file.relPath, line, fixable: false, details: target });
      }
    }
  }
  return findings;
}
