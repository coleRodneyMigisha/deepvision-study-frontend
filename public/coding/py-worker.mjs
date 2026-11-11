/**
 * StudyRoom coding-lab worker (ES module — Pyodide ≥ 314 only runs in module workers).
 * Runs exercises in Pyodide (CPython compiled to WebAssembly), which also ships DuckDB for SQL.
 * Served as a static file so the bundler can't change how it's loaded. The page terminates this
 * worker if a run takes too long (e.g. an infinite loop).
 */
const PYODIDE_VERSION = "314.0.7";
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let booting = null;
const post = (msg) => self.postMessage(msg);

async function boot(harnessUrl) {
  const { loadPyodide } = await import(`${INDEX_URL}pyodide.mjs`);
  const py = await loadPyodide({ indexURL: INDEX_URL });
  py.runPython(await (await fetch(harnessUrl)).text());
  py.FS.mkdirTree("/home/pyodide/work");
  return py;
}

self.onmessage = async (e) => {
  const { id, spec, files, harnessUrl } = e.data;
  let py;
  try {
    if (!booting) post({ id, type: "status", text: "Starting Python in your browser (first time only)…" });
    booting ??= boot(harnessUrl);
    py = await booting;
  } catch (err) {
    booting = null; // allow a clean retry
    console.error("Pyodide failed to start", err);
    post({ id, type: "error", message: `Couldn't start Python in the browser — check your internet connection and try again. (${err?.message ?? err})` });
    return;
  }
  try {
    post({ id, type: "status", text: "Loading libraries…" });
    // Scan each Python snippet on its own: a snippet with a syntax error (or SQL text) must not stop
    // the others' imports loading — the student should see their real error, not ModuleNotFoundError.
    const python = spec.language === "sql" ? spec.tests.map((t) => t.code) : [spec.setup, spec.code, spec.solution, ...spec.tests.map((t) => t.code)];
    if (spec.language === "sql") await py.loadPackage(["duckdb", "pandas"]);
    for (const snippet of python) {
      try {
        await py.loadPackagesFromImports(snippet);
      } catch {
        /* unparsable snippet — the harness reports the real error */
      }
    }
    for (const f of files) {
      const text = await (await fetch(f.url)).text();
      py.FS.writeFile(`/home/pyodide/work/${f.name}`, text);
    }
    post({ id, type: "status", text: "Running…" });
    py.globals.set("__spec_json", JSON.stringify(spec));
    const out = await py.runPythonAsync("import json, os\nos.chdir('/home/pyodide/work')\nrun_exercise(json.loads(__spec_json))");
    post({ id, type: "result", report: JSON.parse(String(out)) });
  } catch (err) {
    post({ id, type: "error", message: err?.message ?? String(err) });
  }
};
