import { strict as assert } from "node:assert";
import {
  createExternalRuleInput,
  inspectExternalRuleModule,
  parseExternalRuleOutput,
  STEWARD_EXTERNAL_RULE_ABI_VERSION,
  STEWARD_EXTERNAL_RULE_INPUT_KIND,
  STEWARD_EXTERNAL_RULE_OUTPUT_KIND
} from "../src/core/external-rule-api.js";
import type { FileEntry, GitFacts } from "../src/core/types.js";

const CONTRACT_WASM = Uint8Array.from([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
  0x01, 0x0c, 0x02, 0x60, 0x01, 0x7f, 0x01, 0x7f, 0x60, 0x02, 0x7f, 0x7f, 0x01, 0x7e,
  0x03, 0x03, 0x02, 0x00, 0x01,
  0x05, 0x03, 0x01, 0x00, 0x01,
  0x07, 0x28, 0x03,
  0x06, 0x6d, 0x65, 0x6d, 0x6f, 0x72, 0x79, 0x02, 0x00,
  0x0d, 0x73, 0x74, 0x65, 0x77, 0x61, 0x72, 0x64, 0x5f, 0x61, 0x6c, 0x6c, 0x6f, 0x63, 0x00, 0x00,
  0x0b, 0x73, 0x74, 0x65, 0x77, 0x61, 0x72, 0x64, 0x5f, 0x72, 0x75, 0x6e, 0x00, 0x01,
  0x0a, 0x0b, 0x02, 0x04, 0x00, 0x20, 0x00, 0x0b, 0x04, 0x00, 0x42, 0x00, 0x0b
]);

const IMPORTING_WASM = Uint8Array.from([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
  0x01, 0x04, 0x01, 0x60, 0x00, 0x00,
  0x02, 0x07, 0x01, 0x01, 0x6d, 0x01, 0x66, 0x00, 0x00
]);

export async function run(): Promise<void> {
  const files: FileEntry[] = [
    { absPath: "/private/repo/z.txt", relPath: "z.txt", size: 4, isText: true, content: "zeta" },
    { absPath: "/private/repo/src/a.ts", relPath: "src/a.ts", size: 5, isText: true, content: "alpha" },
    { absPath: "/private/repo/logo.png", relPath: "logo.png", size: 20, isText: false }
  ];
  const git: GitFacts = {
    isRepository: true,
    branch: "feature/test",
    commit: "abc123",
    dirty: false,
    trackedFiles: new Set(["src/a.ts", "logo.png"])
  };

  const input = createExternalRuleInput({ files, trackedFiles: git.trackedFiles, git });
  assert.equal(input.abiVersion, STEWARD_EXTERNAL_RULE_ABI_VERSION);
  assert.equal(input.kind, STEWARD_EXTERNAL_RULE_INPUT_KIND);
  assert.deepEqual(input.repository.files.map((file) => file.path), ["logo.png", "src/a.ts", "z.txt"]);
  assert.equal(input.repository.files[0].content, undefined);
  assert.equal(input.repository.files[1].tracked, true);
  assert.equal(input.repository.files[2].tracked, false);
  assert.equal(JSON.stringify(input).includes("/private/repo"), false);

  const output = parseExternalRuleOutput({
    abiVersion: 1,
    kind: STEWARD_EXTERNAL_RULE_OUTPUT_KIND,
    findings: [
      {
        rule: "example.readme",
        category: "documentation",
        severity: "medium",
        message: "README guidance is stale.",
        path: "README.md",
        line: 3,
        confidence: "high",
        remediation: "Refresh the documented command."
      }
    ]
  }, 10);
  assert.equal(output.findings.length, 1);
  assert.equal(output.findings[0].rule, "example.readme");

  assert.throws(
    () => parseExternalRuleOutput({ abiVersion: 2, kind: STEWARD_EXTERNAL_RULE_OUTPUT_KIND, findings: [] }, 10),
    /unsupported abiVersion/
  );
  assert.throws(
    () => parseExternalRuleOutput({ abiVersion: 1, kind: STEWARD_EXTERNAL_RULE_OUTPUT_KIND, findings: [{
      rule: "example.path",
      category: "repository",
      severity: "low",
      message: "bad path",
      path: "../secret",
      confidence: "high"
    }] }, 10),
    /safe repository-relative path/
  );
  assert.throws(
    () => parseExternalRuleOutput({ abiVersion: 1, kind: STEWARD_EXTERNAL_RULE_OUTPUT_KIND, findings: [], extra: true }, 10),
    /unsupported field/
  );
  assert.throws(
    () => parseExternalRuleOutput({ abiVersion: 1, kind: STEWARD_EXTERNAL_RULE_OUTPUT_KIND, findings: [
      { rule: "example.one", category: "repository", severity: "low", message: "one", confidence: "high" },
      { rule: "example.two", category: "repository", severity: "low", message: "two", confidence: "high" }
    ] }, 1),
    /configured maximum/
  );

  const contract = await inspectExternalRuleModule(CONTRACT_WASM);
  assert.equal(contract.validWasm, true);
  assert.equal(contract.structurallyEligible, true);
  assert.deepEqual(contract.imports, []);
  assert.deepEqual(contract.missingExports, []);

  const importing = await inspectExternalRuleModule(IMPORTING_WASM);
  assert.equal(importing.validWasm, true);
  assert.equal(importing.structurallyEligible, false);
  assert.deepEqual(importing.imports, ["m.f"]);

  const invalid = await inspectExternalRuleModule(Uint8Array.from([0x00, 0x01]));
  assert.equal(invalid.validWasm, false);
  assert.equal(invalid.structurallyEligible, false);
}

await run();
