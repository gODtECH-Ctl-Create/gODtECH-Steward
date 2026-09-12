import { execFileSync } from "node:child_process";
import { relative } from "node:path";
import { normalisePath } from "./files.js";
export function runGit(root, args) { try { return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return null; } }
export function isGitRepository(root) { return runGit(root, ["rev-parse", "--show-toplevel"]) !== null; }
export function trackedFiles(root) { const output = runGit(root, ["ls-files"]); if (!output) return new Set(); return new Set(output.split(/\r?\n/).map(normalisePath).filter(Boolean)); }
export function worktreeDirty(root) { const output = runGit(root, ["status", "--porcelain"]); return output !== null && output.length > 0; }
export function gitFacts(inputRoot) { const topLevel = runGit(inputRoot, ["rev-parse", "--show-toplevel"]); if (!topLevel) return { isRepository: false, trackedFiles: new Set() }; return { isRepository: true, root: topLevel, branch: runGit(topLevel, ["branch", "--show-current"]) || undefined, commit: runGit(topLevel, ["rev-parse", "HEAD"]) || undefined, dirty: worktreeDirty(topLevel), trackedFiles: trackedFiles(topLevel) }; }
export function toRepoPath(root, absolutePath) { return normalisePath(relative(root, absolutePath)); }
