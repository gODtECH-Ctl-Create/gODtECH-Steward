#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { applySafeFixes } from "./rules/hygiene.js";
import { initConfig } from "./core/config.js";
import { scanRepository } from "./core/scanner.js";
import { hasCiFailure, formatSummary, toJson, toText } from "./core/report.js";
import type { Severity } from "./core/types.js";

function usage(): string {
  return `gODtECH Steward

Usage:
  steward init [path]
  steward scan [path] [--json] [--ci]
  steward doctor [path] [--json] [--ci]
  steward report [path] --output <file>
  steward fix [path] --safe [--dry-run]
  steward --version

Environment:
  STEWARD_NO_COLOR=1   Disable future terminal decoration.
`;
}

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function targetPath(args: string[]): string {
  const commandWords = new Set(["scan", "doctor", "report", "fix", "init"]);
  for (let i = 1; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--output") {
      i += 1;
      continue;
    }
    if (!arg.startsWith("--") && !commandWords.has(arg)) return arg;
  }
  return ".";
}

function printDoctor(result: Awaited<ReturnType<typeof scanRepository>>): void {
  console.log(toText(result));
  console.log("");
  console.log(formatSummary(result));
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

  if (!["scan", "doctor", "report", "fix"].includes(command)) {
    throw new Error(`Unknown command: ${command}\n\n${usage()}`);
  }

  const result = await scanRepository(root);

  if (command === "fix") {
    if (!args.includes("--safe")) throw new Error("Refusing to modify files without explicit --safe.");
    const candidates = result.findings.filter((finding) => finding.fixable);
    if (candidates.length === 0) {
      console.log("No safe fixes are available.");
      return;
    }
    console.log(`${candidates.length} safe remediation finding(s) available.`);
    for (const finding of candidates) {
      console.log(`- ${finding.path ?? "repository"}: ${finding.message}`);
    }
    if (args.includes("--dry-run")) {
      console.log("Dry run only. No files changed.");
      return;
    }
    const files = (await import("./core/files.js")).collectFiles(root, (await import("./core/config.js")).loadConfig(root).then((value) => value.config) as never);
    const fileEntries = await files;
    const changed = applySafeFixes(fileEntries, candidates);
    console.log(changed.length ? `Safe fixes applied to ${changed.length} file(s):\n${changed.map((file) => `- ${file}`).join("\n")}` : "No files required a change.");
    return;
  }

  if (command === "report") {
    const output = option(args, "--output");
    if (!output) throw new Error("report requires --output <file>");
    await writeFile(resolve(root, output), toJson(result) + "\n", "utf8");
    console.log(`Report written to ${resolve(root, output)}`);
  } else if (command === "doctor") {
    if (args.includes("--json")) console.log(toJson(result));
    else printDoctor(result);
  } else if (args.includes("--json")) {
    console.log(toJson(result));
  } else {
    console.log(toText(result));
  }

  if (args.includes("--ci")) {
    const configResult = await import("./core/config.js").then((module) => module.loadConfig(root));
    if (hasCiFailure(result, configResult.config.ci.failOn as Severity)) process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
