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

import { graphWeeks, resolveRange } from "../src/lib/progress.ts";

describe("streak graph range", () => {
  const today = "2026-11-11";
  it("defaults to presets ending today", () => {
    assert.deepEqual(resolveRange({ preset: "3m" }, {}, today), { from: "2026-08-12", to: today });
    assert.equal(resolveRange({ preset: "1y" }, {}, today).from, "2025-11-12");
  });
  it("'all' starts at the first study day, but shows at least a month", () => {
    assert.equal(resolveRange({ preset: "all" }, { "2025-02-03": 2, "2026-01-01": 1 }, today).from, "2025-02-03");
    assert.equal(resolveRange({ preset: "all" }, { "2026-11-10": 1 }, today).from, "2026-10-12");
  });
  it("custom ranges are ordered, clamped to today and capped at ~3 years", () => {
    assert.deepEqual(resolveRange({ preset: "custom", from: "2026-10-01", to: "2026-09-01" }, {}, today), { from: "2026-09-01", to: "2026-10-01" });
    assert.equal(resolveRange({ preset: "custom", from: "2026-10-01", to: "2027-01-01" }, {}, today).to, today);
    assert.equal(resolveRange({ preset: "custom", from: "2010-01-01", to: today }, {}, today).from, "2023-11-09");
  });
  it("lays out whole Sunday-first weeks and only counts days inside the range", () => {
    // 2026-11-04 is a Wednesday.
    const { weeks, total } = graphWeeks({ "2026-11-01": 9, "2026-11-04": 2, "2026-11-11": 3, "2026-11-12": 5 }, "2026-11-04", today);
    assert.equal(weeks[0][0].date, "2026-11-01");
    assert.equal(weeks[0][0].outside, true);
    assert.equal(weeks[0][3].date, "2026-11-04");
    assert.equal(weeks.length, 2);
    assert.equal(total, 5);
    assert.ok(weeks.flat().every((c) => c.date.slice(0, 4) === "2026"));
  });
});
