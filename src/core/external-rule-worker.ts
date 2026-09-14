import { parentPort, workerData } from "node:worker_threads";
import { STEWARD_EXTERNAL_RULE_EXPORTS } from "./external-rule-api.js";

interface ExternalRuleWorkerRequest {
  bytes: Uint8Array;
  inputJson: string;
  maxMemoryBytes: number;
  maxOutputBytes: number;
}

interface ExternalRuleWorkerSuccess {
  ok: true;
  outputJson: string;
  inputBytes: number;
  outputBytes: number;
  memoryInitialBytes: number;
  memoryFinalBytes: number;
}

interface ExternalRuleWorkerFailure {
  ok: false;
  error: string;
}

type ExternalRuleWorkerMessage = ExternalRuleWorkerSuccess | ExternalRuleWorkerFailure;

function post(message: ExternalRuleWorkerMessage): void {
  parentPort?.postMessage(message);
}

function assertRange(pointer: number, length: number, totalBytes: number, label: string): void {
  if (!Number.isSafeInteger(pointer) || pointer < 0) throw new Error(`${label} pointer is invalid.`);
  if (!Number.isSafeInteger(length) || length < 0) throw new Error(`${label} length is invalid.`);
  if (pointer > totalBytes || length > totalBytes - pointer) throw new Error(`${label} range is outside WebAssembly linear memory.`);
}

async function run(): Promise<void> {
  const request = workerData as ExternalRuleWorkerRequest;
  const bytes = Uint8Array.from(request.bytes);
  const inputBytes = new TextEncoder().encode(request.inputJson);

  const module = await WebAssembly.compile(bytes);
  const imports = WebAssembly.Module.imports(module);
  if (imports.length > 0) {
    throw new Error(`External rule module imports are not allowed: ${imports.map((entry) => `${entry.module}.${entry.name}`).join(", ")}.`);
  }

  const instance = await WebAssembly.instantiate(module, {});
  const memory = instance.exports[STEWARD_EXTERNAL_RULE_EXPORTS.memory];
  const allocate = instance.exports[STEWARD_EXTERNAL_RULE_EXPORTS.allocate];
  const execute = instance.exports[STEWARD_EXTERNAL_RULE_EXPORTS.run];

  if (!(memory instanceof WebAssembly.Memory)) throw new Error("External rule module must export WebAssembly memory.");
  if (typeof allocate !== "function") throw new Error("External rule module must export steward_alloc as a function.");
  if (typeof execute !== "function") throw new Error("External rule module must export steward_run as a function.");

  const memoryInitialBytes = memory.buffer.byteLength;
  if (memoryInitialBytes > request.maxMemoryBytes) {
    throw new Error(`External rule memory exceeds configured maximum before execution: ${memoryInitialBytes} > ${request.maxMemoryBytes}.`);
  }

  const inputPointer = Number(allocate(inputBytes.length));
  const memoryAfterAllocation = memory.buffer.byteLength;
  if (memoryAfterAllocation > request.maxMemoryBytes) {
    throw new Error(`External rule memory exceeds configured maximum after allocation: ${memoryAfterAllocation} > ${request.maxMemoryBytes}.`);
  }
  assertRange(inputPointer, inputBytes.length, memoryAfterAllocation, "Input");
  new Uint8Array(memory.buffer).set(inputBytes, inputPointer);

  const packed = execute(inputPointer, inputBytes.length);
  if (typeof packed !== "bigint") throw new Error("steward_run must return an i64 packed output pointer/length value.");

  const unsigned = BigInt.asUintN(64, packed);
  const outputPointer = Number(unsigned >> 32n);
  const outputBytes = Number(unsigned & 0xffffffffn);
  if (outputBytes < 1) throw new Error("External rule returned an empty output payload.");
  if (outputBytes > request.maxOutputBytes) {
    throw new Error(`External rule output exceeds configured maximum: ${outputBytes} > ${request.maxOutputBytes}.`);
  }

  const memoryFinalBytes = memory.buffer.byteLength;
  if (memoryFinalBytes > request.maxMemoryBytes) {
    throw new Error(`External rule memory exceeds configured maximum after execution: ${memoryFinalBytes} > ${request.maxMemoryBytes}.`);
  }
  assertRange(outputPointer, outputBytes, memoryFinalBytes, "Output");

  const outputCopy = Uint8Array.from(new Uint8Array(memory.buffer, outputPointer, outputBytes));
  const outputJson = new TextDecoder("utf-8", { fatal: true }).decode(outputCopy);
  post({
    ok: true,
    outputJson,
    inputBytes: inputBytes.length,
    outputBytes,
    memoryInitialBytes,
    memoryFinalBytes
  });
}

void run().catch((error: unknown) => {
  post({ ok: false, error: error instanceof Error ? error.message : String(error) });
});
