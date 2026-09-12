import { writeFileSync } from "node:fs";
const EXT = new Set([".cjs", ".css", ".cue", ".html", ".ini", ".java", ".js", ".jsx", ".json", ".mjs", ".py", ".rb", ".rs", ".sh", ".sql", ".toml", ".ts", ".tsx", ".txt", ".vue", ".xml", ".yaml", ".yml"]);
export function hygieneFindings(files) { const out = []; for (const f of files) {
    if (!f.isText || f.content === undefined)
        continue;
    const ext = f.relPath.slice(f.relPath.lastIndexOf(".")).toLowerCase();
    if (EXT.has(ext) && /[ \t]+$/m.test(f.content))
        out.push({ id: "hygiene.trailing-whitespace", rule: "trailing-whitespace", category: "code", severity: "low", message: "Trailing whitespace detected in a source/configuration file.", path: f.relPath, fixable: true });
    if (!f.content.endsWith("\n"))
        out.push({ id: "hygiene.missing-final-newline", rule: "final-newline", category: "code", severity: "low", message: "Text file does not end with a newline.", path: f.relPath, fixable: true });
} return out; }
export function applySafeFixes(files) { const changed = []; for (const f of files) {
    if (!f.isText || f.content === undefined)
        continue;
    const ext = f.relPath.slice(f.relPath.lastIndexOf(".")).toLowerCase();
    let next = f.content;
    if (EXT.has(ext))
        next = next.replace(/[ \t]+$/gm, "");
    if (!next.endsWith("\n"))
        next += "\n";
    if (next !== f.content) {
        writeFileSync(f.absPath, next, "utf8");
        changed.push(f.relPath);
    }
} return changed; }
