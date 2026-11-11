"use client";
/** Per-course study progress + daily activity (for streaks), persisted in localStorage. */
import { useMemo } from "react";
import type { ModuleShape } from "./content/schema";
import { persistentStore, useStore } from "./store";
import { addDays, todayISO } from "./utils";

export interface ModuleProgress {
  stepsSeen?: number; // highest lesson step reached (count)
  checkpoint?: { best: number; passed: boolean };
  quiz?: Record<number, boolean>; // true = answered correctly
  examples?: Record<number, true>; // worked examples fully revealed
  questions?: Record<number, number>; // best score per written question
  notesRead?: Record<number, true>;
  lab?: { tasks?: Record<string, true>; challenges?: Record<string, true> };
  code?: Record<string, true>; // coding exercises passed
}

export interface ExamResult {
  at: string; // ISO timestamp
  mode: "oral" | "paper";
  score: number;
  byModule: Record<string, number>;
}

export interface CourseProgress {
  modules: Record<string, ModuleProgress>;
  exams: ExamResult[];
  last?: { moduleId: string; view: "learn" | "labs"; at: string };
  migrated?: boolean;
}

type AllProgress = Record<string, CourseProgress>;
const EMPTY: CourseProgress = { modules: {}, exams: [] };

export const progressStore = persistentStore<AllProgress>("studyroom:v3:progress", {});

export function useCourseProgress(courseId: string): CourseProgress {
  const all = useStore(progressStore, {});
  return all[courseId] ?? EMPTY;
}

export function updateCourse(courseId: string, fn: (p: CourseProgress) => CourseProgress) {
  progressStore.set((all) => ({ ...all, [courseId]: fn(all[courseId] ?? EMPTY) }));
}

export function updateModule(courseId: string, moduleId: string, fn: (m: ModuleProgress) => ModuleProgress) {
  updateCourse(courseId, (p) => ({ ...p, modules: { ...p.modules, [moduleId]: fn(p.modules[moduleId] ?? {}) } }));
}

export function touchLast(courseId: string, moduleId: string, view: "learn" | "labs") {
  updateCourse(courseId, (p) => ({ ...p, last: { moduleId, view, at: new Date().toISOString() } }));
}

// ---------------------------------------------------------------------------------------------
// Mastery: a 0–100 estimate of how exam-ready a module is.

export interface LabShape {
  tasks: number;
}

export function moduleMastery(m: ModuleShape, p: ModuleProgress | undefined, lab?: LabShape) {
  const parts: [weight: number, value: number][] = [];
  parts.push([10, Math.min(1, (p?.stepsSeen ?? 0) / m.steps)]);
  if (m.notes) parts.push([10, Object.keys(p?.notesRead ?? {}).length / m.notes]);
  if (m.checkpoint) parts.push([20, (p?.checkpoint?.best ?? 0) / 100]);
  if (m.quiz) parts.push([15, Object.values(p?.quiz ?? {}).filter(Boolean).length / m.quiz]);
  if (m.examples) parts.push([10, Object.keys(p?.examples ?? {}).length / m.examples]);
  if (m.questions) {
    const scores = Object.values(p?.questions ?? {});
    parts.push([15, scores.reduce((a, b) => a + b, 0) / (100 * m.questions)]);
  }
  if (lab?.tasks) parts.push([20, Object.keys(p?.lab?.tasks ?? {}).length / lab.tasks]);
  if (m.coding) parts.push([15, Object.keys(p?.code ?? {}).length / m.coding]);
  const total = parts.reduce((a, [w]) => a + w, 0);
  return Math.round((100 * parts.reduce((a, [w, v]) => a + w * Math.min(1, v), 0)) / total);
}

export function useMastery(courseId: string, modules: ModuleShape[], labs: Record<string, LabShape | undefined>) {
  const p = useCourseProgress(courseId);
  return useMemo(() => {
    const per = Object.fromEntries(modules.map((m) => [m.id, moduleMastery(m, p.modules[m.id], labs[m.id])]));
    const values = Object.values(per);
    return { per, overall: Math.round(values.reduce((a, b) => a + b, 0) / Math.max(1, values.length)) };
  }, [modules, p, labs]);
}

// ---------------------------------------------------------------------------------------------
// Activity log → GitHub-style contribution graph and streaks.

export const activityStore = persistentStore<Record<string, number>>("studyroom:v3:activity", {});

/** Record a meaningful study action (answer graded, quiz answered, lab task done, …). */
export function logActivity(points = 1) {
  const day = todayISO();
  activityStore.set((a) => ({ ...a, [day]: (a[day] ?? 0) + points }));
}

export function useActivity() {
  return useStore(activityStore, {});
}

export function streaks(activity: Record<string, number>, today = todayISO()) {
  let current = 0;
  // Today not studied yet doesn't break the streak until the day is over.
  let day = activity[today] ? today : addDays(today, -1);
  while (activity[day]) {
    current++;
    day = addDays(day, -1);
  }
  const days = Object.keys(activity).filter((d) => activity[d] > 0).sort();
  let longest = 0;
  let run = 0;
  let prev = "";
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  return { current, longest, activeDays: days.length, studiedToday: !!activity[today] };
}

// ---------------------------------------------------------------------------------------------
// One-time import of progress saved by the old single-page site (index-based keys).

export function migrateLegacyProgress(course: { id: string; modules: { id: string }[] }) {
  if (typeof window === "undefined") return;
  const current = progressStore.get()[course.id];
  if (current?.migrated) return;
  const key = course.id === "cv" ? "dv_progress_v2" : `dv_progress_v2_${course.id}`;
  let legacy: { best?: Record<string, number>; solved?: Record<string, boolean>; quiz?: Record<string, boolean>; labs?: Record<string, boolean> } | null = null;
  try {
    legacy = JSON.parse(window.localStorage.getItem(key) ?? "null");
  } catch {
    legacy = null;
  }
  updateCourse(course.id, (p) => {
    if (!legacy) return { ...p, migrated: true };
    const modules = { ...p.modules };
    course.modules.forEach((m, i) => {
      const mp: ModuleProgress = { ...(modules[m.id] ?? {}) };
      const best = legacy?.best?.[`cp:${i}`];
      if (best != null) mp.checkpoint = { best, passed: !!legacy?.solved?.[i] || best >= 60 };
      const quiz: Record<number, boolean> = { ...(mp.quiz ?? {}) };
      Object.keys(legacy?.quiz ?? {}).forEach((k) => {
        const [, mi, qi] = k.split(":");
        if (Number(mi) === i) quiz[Number(qi)] = true;
      });
      if (Object.keys(quiz).length) mp.quiz = quiz;
      modules[m.id] = mp;
    });
    return { ...p, modules, migrated: true };
  });
}
