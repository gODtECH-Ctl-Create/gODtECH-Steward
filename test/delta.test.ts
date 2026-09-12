import assert from "node:assert/strict";
import test from "node:test";
import { calculateScanDelta, findingFingerprint } from "../src/core/delta.js";
import { toJson } from "../src/core/report.js";
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

function result(healthScore: number, findings: Finding[]): ScanResult {
  return {
    version: 1,
    root: "/tmp/example",
    scannedFiles: 3,
    textFiles: 3,
    findings,
    healthScore,
    durationMs: 10,
    git: { isRepository: false, trackedFiles: new Set() },
    categoryCounts: { code: findings.filter((item) => item.category === "code").length },
    ruleCounts: { "todo-fixme": findings.filter((item) => item.rule === "todo-fixme").length },
    rulePacks: [{ id: "core", version: 1 }, { id: "security", version: 1 }],
  };
}

test("finding fingerprints remain stable when only the line number moves", () => {
  const before = finding({ line: 4 });
  const after = finding({ line: 18 });
  assert.equal(findingFingerprint(before), findingFingerprint(after));
});

test("scan delta reports added and resolved findings deterministically", () => {
  const resolved = finding({ id: "security.possible-secret.config.ts", rule: "possible-secret", category: "security", severity: "high", message: "Possible credential pattern detected.", path: "config.ts", line: 2 });
  const added = finding({ id: "repository.large-file.assets.bin", rule: "large-file", category: "repository", severity: "medium", message: "Large file detected (5,242,880 bytes).", path: "assets.bin" });
  const delta = calculateScanDelta(result(72, [resolved]), result(88, [added]));

  assert.deepEqual(delta.health, { previous: 72, current: 88, delta: 16, direction: "improved" });
  assert.equal(delta.findings.previous, 1);
  assert.equal(delta.findings.current, 1);
  assert.equal(delta.findings.added, 1);
  assert.equal(delta.findings.resolved, 1);
  assert.equal(delta.findings.unchanged, 0);
  assert.equal(delta.findings.addedItems[0]?.id, added.id);
  assert.equal(delta.findings.resolvedItems[0]?.id, resolved.id);
  assert.equal(delta.severityCounts.high.delta, -1);
  assert.equal(delta.severityCounts.medium.delta, 1);
  assert.equal(delta.categoryCounts.security?.delta, -1);
  assert.equal(delta.categoryCounts.repository?.delta, 1);
});

test("JSON reports include fingerprints and optional deltas", () => {
  const current = result(88, [finding({ id: "repository.large-file.assets.bin", rule: "large-file", category: "repository", severity: "medium", message: "Large file detected.", path: "assets.bin" })]);
  const previous = result(72, [finding({ id: "security.possible-secret.config.ts", rule: "possible-secret", category: "security", severity: "high", message: "Possible credential pattern detected.", path: "config.ts" })]);
  const delta = calculateScanDelta(previous, current);
  const payload = JSON.parse(toJson(current, delta)) as { findings: Finding[]; delta: typeof delta };

  assert.match(payload.findings[0]?.fingerprint ?? "", /^[a-f0-9]{64}$/);
  assert.equal(payload.delta.health.direction, "improved");
  assert.equal(payload.delta.findings.added, 1);
  assert.equal(payload.delta.findings.resolved, 1);
});
