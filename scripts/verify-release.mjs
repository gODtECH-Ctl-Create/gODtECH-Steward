import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function run(command, args) {
  return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const packagePath = resolve("package.json");
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
const expectedTag = process.env.RELEASE_TAG ?? `v${pkg.version}`;
const expectedVersion = `v${pkg.version}`;

assert(pkg.name === "@godtech/steward", `Unexpected package name: ${pkg.name}`);
assert(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(pkg.version), `Invalid semantic version: ${pkg.version}`);
assert(expectedTag === expectedVersion, `Release tag ${expectedTag} does not match package version ${expectedVersion}.`);
assert(pkg.license === "Apache-2.0", "Package license must remain Apache-2.0.");
assert(pkg.publishConfig?.access === "public", "Package publishConfig.access must be public.");
assert(pkg.repository?.url === "https://github.com/gODtECH-Ctl-Create/gODtECH-Steward.git", "Package repository URL does not match the canonical GitHub repository.");
assert(pkg.repository?.type === "git", "Package repository type must be git.");
assert(pkg.files?.includes("dist/src"), "Published package must include compiled dist/src.");
assert(pkg.files?.includes("schemas"), "Published package must include versioned schemas.");

const required = [
  "README.md",
  "LICENSE",
  "action.yml",
  "action-runner.cjs",
  "dist/src/cli.js",
  "dist/src/core/config.js",
  "dist/src/core/trust.js",
  "dist/src/core/wasm-sandbox.js",
  "schemas/steward-result.schema.json",
  "schemas/steward-forge-evidence.schema.json",
  "schemas/steward-rule-pack-manifest.schema.json",
  "schemas/steward-external-pack-policy.schema.json",
];
for (const path of required) assert(existsSync(resolve(path)), `Required release file is missing: ${path}`);

const workflow = readFileSync(resolve(".github/workflows/publish.yml"), "utf8");
assert(workflow.includes("id-token: write"), "Publish workflow must grant id-token: write for trusted publishing/provenance.");
assert(workflow.includes("attestations: write"), "Publish workflow must grant attestations: write for artifact attestations.");
assert(workflow.includes("actions/attest@v4"), "Publish workflow must use GitHub's artifact attestation action.");
assert(workflow.includes("npm publish --access public"), "Publish workflow must use the public package publish command.");
assert(workflow.includes("tags:"), "Publish workflow must be tag-driven.");

const tag = process.env.RELEASE_TAG;
if (tag) assert(run("node", ["-e", `if (process.argv[1] !== process.argv[2]) process.exit(1)`, tag, expectedTag]) === "", "Release tag mismatch.");

console.log(`Release preflight passed for ${pkg.name}@${pkg.version} (${expectedTag}).`);
