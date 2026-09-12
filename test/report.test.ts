import test from "node:test";
import assert from "node:assert/strict";
import { toJson, STEWARD_RESULT_SCHEMA_VERSION } from "../src/core/report.js";
import type { ScanResult } from "../src/core/types.js";

function sampleResult(): ScanResult {
  return {
    version: 1,
    root: "/workspace/example",
    scannedFiles: 2,
    textFiles: 2,
    findings: [],
    healthScore: 100,
    durationMs: 1,
    git: {
      isRepository: true,
      root: "/workspace/example",
      branch: "main",
      commit: "abc123",
      dirty: false,
      trackedFiles: new Set(["README.md"]),
    },
    categoryCounts: {},
    ruleCounts: {},
  };
}

test("JSON output exposes the versioned integration contract", () => {
  const result = sampleResult();
  const parsed = JSON.parse(toJson(result)) as Record<string, unknown>;

  assert.equal(STEWARD_RESULT_SCHEMA_VERSION, 1);
  assert.equal(parsed.schemaVersion, 1);
  assert.equal(parsed.tool, "gODtECH Steward");
  assert.equal(parsed.version, 1);
  assert.equal("trackedFiles" in (parsed.git as Record<string, unknown>), false);
});
