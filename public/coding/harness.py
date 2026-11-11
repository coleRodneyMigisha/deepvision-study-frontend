"""StudyRoom coding-lab harness.

The same file runs in the browser (Pyodide, inside a Web Worker) and in
`scripts/verify-exercises.py`, so an exercise that passes verification behaves identically for
students. It executes the student's Python or SQL, then the exercise's hidden tests.

Tests are Python snippets that use `assert`. They run in the student's namespace (Python
exercises) or with `con` (DuckDB connection), `result` (DataFrame of the last statement) and
`expected` (the reference solution's result) for SQL exercises.
"""

import contextlib
import io
import json
import re
import traceback

MAX_ROWS = 50
QUERY_START = re.compile(r"^\s*(select|with|from|show|describe|summarize|values|table|pivot|unpivot|explain)\b", re.I)


def _strip_sql_comments(sql):
    sql = re.sub(r"/\*.*?\*/", "", sql, flags=re.S)
    return "\n".join(line.split("--", 1)[0] for line in sql.splitlines())


def _last_statement(sql):
    parts = [p for p in _strip_sql_comments(sql).split(";") if p.strip()]
    return parts[-1] if parts else ""


def _frame(df):
    if df is None:
        return None
    head = df.head(MAX_ROWS)
    rows = [[None if _isnull(v) else (v if isinstance(v, (int, float, str, bool)) else str(v)) for v in r] for r in head.itertuples(index=False)]
    return {"columns": [str(c) for c in df.columns], "rows": rows, "total": int(len(df))}


def _isnull(v):
    try:
        return v is None or v != v  # NaN check
    except Exception:
        return False


def _error_text(exc, user_filename):
    if isinstance(exc, AssertionError):
        return str(exc) or "Assertion failed"
    if isinstance(exc, SyntaxError) and exc.filename == user_filename:
        return f"SyntaxError: {exc.msg} (line {exc.lineno})"
    tb = traceback.extract_tb(exc.__traceback__)
    lines = [f"line {f.lineno}" for f in tb if f.filename == user_filename]
    where = f" ({lines[-1]})" if lines else ""
    return f"{type(exc).__name__}: {exc}{where}"


def same_rows(a, b, ordered=False, tol=1e-6):
    """True if two DataFrames have the same shape and values (column names are ignored)."""
    if a is None or b is None or a.shape != b.shape:
        return False

    def norm(df):
        rows = []
        for r in df.itertuples(index=False):
            out = []
            for v in r:
                if _isnull(v):
                    out.append(None)
                elif isinstance(v, float):
                    out.append(round(v, 6))
                elif hasattr(v, "item"):
                    item = v.item()
                    out.append(round(item, 6) if isinstance(item, float) else item)
                else:
                    out.append(str(v) if not isinstance(v, (int, str, bool)) else v)
            rows.append(tuple(out))
        return rows if ordered else sorted(rows, key=lambda t: tuple((x is None, str(type(x)), x if x is not None else 0) for x in t))

    return norm(a) == norm(b)


def _run_sql(con, sql):
    rel = con.execute(sql)
    if QUERY_START.match(_last_statement(sql) or ""):
        return rel.fetchdf()
    return None


def run_exercise(spec):
    """spec: {language, setup, code, tests:[{name, code}], solution, compare}. Returns a JSON string."""
    language = spec.get("language", "python")
    out = io.StringIO()
    report = {"ok": False, "stdout": "", "error": None, "tests": [], "result": None}
    tests = list(spec.get("tests") or [])

    if language == "sql":
        import duckdb

        con = duckdb.connect()
        ns = {"con": con, "same_rows": same_rows, "result": None, "expected": None}
        try:
            with contextlib.redirect_stdout(out):
                if spec.get("setup"):
                    con.execute(spec["setup"])
                result = _run_sql(con, spec.get("code") or "")
                ns["result"] = result
                report["result"] = _frame(result)
        except Exception as exc:
            report["error"] = f"{type(exc).__name__}: {exc}"
            report["stdout"] = out.getvalue()
            return json.dumps(report)
        compare = spec.get("compare", "rows")
        if spec.get("solution") and compare != "none":
            ref = duckdb.connect()
            if spec.get("setup"):
                ref.execute(spec["setup"])
            ns["expected"] = _run_sql(ref, spec["solution"])
            tests.insert(0, {
                "name": "Returns the expected rows" + (" in the expected order" if compare == "ordered" else ""),
                "code": f"assert result is not None, 'Your last statement must be a query that returns rows'\n"
                        f"assert result.shape == expected.shape, f'Expected {{expected.shape[0]}} rows × {{expected.shape[1]}} columns, got {{result.shape[0]}} × {{result.shape[1]}}'\n"
                        f"assert same_rows(result, expected, ordered={compare == 'ordered'}), 'The values differ from the expected result'",
            })
    else:
        ns = {"__name__": "__main__", "same_rows": same_rows}
        try:
            with contextlib.redirect_stdout(out):
                if spec.get("setup"):
                    exec(compile(spec["setup"], "<setup>", "exec"), ns)
                exec(compile(spec.get("code") or "", "<your code>", "exec"), ns)
        except Exception as exc:
            report["error"] = _error_text(exc, "<your code>")
            report["stdout"] = out.getvalue()
            return json.dumps(report)

    passed = 0
    for t in tests:
        try:
            with contextlib.redirect_stdout(out):
                exec(compile(t["code"], "<test>", "exec"), dict(ns))
            report["tests"].append({"name": t["name"], "passed": True, "message": ""})
            passed += 1
        except Exception as exc:
            report["tests"].append({"name": t["name"], "passed": False, "message": _error_text(exc, "<test>")})
    report["ok"] = bool(tests) and passed == len(tests)
    report["stdout"] = out.getvalue()[-5000:]
    return json.dumps(report, default=str)
