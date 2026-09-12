import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Finding, ScanContext, StewardRule } from "../core/types.js";

const MARKDOWN_LINK = /!?(?:\[[^\]]*\])\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;

function isSkippable(target: string): boolean {
  return /^(?:https?:\/\/|mailto:|tel:|data:|#)/i.test(target);
}

function stripFragment(target: string): string {
  return target.split("#", 1)[0] ?? target;
}

export const documentationRule: StewardRule = {
  id: "documentation",
  category: "documentation",
  description: "Checks local Markdown links for broken repository-relative targets.",
  run(context: ScanContext): Finding[] {
    const findings: Finding[] = [];
    for (const file of context.files) {
      if (!file.isText || file.content === undefined || !/\.(?:md|mdx)$/i.test(file.relPath)) continue;
      MARKDOWN_LINK.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = MARKDOWN_LINK.exec(file.content)) !== null) {
        const rawTarget = match[1];
        if (!rawTarget || isSkippable(rawTarget)) continue;
        const target = decodeURIComponent(stripFragment(rawTarget));
        if (!target || target.startsWith("/")) continue;
        const resolved = resolve(context.root, file.relPath, "..");
        const absolute = resolve(resolved, target);
        if (existsSync(absolute)) continue;
        const line = file.content.slice(0, match.index).split(/\r?\n/).length;
        findings.push({
          id: `documentation.broken-link.${file.relPath}:${line}:${target}`,
          rule: "broken-markdown-link",
          category: "documentation",
          severity: "low",
          message: `Local Markdown link does not resolve: ${target}`,
          path: file.relPath,
          line,
          fixable: false,
          confidence: "high",
          remediation: "Update the link to an existing repository path or remove the stale reference."
        });
      }
    }
    return findings;
  }
};
