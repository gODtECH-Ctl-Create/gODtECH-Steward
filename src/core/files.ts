import { open, readdir, readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import type { FileEntry, ScanConfig } from "./types.js";

const TEXT_EXTENSIONS = new Set([
  ".cjs", ".css", ".cue", ".env", ".html", ".ini", ".java", ".js", ".json",
  ".jsx", ".md", ".mdx", ".mjs", ".py", ".rb", ".rs", ".sh", ".sql", ".svg",
  ".toml", ".ts", ".tsx", ".txt", ".vue", ".xml", ".yaml", ".yml"
]);

export const DEFAULT_EXCLUDES = new Set([".git", "node_modules", "dist", "build", ".next", "coverage", ".steward"]);

export function normalisePath(value: string): string {
  return value.split(sep).join("/").replace(/^\.\//, "");
}

function excludePattern(pattern: string): RegExp {
  const normalised = normalisePath(pattern.trim()).replace(/^\/+|\/+$/g, "");
  const escaped = normalised.replace(/[|\\{}()[\]^$+?.*]/g, "\\$&");
  const source = `^${escaped.replaceAll("\\*\\*", ".*").replaceAll("\\*", "[^/]*")}(?:/|$)`;
  return new RegExp(source);
}

function shouldExclude(relPath: string, configured: string[]): boolean {
  const path = normalisePath(relPath);
  const patterns = [...DEFAULT_EXCLUDES].map(excludePattern).concat(configured.map(excludePattern));
  const basename = path.split("/").at(-1) ?? path;
  return patterns.some((pattern) => pattern.test(path) || pattern.test(basename));
}

async function isBinary(path: string): Promise<boolean> {
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  try {
    handle = await open(path, "r");
    const buffer = Buffer.alloc(8192);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    return buffer.subarray(0, bytesRead).includes(0);
  } catch {
    return true;
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

async function walk(root: string, current: string, config: ScanConfig, out: FileEntry[]): Promise<void> {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    const absPath = join(current, entry.name);
    const relPath = normalisePath(relative(root, absPath));
    if (!relPath || shouldExclude(relPath, config.exclude)) continue;
    if (entry.isDirectory()) {
      await walk(root, absPath, config, out);
      continue;
    }
    if (!entry.isFile()) continue;

    let size = 0;
    try {
      size = (await stat(absPath)).size;
    } catch {
      continue;
    }

    const dot = entry.name.lastIndexOf(".");
    const extension = dot >= 0 ? entry.name.slice(dot).toLowerCase() : "";
    const specialText = ["README", ".gitignore", ".steward.json", "LICENSE", "AGENTS.md"].some(
      (name) => entry.name === name || entry.name.startsWith(`${name}.`)
    );
    const likelyText = TEXT_EXTENSIONS.has(extension) || specialText;
    const isText = likelyText && size <= config.maxFileSizeBytes && !(await isBinary(absPath));
    const file: FileEntry = { absPath, relPath, size, isText };
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
