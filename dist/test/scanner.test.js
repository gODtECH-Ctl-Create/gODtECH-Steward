import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { scanRepository } from "../src/core/scanner.js";
import { collectFiles } from "../src/core/files.js";
import { loadConfig } from "../src/core/config.js";
import { applySafeFixes } from "../src/rules/hygiene.js";
async function fixture() { return mkdtemp(join(tmpdir(), "steward-")); }
test("clean repository fixture has no housekeeping findings", async () => { const root = await fixture(); await writeFile(join(root, "README.md"), "# Example\n", "utf8"); await writeFile(join(root, ".gitignore"), "node_modules/\n", "utf8"); await writeFile(join(root, "src.ts"), "export const value = 1;\n", "utf8"); const result = await scanRepository(root); assert.equal(result.findings.length, 0); assert.equal(result.healthScore, 100); });
test("scanner detects strong secret patterns", async () => { const root = await fixture(); await writeFile(join(root, "README.md"), "# Example\n", "utf8"); await writeFile(join(root, ".gitignore"), "node_modules/\n", "utf8"); const token = ["ghp_", "123456789012345678901234567890"].join(""); await writeFile(join(root, "config.ts"), `const token = '${token}';\n`, "utf8"); const result = await scanRepository(root); assert.equal(result.findings.some((f) => f.severity === "critical"), true); });
test("safe fixes normalize source whitespace and final newline", async () => { const root = await fixture(); const path = join(root, "example.ts"); await writeFile(path, "const value = 1;   \nconst other = 2;", "utf8"); const config = await loadConfig(root); const files = await collectFiles(root, config); const changed = applySafeFixes(files); assert.deepEqual(changed, ["example.ts"]); assert.equal(await readFile(path, "utf8"), "const value = 1;\nconst other = 2;\n"); });
