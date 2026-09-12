import { readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { readdir, stat, open } from "node:fs/promises";
const TEXT_EXTENSIONS = new Set([".cjs", ".css", ".cue", ".env", ".html", ".ini", ".java", ".js", ".json", ".jsx", ".md", ".mdx", ".mjs", ".py", ".rb", ".rs", ".sh", ".sql", ".svg", ".toml", ".ts", ".tsx", ".txt", ".vue", ".xml", ".yaml", ".yml"]);
const DEFAULT_EXCLUDES = new Set([".git", "node_modules", "dist", "build", ".next", "coverage", ".steward"]);
function normalisePath(value) { return value.split(sep).join("/"); }
function shouldExclude(relPath, configured) { return normalisePath(relPath).split("/").some((part) => configured.has(part)); }
async function isBinary(path) { try {
    const handle = await open(path, "r");
    const buffer = Buffer.alloc(8192);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    await handle.close();
    return buffer.subarray(0, bytesRead).includes(0);
}
catch {
    return true;
} }
async function walk(root, current, config, out) { const entries = await readdir(current, { withFileTypes: true }); for (const entry of entries) {
    const absPath = join(current, entry.name);
    const relPath = normalisePath(relative(root, absPath));
    if (!relPath || shouldExclude(relPath, new Set([...DEFAULT_EXCLUDES, ...config.exclude])))
        continue;
    if (entry.isDirectory()) {
        await walk(root, absPath, config, out);
        continue;
    }
    if (!entry.isFile())
        continue;
    const s = await stat(absPath);
    const ext = absPath.toLowerCase().slice(absPath.lastIndexOf("."));
    const likelyText = TEXT_EXTENSIONS.has(ext) || ["README", ".gitignore", ".steward.json"].some((name) => entry.name === name || entry.name.startsWith(`${name}.`));
    const isText = likelyText && s.size <= config.maxFileSizeBytes && !(await isBinary(absPath));
    const file = { absPath, relPath, size: s.size, isText };
    if (isText) {
        try {
            file.content = await readFile(absPath, "utf8");
        }
        catch {
            file.isText = false;
        }
    }
    out.push(file);
} }
export async function collectFiles(root, config) { const out = []; await walk(root, root, config, out); return out.sort((a, b) => a.relPath.localeCompare(b.relPath)); }
