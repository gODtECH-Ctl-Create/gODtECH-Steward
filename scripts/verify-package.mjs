import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args, options = {}) {
  return execFileSync(command, args, { stdio: "pipe", encoding: "utf8", ...options });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runInstalledBin(binPath, args, cwd) {
  const result = spawnSync(binPath, args, { cwd, encoding: "utf8", shell: process.platform === "win32" });
  assert(result.status === 0, `Installed CLI failed: ${result.stderr}`);
  return result.stdout.trim();
}

const workspace = mkdtempSync(join(tmpdir(), "godtech-steward-package-"));
const fixture = join(workspace, "fixture");
const install = join(workspace, "install");
mkdirSync(fixture, { recursive: true });
mkdirSync(install, { recursive: true });

try {
  writeFileSync(join(fixture, "README.md"), "# Steward package fixture\n", "utf8");
  writeFileSync(join(fixture, ".gitignore"), ".env\n.env.*\nnode_modules/\n", "utf8");
  writeFileSync(
    join(fixture, "package.json"),
    JSON.stringify({ name: "fixture", version: "1.0.0", private: true, description: "Package verification fixture" }, null, 2) + "\n",
    "utf8",
  );

  const packJson = JSON.parse(run(npmCommand, ["pack", "--json"]));
  const filename = packJson?.[0]?.filename;
  assert(typeof filename === "string" && filename.length > 0, "npm pack did not return an archive filename.");
  const tarball = join(process.cwd(), filename);

  const archive = run("tar", ["-tzf", tarball]);
  const entries = archive.split(/\r?\n/).filter(Boolean);
  const normalised = entries.map((entry) => entry.replace(/^package\//, "").replaceAll("\\", "/"));
  const required = [
    "package.json",
    "README.md",
    "LICENSE",
    "action.yml",
    "action-runner.cjs",
    "schemas/steward-result.schema.json",
    "schemas/steward-forge-evidence.schema.json",
    "dist/src/cli.js",
    "dist/src/core/scanner.js",
    "dist/src/core/rule-packs.js",
    "dist/src/core/forge-evidence.js",
    "dist/src/rules/metadata.js",
  ];
  for (const entry of required) assert(normalised.includes(entry), `Package is missing required entry: ${entry}`);
  assert(!normalised.some((entry) => entry.startsWith("src/")), "Published package unexpectedly contains TypeScript source files.");
  assert(!normalised.some((entry) => entry.startsWith("node_modules/")), "Published package unexpectedly contains node_modules.");

  run(npmCommand, ["install", "--offline", "--no-package-lock", "--ignore-scripts", tarball], { cwd: install });
  const packageRoot = join(install, "node_modules", "@godtech", "steward");
  const cli = join(packageRoot, "dist", "src", "cli.js");
  const stewardBin = join(install, "node_modules", ".bin", process.platform === "win32" ? "steward.cmd" : "steward");
  const godtechStewardBin = join(install, "node_modules", ".bin", process.platform === "win32" ? "godtech-steward.cmd" : "godtech-steward");
  const actionRunner = join(packageRoot, "action-runner.cjs");

  const version = runInstalledBin(stewardBin, ["--version"], fixture);
  assert(version === "0.1.0", `Installed steward binary returned unexpected version: ${version}`);
  const aliasVersion = runInstalledBin(godtechStewardBin, ["--version"], fixture);
  assert(aliasVersion === version, "The godtech-steward alias does not resolve to the same version as steward.");

  const scanRaw = run(process.execPath, [cli, "scan", "--json", fixture], { cwd: fixture });
  const scan = JSON.parse(scanRaw);
  assert(scan.schemaVersion === 1, "Installed package did not emit schemaVersion 1.");
  assert(scan.tool === "gODtECH Steward", "Installed package returned an unexpected tool identity.");

  const forgeEvidenceRaw = run(process.execPath, [cli, "forge-evidence", fixture], { cwd: fixture });
  const forgeEvidence = JSON.parse(forgeEvidenceRaw);
  assert(forgeEvidence.schemaVersion === 1, "Installed Forge evidence did not emit schemaVersion 1.");
  assert(forgeEvidence.evidenceType === "repository-health", "Installed Forge evidence returned an unexpected evidence type.");
  assert(forgeEvidence.producer?.name === "gODtECH Steward", "Installed Forge evidence returned an unexpected producer.");
  assert(Array.isArray(forgeEvidence.observation?.findings), "Installed Forge evidence did not include findings.");

  const action = spawnSync(process.execPath, [actionRunner], {
    cwd: fixture,
    env: {
      ...process.env,
      INPUT_PATH: fixture,
      INPUT_ARGS: '["scan", "--ci"]',
    },
    encoding: "utf8",
  });
  assert(action.status === 0, `Packaged GitHub Action runner failed with exit code ${action.status}: ${action.stderr}`);

  const invalidAction = spawnSync(process.execPath, [actionRunner], {
    cwd: fixture,
    env: {
      ...process.env,
      INPUT_PATH: fixture,
      INPUT_ARGS: '{"not":"an array"}',
    },
    encoding: "utf8",
  });
  assert(invalidAction.status !== 0, "Packaged Action runner accepted a non-array args payload.");
  assert(/Action args must be a JSON array of strings/.test(invalidAction.stderr), "Packaged Action runner did not explain invalid args input.");

  console.log(`Package verification passed: ${relative(process.cwd(), tarball).split(sep).join("/")}`);
} finally {
  try {
    const packJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
    if (typeof packJson?.name === "string") {
      const candidate = join(process.cwd(), `${packJson.name.replace(/^@/, "").replace(/\//g, "-")}-${packJson.version}.tgz`);
      rmSync(candidate, { force: true });
    }
  } catch {
    // Keep cleanup best-effort so the original verification failure remains visible.
  }
  rmSync(workspace, { recursive: true, force: true });
}
