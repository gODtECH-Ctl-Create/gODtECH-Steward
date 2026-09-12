import { execFileSync } from "node:child_process";

function runGit(root: string, args: string[]): string | null {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
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
  return new Set(output.split(/\r?\n/).map((value) => value.replaceAll("\\", "/")).filter(Boolean));
}

export function worktreeDirty(root: string): boolean {
  const output = runGit(root, ["status", "--porcelain"]);
  return output !== null && output.length > 0;
}
