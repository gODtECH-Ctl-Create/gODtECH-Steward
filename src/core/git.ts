import { execFileSync } from "node:child_process";
import { relative } from "node:path";
import { normalisePath } from "./files.js";
import type { GitFacts } from "./types.js";

function runGit(root: string, args: string[]): string | null {
  try {
    const output = execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    return output.trim();
  } catch {
    return null;
  }
}

export function isGitRepository(root: string): boolean {
  return runGit(root, ["rev-parse", "--show-toplevel"]) !== null;
}

export function trackedFiles(root: string): Set<string> {
  const output = runGit(root, ["ls-files"]);
  if (!output) return new Set();
  return new Set(output.split(/\r?\n/).map(normalisePath).filter(Boolean));
}

export function worktreeDirty(root: string): boolean {
  const output = runGit(root, ["status", "--porcelain"]);
  return output !== null && output.length > 0;
}

export function gitFacts(root: string): GitFacts {
  const topLevel = runGit(root, ["rev-parse", "--show-toplevel"]);
  if (!topLevel) return { isRepository: false, trackedFiles: new Set() };
  const gitRoot = topLevel;
  const tracked = trackedFiles(root).map;
  return {
    isRepository: true,
    root: gitRoot,
    branch: runGit(root, ["branch", "--show-current"]) || undefined,
    commit: runGit(root, ["rev-parse", "HEAD"]) || undefined,
    dirty: worktreeDirty(root),
    trackedFiles: trackedFiles(root)
  };
}

export function toRepoPath(root: string, absolutePath: string): string {
  return normalisePath(relative(root, absolutePath));
}
