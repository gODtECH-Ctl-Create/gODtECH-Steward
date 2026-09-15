import { strict as assert } from "node:assert";
import {
  STEWARD_EXTERNAL_RULE_ABI_VERSION,
  STEWARD_EXTERNAL_RULE_INPUT_KIND,
  STEWARD_EXTERNAL_RULE_OUTPUT_KIND,
  type ExternalRuleInputV1
} from "../src/core/external-rule-api.js";
import { executeExternalRule, inspectExternalRuleMemory } from "../src/core/external-rule-runtime.js";

const encoder = new TextEncoder();

function u32(value: number): number[] {
  const bytes: number[] = [];
  let current = value >>> 0;
  do {
    let byte = current & 0x7f;
    current >>>= 7;
    if (current !== 0) byte |= 0x80;
    bytes.push(byte);
  } while (current !== 0);
  return bytes;
}

function s64(value: bigint): number[] {
  const bytes: number[] = [];
  let current = value;
  let more = true;
  while (more) {
    let byte = Number(current & 0x7fn);
    current >>= 7n;
    const signSet = (byte & 0x40) !== 0;
    if ((current === 0n && !signSet) || (current === -1n && signSet)) more = false;
    else byte |= 0x80;
    bytes.push(byte);
  }
  return bytes;
}

function text(value: string): number[] {
  const bytes = [...encoder.encode(value)];
  return [...u32(bytes.length), ...bytes];
}

function section(id: number, payload: number[]): number[] {
  return [id, ...u32(payload.length), ...payload];
}

function body(instructions: number[]): number[] {
  const payload = [0x00, ...instructions, 0x0b];
  return [...u32(payload.length), ...payload];
}

interface ModuleOptions {
  boundedMemory?: boolean;
  maximumPages?: number;
  mode?: "constant" | "infinite" | "grow";
  growPages?: number;
  withImport?: boolean;
  returnedPointer?: number;
}

function makeModule(outputJson: string, options: ModuleOptions = {}): Uint8Array {
  const boundedMemory = options.boundedMemory ?? true;
  const maximumPages = options.maximumPages ?? 2;
  const mode = options.mode ?? "constant";
  const withImport = options.withImport ?? false;
  const output = [...encoder.encode(outputJson)];
  const dataPointer = 4096;
  const returnedPointer = options.returnedPointer ?? dataPointer;
  const packed = (BigInt(returnedPointer) << 32n) | BigInt(output.length);

  const types = section(1, [
    ...u32(2),
    0x60, ...u32(1), 0x7f, ...u32(1), 0x7f,
    0x60, ...u32(2), 0x7f, 0x7f, ...u32(1), 0x7e
  ]);

  const imports = withImport
    ? section(2, [...u32(1), ...text("m"), ...text("f"), 0x00, ...u32(0)])
    : [];

  const functions = section(3, [...u32(2), ...u32(0), ...u32(1)]);
  const memoryPayload = boundedMemory
    ? [...u32(1), ...u32(1), ...u32(1), ...u32(maximumPages)]
    : [...u32(1), ...u32(0), ...u32(1)];
  const memory = section(5, memoryPayload);

  const functionOffset = withImport ? 1 : 0;
  const exports = section(7, [
    ...u32(3),
    ...text("memory"), 0x02, ...u32(0),
    ...text("steward_alloc"), 0x00, ...u32(functionOffset),
    ...text("steward_run"), 0x00, ...u32(functionOffset + 1)
  ]);

  const allocInstructions = [0x41, 0x00];
  let runInstructions: number[];
  if (mode === "infinite") {
    runInstructions = [0x03, 0x40, 0x0c, 0x00, 0x0b, 0x42, ...s64(packed)];
  } else if (mode === "grow") {
    runInstructions = [0x41, ...s64(BigInt(options.growPages ?? 1)), 0x40, 0x00, 0x1a, 0x42, ...s64(packed)];
  } else {
    runInstructions = [0x42, ...s64(packed)];
  }

  const code = section(10, [...u32(2), ...body(allocInstructions), ...body(runInstructions)]);
  const data = section(11, [
    ...u32(1),
    0x00,
    0x41, ...s64(BigInt(dataPointer)), 0x0b,
    ...u32(output.length),
    ...output
  ]);

  return Uint8Array.from([
    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
    ...types,
    ...imports,
    ...functions,
    ...memory,
    ...exports,
    ...code,
    ...data
  ]);
}

const input: ExternalRuleInputV1 = {
  abiVersion: STEWARD_EXTERNAL_RULE_ABI_VERSION,
  kind: STEWARD_EXTERNAL_RULE_INPUT_KIND,
  repository: { files: [] }
};

const emptyOutput = JSON.stringify({
  abiVersion: STEWARD_EXTERNAL_RULE_ABI_VERSION,
  kind: STEWARD_EXTERNAL_RULE_OUTPUT_KIND,
  findings: []
});

const baseLimits = {
  maxExecutionMs: 2000,
  maxMemoryMiB: 8,
  maxFindings: 10,
  maxInputBytes: 1024 * 1024,
  maxOutputBytes: 1024 * 1024
};

export async function run(): Promise<void> {
  const safeModule = makeModule(emptyOutput);
  const bounds = inspectExternalRuleMemory(safeModule);
  assert.equal(bounds.minimumPages, 1);
  assert.equal(bounds.maximumPages, 2);
  assert.equal(bounds.maximumBytes, 2 * 64 * 1024);

  const safe = await executeExternalRule(safeModule, input, baseLimits);
  assert.equal(safe.output.findings.length, 0);
  assert.equal(safe.metrics.memoryDeclaredMaximumBytes, 2 * 64 * 1024);
  assert.equal(safe.metrics.memoryInitialBytes, 64 * 1024);
  assert.equal(safe.metrics.memoryFinalBytes, 64 * 1024);
  assert.equal(safe.metrics.outputBytes, encoder.encode(emptyOutput).length);

  await assert.rejects(
    () => executeExternalRule(makeModule(emptyOutput, { boundedMemory: false }), input, baseLimits),
    /explicit maximum/
  );

  await assert.rejects(
    () => executeExternalRule(makeModule(emptyOutput, { maximumPages: 200 }), input, baseLimits),
    /declared memory maximum exceeds configured limit/
  );

  await assert.rejects(
    () => executeExternalRule(makeModule(emptyOutput, { withImport: true }), input, baseLimits),
    /imports are not allowed/
  );

  const grown = await executeExternalRule(makeModule(emptyOutput, { mode: "grow", growPages: 1 }), input, baseLimits);
  assert.equal(grown.metrics.memoryInitialBytes, 64 * 1024);
  assert.equal(grown.metrics.memoryFinalBytes, 2 * 64 * 1024);

  const deniedGrowth = await executeExternalRule(makeModule(emptyOutput, { mode: "grow", growPages: 100 }), input, baseLimits);
  assert.equal(deniedGrowth.metrics.memoryInitialBytes, 64 * 1024);
  assert.equal(deniedGrowth.metrics.memoryFinalBytes, 64 * 1024);

  await assert.rejects(
    () => executeExternalRule(makeModule(emptyOutput, { returnedPointer: 65530 }), input, baseLimits),
    /Output range is outside WebAssembly linear memory/
  );

  await assert.rejects(
    () => executeExternalRule(makeModule(emptyOutput, { mode: "infinite" }), input, { ...baseLimits, maxExecutionMs: 500 }),
    /execution exceeded 500ms/
  );

  await assert.rejects(
    () => executeExternalRule(safeModule, input, { ...baseLimits, maxOutputBytes: 32 }),
    /output exceeds configured maximum/
  );

  await assert.rejects(
    () => executeExternalRule(makeModule("not-json"), input, baseLimits),
    /output is not valid JSON/
  );

  const tooManyFindings = JSON.stringify({
    abiVersion: STEWARD_EXTERNAL_RULE_ABI_VERSION,
    kind: STEWARD_EXTERNAL_RULE_OUTPUT_KIND,
    findings: [
      { rule: "example.one", category: "repository", severity: "low", message: "one", confidence: "high" },
      { rule: "example.two", category: "repository", severity: "low", message: "two", confidence: "high" }
    ]
  });
  await assert.rejects(
    () => executeExternalRule(makeModule(tooManyFindings), input, { ...baseLimits, maxFindings: 1 }),
    /configured maximum of 1/
  );

  await assert.rejects(
    () => executeExternalRule(
      safeModule,
      { ...input, repository: { files: [{ path: "large.txt", sizeBytes: 100, isText: true, tracked: false, content: "x".repeat(200) }] } },
      { ...baseLimits, maxInputBytes: 64 }
    ),
    /input exceeds configured maximum/
  );
}

await run();
