import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { scanRepository } from "../src/core/scanner.js";

async function fixture(): Promise<string> {
  return mkdtemp(join(tmpdir(), "steward-packs-"));
}

async function baseline(root: string): Promise<void> {
  await writeFile(join(root, "README.md"), "# Example\n", "utf8");
  await writeFile(join(root, ".gitignore"), ".env\n.env.*\nnode_modules/\n", "utf8");
}

test("default scan enables the core and security rule packs", async () => {
  const root = await fixture();
  await baseline(root);
  const token = ["ghp_", "123456789012345678901234567890"].join("");
  await writeFile(join(root, "config.ts"), `const token = '${token}';\n`, "utf8");
  const result = await scanRepository(root);
  assert.deepEqual(result.rulePacks, [
    { id: "core", version: 1 },
    { id: "security", version: 1 },
  ]);
  assert.equal(result.findings.some((finding) => finding.rule === "possible-secret"), true);
});

test("disabling the security pack removes security findings without disabling core checks", async () => {
  const root = await fixture();
  await baseline(root);
  await writeFile(join(root, ".steward.json"), JSON.stringify({ packs: { disabled: ["security"] } }), "utf8");
  const token = ["ghp_", "123456789012345678901234567890"].join("");
  await writeFile(join(root, "config.ts"), `const token = '${token}';\n// TODO: keep this visible\n`, "utf8");
  const result = await scanRepository(root);
  assert.deepEqual(result.rulePacks, [{ id: "core", version: 1 }]);
  assert.equal(result.findings.some((finding) => finding.category === "security"), false);
  assert.equal(result.findings.some((finding) => finding.rule === "todo-fixme"), true);
});
