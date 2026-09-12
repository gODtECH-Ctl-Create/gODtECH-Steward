import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { scanRepository } from "../src/core/scanner.js";
import { collectFiles } from "../src/core/files.js";
import { loadConfig } from "../src/core/config.js";
import { applySafeFixes } from "../src/rules/hygiene.js";
import { toJson, hasCiFailure } from "../src/core/report.js";

async function fixture(): Promise<string> {
  return mkdtemp(join(tmpdir(), "steward-"));
}

async function writeBaseline(root: string): Promise<void> {
  await writeFile(join(root, "README.md"), "# Example\n", "utf8");
  await writeFile(join(root, ".gitignore"), "node_modules/\n.env\n.env.*\n", "utf8");
}

test("clean repository fixture has no housekeeping findings", async () => {
  const root = await fixture();
  await writeBaseline(root);
  await writeFile(join(root, "src.ts"), "export const value = 1;\n", "utf8");
  const result = await scanRepository(root);
  assert.equal(result.findings.length, 0);
  assert.equal(result.healthScore, 100);
});

test("scanner detects strong secret patterns", async () => {
  const root = await fixture();
  await writeBaseline(root);
  const token = ["ghp_", "123456789012345678901234567890"].join("");
  await writeFile(join(root, "config.ts"), `const token = '${token}';\n`, "utf8");
  const result = await scanRepository(root);
  const finding = result.findings.find((item) => item.rule === "possible-secret");
  assert.ok(finding);
  assert.equal(finding?.severity, "critical");
  assert.equal(finding?.confidence, "high");
});

test("safe fixes modify only files represented by fixable findings", async () => {
  const root = await fixture();
  const path = join(root, "example.ts");
  const cleanPath = join(root, "clean.ts");
  await writeFile(path, "const value = 1;   \nconst other = 2;", "utf8");
  await writeFile(cleanPath, "export const value = 1;\n", "utf8");
  const config = (await loadConfig(root)).config;
  const files = await collectFiles(root, config);
  const findings = await scanRepository(root);
  const fixable = findings.findings.filter((finding) => finding.fixable);
  const changed = applySafeFixes(files, fixable);
  assert.deepEqual(changed, ["example.ts"]);
  assert.equal(await readFile(path, "utf8"), "const value = 1;\nconst other = 2;\n");
  assert.equal(await readFile(cleanPath, "utf8"), "export const value = 1;\n");
});

test("malformed configuration becomes a visible finding", async () => {
  const root = await fixture();
  await writeBaseline(root);
  await writeFile(join(root, ".steward.json"), JSON.stringify({ maxFileSizeBytes: 1, largeFileThresholdBytes: 2 }), "utf8");
  const result = await scanRepository(root);
  assert.equal(result.findings.some((finding) => finding.rule === "invalid-steward-config"), true);
});

test("disabled rules are honored", async () => {
  const root = await fixture();
  await writeBaseline(root);
  await writeFile(join(root, ".steward.json"), JSON.stringify({ rules: { disabled: ["security"] } }), "utf8");
  const token = ["ghp_", "123456789012345678901234567890"].join("");
  await writeFile(join(root, "config.ts"), `const token = '${token}';\n`, "utf8");
  const result = await scanRepository(root);
  assert.equal(result.findings.some((finding) => finding.category === "security"), false);
});

test("JSON reporting is parseable and CI threshold is deterministic", async () => {
  const root = await fixture();
  await writeBaseline(root);
  const result = await scanRepository(root);
  const parsed = JSON.parse(toJson(result)) as typeof result & { generatedAt?: string };
  assert.equal(parsed.version, 1);
  assert.equal(hasCiFailure(result, "critical"), false);
});
