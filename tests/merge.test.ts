import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeActivity, mergeCourse, mergeModule, mergeProgress, stableJson } from "../src/lib/merge.ts";
import type { CourseProgress } from "../src/lib/progress.ts";

describe("progress merging", () => {
  it("keeps the best of every module field", () => {
    const a = { stepsSeen: 4, checkpoint: { best: 70, passed: true }, quiz: { 0: true, 1: false }, questions: { 0: 40 }, code: { e1: true as const } };
    const b = { stepsSeen: 7, checkpoint: { best: 55, passed: false }, quiz: { 1: true, 2: false }, questions: { 0: 85, 1: 20 }, lab: { tasks: { t1: true as const } } };
    assert.deepEqual(mergeModule(a, b), {
      stepsSeen: 7,
      checkpoint: { best: 70, passed: true },
      quiz: { 0: true, 1: true, 2: false },
      questions: { 0: 85, 1: 20 },
      code: { e1: true },
      lab: { tasks: { t1: true } },
    });
  });

  it("is order-independent and idempotent", () => {
    const x: CourseProgress = {
      modules: { m1: { stepsSeen: 3, notesRead: { 0: true } } },
      exams: [{ at: "2026-11-10T10:00:00Z", mode: "paper", score: 60, byModule: {} }],
      last: { moduleId: "m1", view: "learn", at: "2026-11-10T10:00:00Z" },
    };
    const y: CourseProgress = {
      modules: { m1: { stepsSeen: 5 }, m2: { examples: { 1: true } } },
      exams: [
        { at: "2026-11-10T10:00:00Z", mode: "paper", score: 60, byModule: {} },
        { at: "2026-11-11T09:00:00Z", mode: "oral", score: 72, byModule: {} },
      ],
      last: { moduleId: "m2", view: "labs", at: "2026-11-11T09:00:00Z" },
    };
    const xy = mergeCourse(x, y);
    assert.equal(stableJson(xy), stableJson(mergeCourse(y, x)));
    assert.equal(stableJson(mergeCourse(xy, y)), stableJson(xy));
    assert.equal(xy.exams.length, 2);
    assert.equal(xy.last?.moduleId, "m2");
    assert.deepEqual(xy.modules.m1, { stepsSeen: 5, notesRead: { 0: true } });
  });

  it("merges whole progress maps, including courses only one side has", () => {
    const merged = mergeProgress({ cv: { modules: {}, exams: [] } }, { ds: { modules: { m: { stepsSeen: 1 } }, exams: [] } });
    assert.deepEqual(Object.keys(merged).sort(), ["cv", "ds"]);
  });

  it("never double-counts a day's activity", () => {
    assert.deepEqual(mergeActivity({ "2026-11-10": 3, "2026-11-11": 1 }, { "2026-11-11": 4, "2026-11-09": 2 }), {
      "2026-11-10": 3,
      "2026-11-11": 4,
      "2026-11-09": 2,
    });
  });

  it("stableJson ignores key order", () => assert.equal(stableJson({ b: 1, a: { d: 1, c: 2 } }), stableJson({ a: { c: 2, d: 1 }, b: 1 })));
});
