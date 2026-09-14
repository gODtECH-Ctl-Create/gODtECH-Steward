import { Worker } from "node:worker_threads";
import { parseExternalRuleOutput, type ExternalRuleInputV1, type ExternalRuleOutputV1 } from "./external-rule-api.js";

const WASM_PAGE_BYTES = 64 * 1024;
const MIB = 1024 * 1024;
const MAX_ARTIFACT_BYTES = 100 * MIB;
const DEFAULT_MAX_INPUT_BYTES = 16 * MIB;
const DEFAULT_MAX_OUTPUT_BYTES = 8 * MIB;
const HARD_MAX_INPUT_BYTES = 64 * MIB;
const HARD_MAX_OUTPUT_BYTES = 16 * MIB;

export interface ExternalRuleRuntimeLimits {
  maxExecutionMs: number;
  maxMemoryMiB: number;
  maxFindings: number;
  maxInputBytes?: number;
  maxOutputBytes?: number;
}

export interface ExternalRuleMemoryBounds {
  minimumPages: number;
  maximumPages: number;
  minimumBytes: number;
  maximumBytes: number;
}

export interface ExternalRuleExecutionMetrics {
  durationMs: number;
  inputBytes: number;
  outputBytes: number;
  memoryInitialBytes: number;
  memoryFinalBytes: number;
  memoryDeclaredMaximumBytes: number;
}

export interface ExternalRuleExecutionResult {
  output: ExternalRuleOutputV1;
  metrics: ExternalRuleExecutionMetrics;
}

interface ResolvedRuntimeLimits {
  maxExecutionMs: number;
  maxMemoryBytes: number;
  maxFindings: number;
  maxInputBytes: number;
  maxOutputBytes: number;
}

interface WorkerSuccess {
  ok: true;
  outputJson: string;
  inputBytes: number;
  outputBytes: number;
  memoryInitialBytes: number;
  memoryFinalBytes: number;
}

interface WorkerFailure {
  ok: false;
  error: string;
}

type WorkerMessage = WorkerSuccess | WorkerFailure;

function readVarUint32(bytes: Uint8Array, start: number): { value: number; next: number } {
  let value = 0;
  let multiplier = 1;
  let offset = start;

  for (let index = 0; index < 5; index += 1) {
    if (offset >= bytes.length) throw new Error("Malformed WebAssembly binary: unexpected end of varuint32.");
    const byte = bytes[offset++];
    value += (byte & 0x7f) * multiplier;
    if ((byte & 0x80) === 0) {
      if (!Number.isSafeInteger(value) || value > 0xffffffff) throw new Error("Malformed WebAssembly binary: varuint32 overflow.");
      return { value, next: offset };
    }
    multiplier *= 128;
  }

  throw new Error("Malformed WebAssembly binary: varuint32 is too long.");
}

function assertIntegerRange(value: number, min: number, max: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`Invalid external rule runtime limit ${name}: expected an integer from ${min} to ${max}.`);
  }
}

function resolveLimits(limits: ExternalRuleRuntimeLimits): ResolvedRuntimeLimits {
  assertIntegerRange(limits.maxExecutionMs, 1, 10_000, "maxExecutionMs");
  assertIntegerRange(limits.maxMemoryMiB, 8, 256, "maxMemoryMiB");
  assertIntegerRange(limits.maxFindings, 1, 5_000, "maxFindings");

  const maxMemoryBytes = limits.maxMemoryMiB * MIB;
  const maxInputBytes = limits.maxInputBytes ?? Math.min(DEFAULT_MAX_INPUT_BYTES, maxMemoryBytes);
  const maxOutputBytes = limits.maxOutputBytes ?? Math.min(DEFAULT_MAX_OUTPUT_BYTES, maxMemoryBytes);

  assertIntegerRange(maxInputBytes, 1, HARD_MAX_INPUT_BYTES, "maxInputBytes");
  assertIntegerRange(maxOutputBytes, 1, HARD_MAX_OUTPUT_BYTES, "maxOutputBytes");

  return {
    maxExecutionMs: limits.maxExecutionMs,
    maxMemoryBytes,
    maxFindings: limits.maxFindings,
    maxInputBytes,
    maxOutputBytes
  };
}

export function inspectExternalRuleMemory(bytes: Uint8Array): ExternalRuleMemoryBounds {
  const safeBytes = Uint8Array.from(bytes);
  if (safeBytes.length < 8) throw new Error("Malformed WebAssembly binary: header is incomplete.");
  const header = [0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00];
  if (!header.every((value, index) => safeBytes[index] === value)) {
    throw new Error("Malformed WebAssembly binary: unsupported magic or version.");
  }

  let offset = 8;
  let memoryBounds: ExternalRuleMemoryBounds | undefined;

  while (offset < safeBytes.length) {
    const sectionId = safeBytes[offset++];
    const size = readVarUint32(safeBytes, offset);
    offset = size.next;
    const sectionEnd = offset + size.value;
    if (sectionEnd > safeBytes.length) throw new Error("Malformed WebAssembly binary: section exceeds artifact length.");

    if (sectionId === 5) {
      if (memoryBounds) throw new Error("External rule module contains multiple memory sections.");
      let cursor = offset;
      const count = readVarUint32(safeBytes, cursor);
      cursor = count.next;
      if (count.value !== 1) throw new Error("External rule ABI v1 requires exactly one defined linear memory.");

      const flags = readVarUint32(safeBytes, cursor);
      cursor = flags.next;
      if (flags.value !== 1) {
        throw new Error("External rule ABI v1 requires bounded 32-bit linear memory with an explicit maximum.");
      }

      const minimum = readVarUint32(safeBytes, cursor);
      cursor = minimum.next;
      const maximum = readVarUint32(safeBytes, cursor);
      cursor = maximum.next;
      if (cursor !== sectionEnd) throw new Error("Malformed WebAssembly binary: unexpected memory section payload.");
      if (minimum.value > maximum.value) throw new Error("External rule memory minimum exceeds its declared maximum.");

      memoryBounds = {
        minimumPages: minimum.value,
        maximumPages: maximum.value,
        minimumBytes: minimum.value * WASM_PAGE_BYTES,
        maximumBytes: maximum.value * WASM_PAGE_BYTES
      };
    }

    offset = sectionEnd;
  }

  if (!memoryBounds) throw new Error("External rule ABI v1 requires one defined linear memory.");
  return memoryBounds;
}

export async function executeExternalRule(
  bytes: Uint8Array,
  input: ExternalRuleInputV1,
  limits: ExternalRuleRuntimeLimits
): Promise<ExternalRuleExecutionResult> {
  const safeBytes = Uint8Array.from(bytes);
  if (safeBytes.length < 8 || safeBytes.length > MAX_ARTIFACT_BYTES) {
    throw new Error(`External rule artifact size is outside the supported range: ${safeBytes.length} bytes.`);
  }

  const resolved = resolveLimits(limits);
  const memoryBounds = inspectExternalRuleMemory(safeBytes);
  if (memoryBounds.maximumBytes > resolved.maxMemoryBytes) {
    throw new Error(
      `External rule declared memory maximum exceeds configured limit: ${memoryBounds.maximumBytes} > ${resolved.maxMemoryBytes}.`
    );
  }

  const inputJson = JSON.stringify(input);
  const inputBytes = new TextEncoder().encode(inputJson).length;
  if (inputBytes > resolved.maxInputBytes) {
    throw new Error(`External rule input exceeds configured maximum: ${inputBytes} > ${resolved.maxInputBytes}.`);
  }

  const startedAt = Date.now();
  const worker = new Worker(new URL("./external-rule-worker.js", import.meta.url), {
    workerData: {
      bytes: safeBytes,
      inputJson,
      maxMemoryBytes: resolved.maxMemoryBytes,
      maxOutputBytes: resolved.maxOutputBytes
    },
    resourceLimits: {
      maxOldGenerationSizeMb: Math.max(16, Math.min(128, limits.maxMemoryMiB)),
      maxYoungGenerationSizeMb: 16,
      stackSizeMb: 4
    }
  });

  return await new Promise<ExternalRuleExecutionResult>((resolve, reject) => {
    let settled = false;

    const finish = (callback: () => void): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void worker.terminate();
      callback();
    };

    const timer = setTimeout(() => {
      finish(() => reject(new Error(`External rule execution exceeded ${resolved.maxExecutionMs}ms.`)));
    }, resolved.maxExecutionMs);

    worker.once("message", (message: WorkerMessage) => {
      finish(() => {
        if (!message.ok) {
          reject(new Error(message.error));
          return;
        }

        let raw: unknown;
        try {
          raw = JSON.parse(message.outputJson) as unknown;
        } catch {
          reject(new Error("External rule output is not valid JSON."));
          return;
        }

        try {
          const output = parseExternalRuleOutput(raw, resolved.maxFindings);
          resolve({
            output,
            metrics: {
              durationMs: Date.now() - startedAt,
              inputBytes: message.inputBytes,
              outputBytes: message.outputBytes,
              memoryInitialBytes: message.memoryInitialBytes,
              memoryFinalBytes: message.memoryFinalBytes,
              memoryDeclaredMaximumBytes: memoryBounds.maximumBytes
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    });

    worker.once("error", (error) => {
      finish(() => reject(error));
    });

    worker.once("exit", (code) => {
      if (!settled) {
        finish(() => reject(new Error(`External rule worker exited before producing a result (code ${code}).`)));
      }
    });
  });
}
