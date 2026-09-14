import type { Category, ScanContext, Severity } from "./types.js";

export const STEWARD_EXTERNAL_RULE_ABI_VERSION = 1 as const;
export const STEWARD_EXTERNAL_RULE_INPUT_KIND = "steward-rule-input" as const;
export const STEWARD_EXTERNAL_RULE_OUTPUT_KIND = "steward-rule-output" as const;

export const STEWARD_EXTERNAL_RULE_EXPORTS = {
  memory: "memory",
  allocate: "steward_alloc",
  run: "steward_run"
} as const;

export interface ExternalRuleFileV1 {
  path: string;
  sizeBytes: number;
  isText: boolean;
  tracked: boolean;
  content?: string;
}

export interface ExternalRuleInputV1 {
  abiVersion: typeof STEWARD_EXTERNAL_RULE_ABI_VERSION;
  kind: typeof STEWARD_EXTERNAL_RULE_INPUT_KIND;
  repository: {
    branch?: string;
    commit?: string;
    dirty?: boolean;
    files: ExternalRuleFileV1[];
  };
}

export interface ExternalRuleFindingV1 {
  rule: string;
  category: Category;
  severity: Severity;
  message: string;
  path?: string;
  line?: number;
  confidence: "high" | "medium" | "low";
  remediation?: string;
}

export interface ExternalRuleOutputV1 {
  abiVersion: typeof STEWARD_EXTERNAL_RULE_ABI_VERSION;
  kind: typeof STEWARD_EXTERNAL_RULE_OUTPUT_KIND;
  findings: ExternalRuleFindingV1[];
}

export interface ExternalRuleModuleInspection {
  validWasm: boolean;
  imports: string[];
  exports: string[];
  missingExports: string[];
  structurallyEligible: boolean;
}

const SEVERITIES: readonly Severity[] = ["critical", "high", "medium", "low", "info"];
const CATEGORIES: readonly Category[] = ["repository", "security", "documentation", "code", "dependencies", "git", "configuration"];
const CONFIDENCE = ["high", "medium", "low"] as const;
const OUTPUT_KEYS = new Set(["abiVersion", "kind", "findings"]);
const FINDING_KEYS = new Set(["rule", "category", "severity", "message", "path", "line", "confidence", "remediation"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertContract(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invalid external rule result: ${message}`);
}

function assertOnlyKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>, context: string): void {
  const unexpected = Object.keys(value).filter((key) => !allowed.has(key));
  assertContract(unexpected.length === 0, `${context} contains unsupported field(s): ${unexpected.join(", ")}`);
}

function isSafeRelativePath(value: string): boolean {
  if (!value || value.length > 4096 || value.includes("\\") || value.includes("\0") || value.startsWith("/")) return false;
  const segments = value.split("/");
  return segments.every((segment) => segment.length > 0 && segment !== "." && segment !== "..");
}

function isSeverity(value: unknown): value is Severity {
  return typeof value === "string" && (SEVERITIES as readonly string[]).includes(value);
}

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

function isConfidence(value: unknown): value is ExternalRuleFindingV1["confidence"] {
  return typeof value === "string" && (CONFIDENCE as readonly string[]).includes(value);
}

export function createExternalRuleInput(
  context: Pick<ScanContext, "files" | "trackedFiles" | "git">
): ExternalRuleInputV1 {
  const files = [...context.files]
    .sort((left, right) => left.relPath.localeCompare(right.relPath))
    .map((file): ExternalRuleFileV1 => ({
      path: file.relPath.replaceAll("\\", "/"),
      sizeBytes: file.size,
      isText: file.isText,
      tracked: context.trackedFiles.has(file.relPath),
      ...(file.isText && typeof file.content === "string" ? { content: file.content } : {})
    }));

  return {
    abiVersion: STEWARD_EXTERNAL_RULE_ABI_VERSION,
    kind: STEWARD_EXTERNAL_RULE_INPUT_KIND,
    repository: {
      ...(context.git.branch ? { branch: context.git.branch } : {}),
      ...(context.git.commit ? { commit: context.git.commit } : {}),
      ...(typeof context.git.dirty === "boolean" ? { dirty: context.git.dirty } : {}),
      files
    }
  };
}

export function parseExternalRuleOutput(raw: unknown, maxFindings: number): ExternalRuleOutputV1 {
  assertContract(Number.isSafeInteger(maxFindings) && maxFindings >= 1 && maxFindings <= 5_000, "invalid maxFindings limit");
  assertContract(isRecord(raw), "expected a JSON object");
  assertOnlyKeys(raw, OUTPUT_KEYS, "output");
  assertContract(raw.abiVersion === STEWARD_EXTERNAL_RULE_ABI_VERSION, "unsupported abiVersion");
  assertContract(raw.kind === STEWARD_EXTERNAL_RULE_OUTPUT_KIND, `kind must be ${STEWARD_EXTERNAL_RULE_OUTPUT_KIND}`);
  assertContract(Array.isArray(raw.findings), "findings must be an array");
  assertContract(raw.findings.length <= maxFindings, `findings exceeds configured maximum of ${maxFindings}`);

  const findings = raw.findings.map((candidate, index): ExternalRuleFindingV1 => {
    assertContract(isRecord(candidate), `findings[${index}] must be an object`);
    assertOnlyKeys(candidate, FINDING_KEYS, `findings[${index}]`);
    assertContract(typeof candidate.rule === "string" && /^[a-z0-9][a-z0-9._-]{1,127}$/.test(candidate.rule), `findings[${index}].rule is invalid`);
    assertContract(isCategory(candidate.category), `findings[${index}].category is invalid`);
    assertContract(isSeverity(candidate.severity), `findings[${index}].severity is invalid`);
    assertContract(typeof candidate.message === "string" && candidate.message.length >= 1 && candidate.message.length <= 4096, `findings[${index}].message is invalid`);
    assertContract(isConfidence(candidate.confidence), `findings[${index}].confidence is invalid`);

    if (candidate.path !== undefined) {
      assertContract(typeof candidate.path === "string" && isSafeRelativePath(candidate.path), `findings[${index}].path must be a safe repository-relative path`);
    }
    if (candidate.line !== undefined) {
      assertContract(Number.isSafeInteger(candidate.line) && (candidate.line as number) >= 1 && (candidate.line as number) <= 10_000_000, `findings[${index}].line is invalid`);
    }
    if (candidate.remediation !== undefined) {
      assertContract(typeof candidate.remediation === "string" && candidate.remediation.length <= 4096, `findings[${index}].remediation is invalid`);
    }

    return candidate as unknown as ExternalRuleFindingV1;
  });

  return {
    abiVersion: STEWARD_EXTERNAL_RULE_ABI_VERSION,
    kind: STEWARD_EXTERNAL_RULE_OUTPUT_KIND,
    findings
  };
}

export async function inspectExternalRuleModule(bytes: Uint8Array): Promise<ExternalRuleModuleInspection> {
  const safeBytes = Uint8Array.from(bytes);
  if (!WebAssembly.validate(safeBytes)) {
    return { validWasm: false, imports: [], exports: [], missingExports: Object.values(STEWARD_EXTERNAL_RULE_EXPORTS), structurallyEligible: false };
  }

  const module = await WebAssembly.compile(safeBytes);
  const imports = WebAssembly.Module.imports(module).map((entry) => `${entry.module}.${entry.name}`);
  const exports = WebAssembly.Module.exports(module).map((entry) => entry.name);
  const missingExports = Object.values(STEWARD_EXTERNAL_RULE_EXPORTS).filter((name) => !exports.includes(name));

  return {
    validWasm: true,
    imports,
    exports,
    missingExports,
    structurallyEligible: imports.length === 0 && missingExports.length === 0
  };
}
