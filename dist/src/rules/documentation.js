import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
function localTarget(raw) { const value = raw.trim().replace(/^<|>$/g, ""); if (!value || value.startsWith("#") || value.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("//"))
    return null; return value.split(/[?#]/, 1)[0] ?? null; }
export function documentationFindings(root, files) { const out = []; for (const f of files) {
    if (!f.isText || f.content === undefined || !/\.mdx?$/i.test(f.relPath))
        continue;
    const regex = /\[[^\]]*\]\(([^)]+)\)/g;
    for (const m of f.content.matchAll(regex)) {
        const target = localTarget(m[1] ?? "");
        if (!target)
            continue;
        const candidate = resolve(root, dirname(f.relPath), target);
        const base = resolve(root);
        const inside = candidate === base || candidate.startsWith(base + "\\") || candidate.startsWith(base + "/");
        if (!inside || !existsSync(candidate)) {
            const line = f.content.slice(0, m.index ?? 0).split(/\r?\n/).length;
            out.push({ id: "documentation.broken-local-link", rule: "broken-local-link", category: "documentation", severity: "medium", message: "Markdown link points to a missing local target.", path: f.relPath, line, fixable: false, details: target });
        }
    }
} return out; }
