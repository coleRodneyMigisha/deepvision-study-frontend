/**
 * Lab integrity: every lab renders with defaults, daily challenges are deterministic and finite,
 * and every goal is actually reachable (random search over controls + explicit solutions).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { labs as aiLabs } from "../src/courses/ai/labs.ts";
import { labs as cvLabs } from "../src/courses/cv/labs.tsx";
import { labs as dsLabs } from "../src/courses/ds/labs.ts";
import { loadAllCourses } from "../src/lib/content/pack.ts";
import type { Control, Derived, LabDef, Values } from "../src/lib/lab/types.ts";
import { makePicker, seededRng } from "../src/lib/utils.ts";

const ALL: Record<string, Record<string, LabDef>> = { ai: aiLabs, cv: cvLabs, ds: dsLabs };

// Goals that depend on what a student paints/draws (reported by a Visual) can't be searched.
const VISUAL_GOALS = new Set(["cv/images-as-data/g-clip", "cv/segmentation/g-80", "cv/segmentation/g-gap"]);

// Exact-value goals that random search is unlikely to hit — verified with a known solution.
const SOLUTIONS: Record<string, Values> = {
  "ds/data-cleaning/g-fence": { q1: 2000, q3: 3200 },
  "ds/pyspark/g-cache": { uncached: 3, build: 4.5, cachedRead: 0.5, actions: 3 },
  "ds/star-schemas/g-million": { markets: 20, commodities: 20, days: 2600 },
  "ds/streaming/g-save": { eventTs: 1233, lateness: 7 },
  "ds/milk-warehouse/g-cap": { centre: "Masaka", agg: "daily" },
  "ai/data-preparation/g-recall": { model: "smote", cohort: 3000, prev: 5 },
  "ai/fastapi-serving/g-slo": { qps: 300, workers: 16, serviceMs: 15 },
  "ai/drift-psi/g-retrain": { shift: 0, spread: 1.7 },
  "ai/stroke-capstone/g-recall": { threshold: 0.22 },
  "ai/stroke-capstone/g-low": { age: 30, glucose: 90, bmi: 22, hyp: false, heart: false },
  "cv/images-as-data/g-zero": { channel: "1", pixel: 116 },
  "cv/cnns/g-same": { W: 64, K: 5, P: 2, S: 1 },
  "cv/cnns/g-half": { W: 224, K: 3, P: 1, S: 2 },
  "cv/training-evaluation/g-pr": { tp: 10, fn: 20, fp: 1, tn: 900 },
  "cv/vits-multimodal/g-temp": { dog: 0.31, cat: 0.26, car: 0.12, scale: 2 },
  "cv/video-tracking/g-fix": { frame: 40, occluder: true, appearance: true },
  "cv/video-tracking/g-switch": { frame: 40, occluder: true, appearance: false },
  "cv/deployment-responsible/g-zero": { tmin: -1.2, tmax: 0.8, w: 0 },
};

function defaults(lab: LabDef): Values {
  return Object.fromEntries(lab.sections.flatMap((s) => s.controls.map((c) => [c.id, c.default])));
}

function derive(lab: LabDef, v: Values): Derived {
  return Object.assign({}, ...lab.sections.map((s) => s.derive?.(v) ?? {}));
}

function sample(c: Control, rand: () => number) {
  switch (c.kind) {
    case "range": {
      const step = c.step ?? 1, k = Math.floor(rand() * (Math.floor((c.max - c.min) / step) + 1));
      return Math.round((c.min + k * step) * 1e6) / 1e6;
    }
    case "number": {
      const lo = c.min ?? 0, hi = Math.max(lo + 1, (c.max ?? Math.abs(c.default) * 4) || 10);
      return rand() < 0.3 ? c.default : Math.round(lo + rand() * (hi - lo));
    }
    case "select":
      return c.options[Math.floor(rand() * c.options.length)].value;
    case "toggle":
      return rand() < 0.5;
  }
}

describe("course content", () => {
  it("validates every course pack", () => {
    const courses = loadAllCourses();
    assert.ok(courses.length >= 3);
    for (const c of courses) for (const m of c.modules) assert.ok(m.lesson.steps.length > 0, `${c.id}/${m.id}`);
  });

  it("has a lab definition for every module that declares a lab", () => {
    for (const c of loadAllCourses()) for (const m of c.modules) if (m.lab) assert.ok(ALL[c.id]?.[m.id], `missing lab ${c.id}/${m.id}`);
  });
});

for (const [courseId, labs] of Object.entries(ALL)) {
  describe(`${courseId} labs`, () => {
    for (const [moduleId, lab] of Object.entries(labs)) {
      it(`${moduleId}: renders with defaults`, () => {
        const v = defaults(lab), d = derive(lab, v);
        for (const s of lab.sections) assert.ok(Array.isArray(s.view(v, d)));
        const ids = lab.tasks.map((t) => t.id);
        assert.equal(new Set(ids).size, ids.length, "task ids must be unique");
        assert.ok(lab.tasks.some((t) => t.kind === "explain"), "each lab needs an explain task");
      });

      it(`${moduleId}: daily challenge is deterministic and finite`, () => {
        if (!lab.daily) return;
        for (let day = 1; day <= 90; day++) {
          const date = `2026-${String(1 + (day % 12)).padStart(2, "0")}-${String(1 + (day % 28)).padStart(2, "0")}`;
          type Daily = ReturnType<NonNullable<LabDef["daily"]>>;
          const a: Daily = lab.daily(makePicker(seededRng(`${courseId}:${moduleId}:${date}`)), date);
          const b: Daily = lab.daily(makePicker(seededRng(`${courseId}:${moduleId}:${date}`)), date);
          assert.deepEqual(a, b);
          assert.ok(Number.isFinite(a.answer), `${date}: answer ${a.answer}`);
        }
      });

      it(`${moduleId}: no goal is already met before the student does anything`, () => {
        const v = defaults(lab), d = derive(lab, v);
        for (const t of lab.tasks) if (t.kind === "goal") assert.ok(!t.check(v, d), `${courseId}/${moduleId}/${t.id} is satisfied by the defaults`);
      });

      it(`${moduleId}: every goal is reachable`, () => {
        const rand = seededRng(`search:${courseId}:${moduleId}`);
        const controls = lab.sections.flatMap((s) => s.controls);
        for (const t of lab.tasks) {
          if (t.kind !== "goal") continue;
          const key = `${courseId}/${moduleId}/${t.id}`;
          if (VISUAL_GOALS.has(key)) continue;
          const tryValues = (v: Values) => {
            try {
              return t.check(v, derive(lab, v));
            } catch {
              return false;
            }
          };
          if (SOLUTIONS[key]) {
            assert.ok(tryValues({ ...defaults(lab), ...SOLUTIONS[key] }), `${key}: listed solution doesn't satisfy the goal`);
            continue;
          }
          let found = false;
          for (let i = 0; i < 20000 && !found; i++) {
            found = tryValues(Object.fromEntries(controls.map((c) => [c.id, sample(c, rand)])));
          }
          assert.ok(found, `${key}: no solution found — "${t.prompt}"`);
        }
      });
    }
  });
}
