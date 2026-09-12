import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { scanRepository } from "../src/core/scanner.js";

async function fixture(): Promise<string> {
  return mkdtemp(join(tmpdir(), "steward-rules-"));
}

test("dependency rule detects conflicting lockfiles and package manager metadata", async () => {
  const root = await fixture();
  await writeFile(join(root, "README.md"), "# Example\n", "utf8");
  await writeFile(join(root, ".gitignore"), ".env\n.env.*\nnode_modules/\n", "utf8");
  await writeFile(join(root, "package.json"), JSON.stringify({ name: "example", packageManager: "pnpm@10.0.0" }), "utf8");
  await writeFile(join(root, "package-lock.json"), "{}\n", "utf8");
  await writeFile(join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n", "utf8");
  const result = await scanRepository(root);
  assert.equal(result.findings.some((finding) => finding.rule === "multiple-lockfiles"), true);
});

test("documentation rule detects broken local Markdown links", async () => {
  const root = await fixture();
  await writeFile(join(root, "README.md"), "# Example\n\nSee [missing](docs/missing.md).\n", "utf8");
  await writeFile(join(root, ".gitignore"), ".env\n.env.*\nnode_modules/\n", "utf8");
  const result = await scanRepository(root);
  const finding = result.findings.find((item) => item.rule === "broken-markdown-link");
  assert.ok(finding);
  assert.equal(finding?.category, "documentation");
});

test("documentation rule accepts query and fragment components and skips external URI schemes", async () => {
  const root = await fixture();
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "README.md"), "# Example\n\n[Guide](docs/guide.md?raw=1#install) [SSH](ssh://git.example.com/repo) [FTP](ftp://example.com/file)\n", "utf8");
  await writeFile(join(root, ".gitignore"), ".env\n.env.*\nnode_modules/\n", "utf8");
  await writeFile(join(root, "docs", "guide.md"), "# Guide\n", "utf8");
  const result = await scanRepository(root);
  assert.equal(result.findings.some((finding) => finding.rule === "broken-markdown-link"), false);
});

test("repository rule accepts lowercase README filenames", async () => {
  const root = await fixture();
  await writeFile(join(root, "readme.md"), "# Example\n", "utf8");
  await writeFile(join(root, ".gitignore"), ".env\n.env.*\n", "utf8");
  const result = await scanRepository(root);
  assert.equal(result.findings.some((finding) => finding.rule === "missing-readme"), false);
});

test("maintenance rule detects unresolved merge markers and groups TODO/FIXME markers per file", async () => {
  const root = await fixture();
  await writeFile(join(root, "README.md"), "# Example\n", "utf8");
  await writeFile(join(root, ".gitignore"), ".env\n.env.*\nnode_modules/\n", "utf8");
  await writeFile(join(root, "conflict.ts"), "<<<<<<< HEAD\nconst value = 1;\n=======\nconst value = 2;\n>>>>>>> branch\n// TODO: reconcile\n// FIXME: test this\n", "utf8");
  const result = await scanRepository(root);
  assert.equal(result.findings.some((finding) => finding.rule === "merge-conflict-marker"), true);
  const todo = result.findings.find((finding) => finding.rule === "todo-fixme");
  assert.ok(todo);
  assert.match(todo?.message ?? "", /2 TODO\/FIXME/);
});
