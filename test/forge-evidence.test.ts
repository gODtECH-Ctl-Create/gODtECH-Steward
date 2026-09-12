import assert from "node:assert/strict";
import test from "node:test";
import { toForgeEvidence } from "../src/core/forge-evidence.js";
import { findingFingerprint } from "../src/core/delta.js";
import type { Finding, ScanResult } from "../src/core/types.js";

function finding(overrides: Partial<Finding> = {}): Finding {
  const item: Finding = {
    id: "maintenance.todo-markers.src/app.ts",
    rule: "todo-fixme",
    category: "code",
    severity: "low",
    message: "1 TODO/FIXME maintenance marker(s) found.",
    path: "src/app.ts",
    line: 4,
    fixable: false,
    confidence: "high",
    ...overrides,
  };
  return { ...item, fingerprint: findingFingerprint(item) };
}

function result(findings: Finding[]): ScanResult {
  return {
    version: 1,
    root: "/workspace/example",
    scannedFiles: 4,
    textFiles: 4,
    findings,
    healthScore: findings.some((item) => item.severity === "critical") ? 40 : 94,
    durationMs: 12,
    git: {
      isRepository: true,
      branch: "main",
      commit: "0123456789abcdef0123456789abcdef01234567",
      dirty: false,
      trackedFiles: new Set(["README.md", "src/app.ts"]),
    },
    categoryCounts: { code: findings.filter((item) => item.category === "code").length },
    ruleCounts: { "todo-fixme": findings.filter((item) => item.rule === "todo-fixme").length },
    rulePacks: [{ id: "core", version: 2 }, { id: "security", version: 1 }],
  };
}

test("Forge evidence contains only safe observed finding fields", () => {
  const secret = finding({
    id: "security.possible-secret.env",
    rule: "possible-secret",
    category: "security",
    severity: "high",
    message: "Potential credential detected.",
    path: ".env.example",
    details: "SECRET_VALUE_SHOULD_NOT_LEAK",
  });
  const evidence = toForgeEvidence(result([secret]), "critical", undefined, "2026-09-12T12:00:00.000Z");
  assert.equal(evidence.schemaVersion, 1);
  assert.equal(evidence.evidenceType, "repository-health");
  assert.equal(evidence.producer.name, "gODtECH Steward");
  assert.equal(evidence.continuousIntegration.outcome, "failed");
  assert.deepEqual(evidence.observation.findings[0], {
    id: secret.id,
    rule: secret.rule,
    category: secret.category,
    severity: secret.severity,
    path: secret.path,
    line: secret.line,
    fingerprint: secret.fingerprint,
  });
  assert.equal(JSON.stringify(evidence).includes("SECRET_VALUE_SHOULD_NOT_LEAK"), false);
});

test("Forge evidence records a passing continuous integration observation", () => {
  const evidence = toForgeEvidence(result([]), "critical", undefined, "2026-09-12T12:00:00.000Z");
  assert.equal(evidence.continuousIntegration.outcome, "passed");
  assert.equal(evidence.observation.findingCount, 0);
  assert.equal(evidence.observation.healthScore, 94);
});
