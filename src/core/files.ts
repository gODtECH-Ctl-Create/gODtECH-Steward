import { readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import type { FileEntry, ScanConfig } from "./types.js";

const TEXT_EXTENSIONS = new Set([
  ".cjs", ".css", ".cue", ".env", ".html", ".ini", ".java", ".js", ".json",
  ".jsx", ".md", ".mdx", ".mjs", ".py", ".rb", ".rs", ".sh", ".sql", ".svg",
  ".toml", ".ts", ".tsx", ".txt", ".vue", ".xml", ".yaml", ".yml"
]);

const DEFAULT_EXCLUDES = new Set([".git", "node_modules", "dist", "build", ".next", "coverage", ".steward"]);

function normalisePath(value: string): string {
  return value.split(sep).join("/");
}

function shouldExclude(relPath: string, configured: Set<string>): boolean {
  const parts = normalisePath(relPath).split("/");
  return parts.some((part) => configured.has(part));
}

async function isBinary(path: string): Promise<boolean> {
  try {
    const handle = await import("node:fs/promises").then((fs) => fs.open(path, "r"));
    const buffer = Buffer.alloc(8192);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    await handle.close();
    return buffer.subarray(0, bytesRead).includes(0);
  } catch {
    return true;
  }
}

async function walk(root: string, current: string, config: ScanConfig, out: FileEntry[]): Promise<void> {
  const entries = await import("node:fs/promises").then((fs) => fs.readdir(current, { withFileTypes: true }));
  for (const entry of entries) {
    const absPath = join(current, entry.name);
    const relPath = normalisePath(relative(root, absPath));
    if (!relPath || shouldExclude(relPath, new Set([...DEFAULT_EXCLUDES, ...config.exclude]))) continue;
    if (entry.isDirectory()) {
      await walk(root, absPath, config, out);
      continue;
    }
    if (!entry.isFile()) continue;

    const stat = await import("node:fs/promises").then((fs) => fs.stat(absPath));
    const ext = absPath.toLowerCase().slice(absPath.lastIndexOf("."));
    const likelyText = TEXT_EXTENSIONS.has(ext) || ["README", ".gitignore", ".steward.json"].some((name) => entry.name === name || entry.name.startsWith(`${name}.`));
    const isText = likelyText && stat.size <= config.maxFileSizeBytes && !(await isBinary(absPath));
    const file: FileEntry = { absPath, relPath, size: stat.size, isText };
    if (isText) {
      try {
        file.content = await readFile(absPath, "utf8");
      } catch {
        file.isText = false;
      }
    }
    out.push(file);
  }
}

export async function collectFiles(root: string, config: ScanConfig): Promise<FileEntry[]> {
  const out: FileEntry[] = [];
  await walk(root, root, config, out);
  return out.sort((a, b) => a.relPath.localeCompare(b.relPath));
}
