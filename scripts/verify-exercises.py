"""Verify every coding exercise with real Python + DuckDB, using the browser's own harness.

For each runnable exercise:
  • the reference solution must pass every hidden test;
  • the starter code must NOT pass (otherwise the tests check nothing).

Run:  npm run verify:exercises   (uses uv to provide pandas, numpy, scikit-learn, scipy, duckdb, pydantic)
"""

import importlib.util
import json
import os
import shutil
import sys
import tempfile
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("harness", ROOT / "public" / "coding" / "harness.py")
harness = importlib.util.module_from_spec(spec)
spec.loader.exec_module(harness)

only = sys.argv[1] if len(sys.argv) > 1 else ""
failures, checked = [], 0
for course_dir in sorted((ROOT / "content" / "courses").iterdir()):
    for mod_file in sorted((course_dir / "modules").glob("*.yaml")):
        module = yaml.safe_load(mod_file.read_text())
        for ex in module.get("coding") or []:
            key = f"{course_dir.name}/{module['id']}/{ex['id']}"
            if ex["language"] == "review" or (only and only not in key):
                continue
            checked += 1
            work = Path(tempfile.mkdtemp())
            for f in ex.get("files") or []:
                shutil.copy(course_dir / "data" / f, work / f)
            cwd = os.getcwd()
            os.chdir(work)
            try:
                base = {k: ex.get(k) for k in ("language", "setup", "tests", "solution")} | {"compare": ex.get("compare", "rows")}
                good = json.loads(harness.run_exercise(base | {"code": ex["solution"]}))
                bad = json.loads(harness.run_exercise(base | {"code": ex.get("starter", "")}))
            finally:
                os.chdir(cwd)
                shutil.rmtree(work)
            if not good["ok"]:
                why = good["error"] or "; ".join(f"{t['name']}: {t['message']}" for t in good["tests"] if not t["passed"])
                failures.append(f"{key}: solution fails → {why}")
            elif bad["ok"]:
                failures.append(f"{key}: starter code already passes — tests are too weak")
            else:
                print(f"  ✓ {key} ({len(good['tests'])} tests)")

print(f"\n{checked} exercises checked, {len(failures)} problem(s)")
for f in failures:
    print("  ✗", f)
sys.exit(1 if failures else 0)
