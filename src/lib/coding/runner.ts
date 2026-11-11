"use client";
/** Main-thread client for the Pyodide worker (public/coding/py-worker.mjs), with a hard timeout per run. */

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}
export interface RunReport {
  ok: boolean;
  stdout: string;
  error: string | null;
  tests: TestResult[];
  result: { columns: string[]; rows: unknown[][]; total: number } | null;
}
export interface RunSpec {
  language: "python" | "sql";
  setup: string;
  code: string;
  tests: { name: string; code: string }[];
  solution: string;
  compare: string;
}

const RUN_TIMEOUT_MS = 20_000;
let worker: Worker | null = null;
let seq = 0;

function getWorker() {
  // A static ES-module worker (public/coding/py-worker.mjs): Pyodide ≥ 314 only runs in module workers,
  // and bundling the worker would let the bundler rewrite how it's loaded.
  worker ??= new Worker("/coding/py-worker.mjs", { type: "module" });
  return worker;
}

export function resetRunner() {
  worker?.terminate();
  worker = null;
}

export function runExercise(spec: RunSpec, files: { name: string; url: string }[], onStatus: (text: string) => void): Promise<RunReport> {
  const w = getWorker();
  const id = ++seq;
  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const done = () => {
      if (timer) clearTimeout(timer);
      w.removeEventListener("message", onMessage);
    };
    const onMessage = (e: MessageEvent) => {
      if (e.data.id !== id) return;
      if (e.data.type === "status") {
        onStatus(e.data.text);
        // Only time the actual run — booting Python can take a while on slow connections.
        if (e.data.text === "Running…" && !timer) {
          timer = setTimeout(() => {
            done();
            resetRunner();
            reject(new Error(`Your code ran for more than ${RUN_TIMEOUT_MS / 1000} s and was stopped. Look for an infinite loop.`));
          }, RUN_TIMEOUT_MS);
        }
      } else if (e.data.type === "result") {
        done();
        resolve(e.data.report);
      } else if (e.data.type === "error") {
        done();
        reject(new Error(e.data.message));
      }
    };
    w.addEventListener("message", onMessage);
    w.postMessage({ id, spec, files, harnessUrl: new URL("/coding/harness.py", window.location.origin).href });
  });
}
