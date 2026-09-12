#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { collectFiles } from "./core/files.js";
import { initConfig, loadConfig } from "./core/config.js";
import { scanRepository } from "./core/scanner.js";
import { RULE_PACKS, rulesForPacks } from "./core/rules.js";
import { calculateScanDelta, isScanResult } from "./core/delta.js";
import { toForgeEvidenceJson } from "./core/forge-evidence.js";
import { hasCiFailure, formatSummary, toJson, toText } from "./core/report.js";
import { applySafeFixes } from "./rules/hygiene.js";
import { verifyRulePack } from "./core/trust.js";
import { probeWasmSandbox } from "./core/wasm-sandbox.js";
import type { Severity } from "./core/types.js";

function usage(): string {
  return `gODtECH Steward

Usage:
  steward init [path]
  steward scan [path] [--json] [--ci]
  steward doctor [path] [--json] [--ci]
  steward report [path] --output <file> [--compare <report>]
  steward forge-evidence [path] [--output <file>] [--compare <report>]
  steward rules [path]
  steward fix [path] --safe [--dry-run]
  steward pack verify <manifest> --artifact <file> [--sandbox] [--json]
  steward --version
`;
}

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function targetPath(args: string[]): string {
  const commandWords = new Set(["scan", "doctor", "report", "forge-evidence", "rules", "fix", "init"]);
  for (let i = 1; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--output" || arg === "--compare") {
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

function printRules(disabledPacks: readonly string[], disabledRules: readonly string[]): void {
  const activePacks = RULE_PACKS.filter((pack) => !disabledPacks.includes(pack.id));
  const activeRules = new Set(rulesForPacks(activePacks, disabledRules).map((rule) => rule.id));
  console.log("gODtECH Steward rule packs");
  console.log("");
  for (const pack of RULE_PACKS) {
    const packEnabled = !disabledPacks.includes(pack.id);
    console.log(`${pack.id}@${pack.version} - ${pack.description} [${packEnabled ? "enabled" : "disabled"}]`);
    for (const rule of pack.rules) {
      const status = packEnabled && activeRules.has(rule.id) ? "enabled" : "disabled";
      console.log(`  [${status}] ${rule.id} - ${rule.description}`);
    }
  }
}

async function readPreviousReport(root: string, reportPath: string): Promise<Awaited<ReturnType<typeof scanRepository>>> {
  const candidate = JSON.parse(await readFile(resolve(root, reportPath), "utf8")) as unknown;
  if (!isScanResult(candidate)) {
    throw new Error(`Comparison report is not a valid gODtECH Steward scan result: ${reportPath}`);
  }
  return candidate;
}

async function verifyPackCommand(args: string[]): Promise<void> {
  if (args[1] !== "verify") throw new Error("pack supports only: verify <manifest> --artifact <file> [--sandbox] [--json]");
  const manifestPath = args[2];
  const artifactPath = option(args, "--artifact");
  if (!manifestPath || !artifactPath) throw new Error("pack verify requires <manifest> and --artifact <file>.");

  const root = resolve(".");
  const configResult = await loadConfig(root);
  if (configResult.warning) throw new Error(`Refusing external pack verification because .steward.json is invalid: ${configResult.warning}`);

  const verified = await verifyRulePack(manifestPath, artifactPath, configResult.config.externalPacks);
  let sandbox;
  if (args.includes("--sandbox")) {
    const bytes = await readFile(resolve(artifactPath));
    sandbox = await probeWasmSandbox(bytes, verified.manifest.limits);
    if (!sandbox.eligible) throw new Error(`WASM sandbox eligibility failed: ${sandbox.imports.length ? `imports are not allowed (${sandbox.imports.join(", ")})` : "module could not be admitted"}.`);
  }

  const output = {
    verified: true,
    executionEnabled: false,
    manifestSchemaVersion: verified.manifest.schemaVersion,
    ruleApi: verified.manifest.compatibility.ruleApi,
    resultSchema: verified.manifest.compatibility.resultSchema,
    pack: `${verified.manifest.id}@${verified.manifest.version}`,
    publisher: verified.manifest.publisher.id,
    keyId: verified.manifest.publisher.keyId,
    artifact: {
      path: verified.artifactPath,
      sizeBytes: verified.sizeBytes,
      sha256: verified.artifactSha256,
      format: verified.manifest.artifact.format
    },
    signatureVerified: verified.signatureVerified,
    sandbox: sandbox ?? { requested: false, eligible: verified.sandboxEligible, executed: false }
  };
  if (args.includes("--json")) console.log(JSON.stringify(output, null, 2));
  else {
    console.log("gODtECH Steward external rule-pack verification");
    console.log(`Verified: ${output.pack}`);
    console.log(`Publisher: ${output.publisher}`);
    console.log(`Signature: ${output.signatureVerified ? "verified" : "not required"}`);
    console.log(`Artifact SHA-256: ${output.artifact.sha256}`);
    console.log(`Execution enabled: no`);
    console.log(`Sandbox probe: ${sandbox ? (sandbox.eligible ? "eligible" : "rejected") : "not requested"}`);
  }
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

  if (command === "pack") {
    await verifyPackCommand(args);
    return;
  }

  const root = resolve(targetPath(args));
  if (command === "init") {
    const created = await initConfig(root);
    console.log(created ? "Created .steward.json" : ".steward.json already exists");
    return;
  }

  if (!["scan", "doctor", "report", "forge-evidence", "rules", "fix"].includes(command)) {
    throw new Error(`Unknown command: ${command}\n\n${usage()}`);
  }

  const configResult = await loadConfig(root);

  if (command === "rules") {
    printRules(configResult.config.packs.disabled, configResult.config.rules.disabled);
    return;
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
    for (const finding of candidates) console.log(`- ${finding.path ?? "repository"}: ${finding.message}`);
    if (args.includes("--dry-run")) {
      console.log("Dry run only. No files changed.");
      return;
    }
    const files = await collectFiles(root, configResult.config);
    const changed = applySafeFixes(files, candidates);
    console.log(changed.length ? `Safe fixes applied to ${changed.length} file(s):\n${changed.map((file) => `- ${file}`).join("\n")}` : "No files required a change.");
    return;
  }

  if (command === "forge-evidence") {
    const comparePath = option(args, "--compare");
    const scanDelta = comparePath ? calculateScanDelta(await readPreviousReport(root, comparePath), result) : undefined;
    const output = option(args, "--output");
    const evidence = toForgeEvidenceJson(result, configResult.config.ci.failOn, scanDelta);
    if (output) {
      await writeFile(resolve(root, output), evidence + "\n", "utf8");
      console.log(`FORGE evidence written to ${resolve(root, output)}`);
    } else {
      console.log(evidence);
    }
    return;
  }

  if (command === "report") {
    const output = option(args, "--output");
    if (!output) throw new Error("report requires --output <file>");
    const comparePath = option(args, "--compare");
    const scanDelta = comparePath ? calculateScanDelta(await readPreviousReport(root, comparePath), result) : undefined;
    await writeFile(resolve(root, output), toJson(result, scanDelta) + "\n", "utf8");
    console.log(`Report written to ${resolve(root, output)}`);
    if (scanDelta) {
      const sign = scanDelta.health.delta > 0 ? "+" : "";
      console.log(`Health delta ${sign}${scanDelta.health.delta} (${scanDelta.health.direction}); ${scanDelta.findings.added} added, ${scanDelta.findings.resolved} resolved.`);
    }
  } else if (command === "doctor") {
    if (args.includes("--json")) console.log(toJson(result));
    else printDoctor(result);
  } else if (args.includes("--json")) {
    console.log(toJson(result));
  } else {
    console.log(toText(result));
  }

  if (args.includes("--ci")) {
    const failOn = configResult.config.ci.failOn as Severity;
    if (hasCiFailure(result, failOn)) process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
