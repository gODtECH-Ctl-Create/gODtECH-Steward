#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { collectFiles } from "./core/files.js";
import { applySafeFixes } from "./rules/hygiene.js";
import { initConfig, loadConfig } from "./core/config.js";
import { scanRepository } from "./core/scanner.js";
import { hasCiFailure, toJson, toText } from "./core/report.js";
import type { Severity } from "./core/types.js";

function usage(): string {
  return `gODtECH Steward

Usage:
  steward init [path]
  steward scan [path] [--json] [--ci]
  steward doctor [path] [--json] [--ci]
  steward report [path] --output <file>
  steward fix [path] --safe
  steward --version
`;
}

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function targetPath(args: string[]): string {
  return args.find((arg) => !arg.startsWith("--") && arg !== "scan" && arg !== "doctor" && arg !== "report" && arg !== "fix" && arg !== "init") ?? ".";
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] ?? "help";
  if (command === "--version" || command === "-v") {
    console.log("0.1.0");
    return;
  }
  if (command === "help" || command === "--help" || command === "-h") {
    console.log(usage());
    return;
  }

  const root = resolve(targetPath(args));

  if (command === "init") {
    const created = await initConfig(root);
    console.log(created ? "Created .steward.json" : ".steward.json already exists");
    return;
  }

  if (command === "fix") {
    if (!args.includes("--safe")) throw new Error("Refusing to modify files without explicit --safe.");
    const config = await loadConfig(root);
    const files = await collectFiles(root, config);
    const changed = applySafeFixes(files);
    console.log(changed.length ? `Safe fixes applied to ${changed.length} file(s):\n${changed.map((file) => `- ${file}`).join("\n")}` : "No safe fixes were necessary.");
    return;
  }

  if (!["scan", "doctor", "report"].includes(command)) throw new Error(`Unknown command: ${command}\n\n${usage()}`);
  const result = await scanRepository(root);
  const config = await loadConfig(root);

  if (command === "report") {
    const output = option(args, "--output");
    if (!output) throw new Error("report requires --output <file>");
    await writeFile(resolve(root, output), toJson(result) + "\n", "utf8");
    console.log(`Report written to ${output}`);
  } else if (args.includes("--json")) {
    console.log(toJson(result));
  } else {
    console.log(toText(result));
  }

  if (args.includes("--ci") && hasCiFailure(result, config.ci.failOn as Severity)) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
