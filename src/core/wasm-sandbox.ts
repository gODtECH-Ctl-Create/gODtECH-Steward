import { Worker } from "node:worker_threads";

export interface SandboxLimits {
  maxExecutionMs: number;
  maxMemoryMiB: number;
}

export interface SandboxProbeResult {
  validWasm: boolean;
  imports: string[];
  eligible: boolean;
  executed: boolean;
}

export async function probeWasmSandbox(bytes: Uint8Array, limits: SandboxLimits): Promise<SandboxProbeResult> {
  const safeBytes = Uint8Array.from(bytes);
  if (!WebAssembly.validate(safeBytes)) {
    return { validWasm: false, imports: [], eligible: false, executed: false };
  }

  const module = await WebAssembly.compile(safeBytes);
  const imports = WebAssembly.Module.imports(module).map((entry) => `${entry.module}.${entry.name}`);
  if (imports.length > 0) {
    return { validWasm: true, imports, eligible: false, executed: false };
  }

  const timeoutMs = Math.max(1, Math.min(limits.maxExecutionMs, 10_000));

  await new Promise<void>((resolve, reject) => {
    const worker = new Worker(
      `const { parentPort, workerData } = require("node:worker_threads");
(async () => {
  try {
    const module = await WebAssembly.compile(workerData);
    await WebAssembly.instantiate(module, {});
    parentPort.postMessage({ ok: true });
  } catch (error) {
    parentPort.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
})();`,
      { eval: true, workerData: safeBytes }
    );

    const timer = setTimeout(() => {
      void worker.terminate();
      reject(new Error(`WASM sandbox execution exceeded ${timeoutMs}ms.`));
    }, timeoutMs);

    worker.once("message", (message: { ok: boolean; error?: string }) => {
      clearTimeout(timer);
      void worker.terminate();
      if (message.ok) resolve();
      else reject(new Error(message.error ?? "WASM sandbox probe failed."));
    });
    worker.once("error", (error) => {
      clearTimeout(timer);
      void worker.terminate();
      reject(error);
    });
  });

  return { validWasm: true, imports: [], eligible: true, executed: true };
}
