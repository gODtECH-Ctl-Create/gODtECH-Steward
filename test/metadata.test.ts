import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { scanRepository } from "../src/core/scanner.js";

async function fixture(): Promise<string> {
  return mkdtemp(join(tmpdir(), "steward-metadata-"));
}

test("project metadata rule reports missing package identity and description", async () => {
  const root = await fixture();
  await writeFile(join(root, "README.md"), "# Example\n", "utf8");
  await writeFile(join(root, ".gitignore"), ".env\n.env.*\nnode_modules/\n", "utf8");
  await writeFile(join(root, "package.json"), JSON.stringify({ version: "1.0.0", license: "Apache-2.0" }), "utf8");

  const result = await scanRepository(root);
  const rules = result.findings.filter((finding) => finding.rule === "package-metadata");

  assert.equal(rules.some((finding) => finding.id === "metadata.package-name-missing"), true);
  assert.equal(rules.some((finding) => finding.id === "metadata.package-description-missing"), true);
});

test("private packages are not required to declare a publishable version or license", async () => {
  const root = await fixture();
  await writeFile(join(root, "README.md"), "# Example\n", "utf8");
  await writeFile(join(root, ".gitignore"), ".env\n.env.*\nnode_modules/\n", "utf8");
  await writeFile(join(root, "package.json"), JSON.stringify({ private: true, name: "example", description: "Private application" }), "utf8");

  const result = await scanRepository(root);
  assert.equal(result.findings.some((finding) => finding.id === "metadata.package-version-missing"), false);
  assert.equal(result.findings.some((finding) => finding.id === "metadata.package-license-missing"), false);
});

test("generated test artifacts are flagged when tracked by Git", async () => {
  const root = await fixture();
  await mkdir(join(root, "playwright-report"));
  await writeFile(join(root, "README.md"), "# Example\n", "utf8");
  await writeFile(join(root, ".gitignore"), ".env\n.env.*\nnode_modules/\n", "utf8");
  await writeFile(join(root, "playwright-report", "index.html"), "<html></html>\n", "utf8");
  await writeFile(join(root, "build.ts"), "console.log('artifact')\n", "utf8");

  const result = await scanRepository(root);
  const artifact = result.findings.find((finding) => finding.rule === "tracked-generated-output");

  assert.equal(artifact, undefined);
});
