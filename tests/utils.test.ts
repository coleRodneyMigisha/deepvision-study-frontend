import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { localGrade } from "../src/lib/grading.ts";
import { streaks } from "../src/lib/progress.ts";
import { addDays, parseNumber, seededRng, withinTolerance } from "../src/lib/utils.ts";

describe("streaks", () => {
  const today = "2026-11-11";
  it("counts consecutive days ending today or yesterday", () => {
    const a = { "2026-11-09": 2, "2026-11-10": 1, "2026-11-11": 4 };
    assert.equal(streaks(a, today).current, 3);
    const b = { "2026-11-09": 2, "2026-11-10": 1 };
    assert.deepEqual([streaks(b, today).current, streaks(b, today).studiedToday], [2, false]);
  });
  it("breaks after a missed day and tracks the longest run", () => {
    const a = { "2026-10-01": 1, "2026-10-02": 1, "2026-10-03": 1, "2026-11-08": 1 };
    assert.deepEqual([streaks(a, today).current, streaks(a, today).longest], [0, 3]);
  });
  it("handles month boundaries", () => assert.equal(addDays("2026-03-01", -1), "2026-02-28"));
});

describe("numbers", () => {
  it("parses student input", () => {
    assert.equal(parseNumber("5,200"), 5200);
    assert.equal(parseNumber("−3.5"), -3.5);
  });
  it("checks tolerance", () => {
    assert.ok(withinTolerance(0.734, 0.73, 0.01));
    assert.ok(!withinTolerance(0.75, 0.73, 0.01));
    assert.ok(!withinTolerance(NaN, 1, 1));
  });
  it("seeded rng is deterministic", () => {
    const a = seededRng("x"), b = seededRng("x");
    assert.equal(a(), b());
  });
});

describe("offline grading", () => {
  it("rewards keyword coverage and caps short answers", () => {
    const base = { courseId: "ds", question: "q", idealAnswer: "ideal", keywords: ["median", "skew", "robust", "outlier"] };
    const short = localGrade({ ...base, answer: "median skew robust outlier" });
    const full = localGrade({ ...base, answer: "The median is robust because prices skew and a single outlier drags the mean far away from the typical price of each commodity." });
    assert.ok(short.score <= 45);
    assert.ok(full.score >= 80);
    assert.equal(full.source, "heuristic");
  });
});
