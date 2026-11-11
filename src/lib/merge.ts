/**
 * Merging study progress from two places (this browser and the account, or two devices).
 * Every rule only ever keeps the *better* of two values, so merging is safe to repeat
 * in any order: nothing a student has achieved is lost.
 */
import type { CourseProgress, ExamResult, ModuleProgress } from "./progress";

type Flags<T> = Record<string, T> | undefined;

const union = <T,>(a: Flags<T>, b: Flags<T>) => (a || b ? { ...(a ?? {}), ...(b ?? {}) } : undefined);

function mergeBy<T>(a: Flags<T>, b: Flags<T>, pick: (x: T, y: T) => T): Record<string, T> | undefined {
  if (!a) return b;
  if (!b) return a;
  const out: Record<string, T> = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = k in out ? pick(out[k], v) : v;
  return out;
}

const max = (x: number, y: number) => Math.max(x, y);
const strip = <T extends object>(o: T): T => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

export function mergeModule(a: ModuleProgress = {}, b: ModuleProgress = {}): ModuleProgress {
  const lab =
    a.lab || b.lab
      ? strip({ tasks: union(a.lab?.tasks, b.lab?.tasks), challenges: union(a.lab?.challenges, b.lab?.challenges) })
      : undefined;
  const checkpoint =
    a.checkpoint && b.checkpoint
      ? { best: Math.max(a.checkpoint.best, b.checkpoint.best), passed: a.checkpoint.passed || b.checkpoint.passed }
      : (a.checkpoint ?? b.checkpoint);
  return strip({
    stepsSeen: a.stepsSeen != null || b.stepsSeen != null ? Math.max(a.stepsSeen ?? 0, b.stepsSeen ?? 0) : undefined,
    checkpoint,
    quiz: mergeBy(a.quiz, b.quiz, (x, y) => x || y),
    examples: union(a.examples, b.examples),
    questions: mergeBy(a.questions, b.questions, max),
    notesRead: union(a.notesRead, b.notesRead),
    lab,
    code: union(a.code, b.code),
  });
}

export function mergeCourse(a?: CourseProgress, b?: CourseProgress): CourseProgress {
  if (!a) return b ?? { modules: {}, exams: [] };
  if (!b) return a;
  const modules: Record<string, ModuleProgress> = { ...a.modules };
  for (const [id, m] of Object.entries(b.modules ?? {})) modules[id] = mergeModule(modules[id], m);
  const exams = new Map<string, ExamResult>();
  for (const e of [...(a.exams ?? []), ...(b.exams ?? [])]) exams.set(`${e.at}|${e.mode}`, e);
  const last = !a.last ? b.last : !b.last ? a.last : a.last.at >= b.last.at ? a.last : b.last;
  return strip({
    modules,
    exams: [...exams.values()].sort((x, y) => x.at.localeCompare(y.at)).slice(-100),
    last,
    migrated: a.migrated || b.migrated || undefined,
  });
}

export function mergeProgress(a: Record<string, CourseProgress> = {}, b: Record<string, CourseProgress> = {}) {
  const out: Record<string, CourseProgress> = { ...a };
  for (const [id, c] of Object.entries(b)) out[id] = mergeCourse(out[id], c);
  return out;
}

/** Activity points per day. The same day seen on two copies keeps the larger count (no double counting). */
export function mergeActivity(a: Record<string, number> = {}, b: Record<string, number> = {}) {
  return mergeBy(a, b, max) ?? {};
}

/** Stable JSON for cheap "did anything change?" checks. */
export function stableJson(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([x], [y]) => x.localeCompare(y))) : v,
  );
}
