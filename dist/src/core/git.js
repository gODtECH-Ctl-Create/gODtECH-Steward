import { execFileSync } from "node:child_process";
function runGit(root, args) { try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}
catch {
    return null;
} }
export function isGitRepository(root) { return runGit(root, ["rev-parse", "--show-toplevel"]) !== null; }
export function trackedFiles(root) { const output = runGit(root, ["ls-files"]); if (!output)
    return new Set(); return new Set(output.split(/\r?\n/).map((v) => v.replaceAll("\\", "/")).filter(Boolean)); }
