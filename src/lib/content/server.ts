/** Build-time content access for server components (never shipped to the browser). */
import "server-only";

import { cache } from "react";
import { loadAllCourses } from "./pack";
import { type Course, type CourseOutline, type CourseSummary, moduleShape } from "./schema";

export const getCourses = cache((): Course[] => loadAllCourses());

export function getCourse(id: string): Course {
  const course = getCourses().find((c) => c.id === id);
  if (!course) throw new Error(`Unknown course "${id}"`);
  return course;
}

export function getModule(courseId: string, moduleId: string) {
  const course = getCourse(courseId);
  const index = course.modules.findIndex((m) => m.id === moduleId);
  if (index === -1) throw new Error(`Unknown module "${moduleId}" in ${courseId}`);
  return { course, module: course.modules[index], index };
}

export function getCourseSummaries(): CourseSummary[] {
  return getCourses().map((c) => ({
    id: c.id,
    code: c.code,
    title: c.title,
    shortTitle: c.shortTitle,
    tagline: c.tagline,
    accent: c.accent,
    moduleCount: c.modules.length,
    firstModule: c.modules[0].id,
  }));
}

export function getOutline(id: string): CourseOutline {
  const c = getCourse(id);
  const summary = getCourseSummaries().find((s) => s.id === id)!;
  return { ...summary, modules: c.modules.map(moduleShape) };
}

export const getOutlines = () => getCourses().map((c) => getOutline(c.id));

export const courseParams = () => getCourses().map((c) => ({ course: c.id }));
export const moduleParams = () => getCourses().flatMap((c) => c.modules.map((m) => ({ course: c.id, module: m.id })));

/** Everything the mock exam draws from, flattened with module ids. */
export function getExamBank(id: string) {
  const c = getCourse(id);
  return {
    courseId: c.id,
    code: c.code,
    title: c.title,
    durationMinutes: c.exam.durationMinutes,
    modules: c.modules.map((m) => ({ id: m.id, title: m.title })),
    mcq: c.modules.flatMap((m) => m.quiz.map((q) => ({ module: m.id, ...q }))),
    numeric: c.modules.flatMap((m) => (m.lab?.variations ?? []).map((v) => ({ module: m.id, ...v }))),
    written: [
      ...c.exam.written.map((q) => ({ module: q.module, prompt: q.prompt, keywords: q.keywords, idealAnswer: q.idealAnswer, marks: 10 })),
      ...c.modules.flatMap((m) => m.questions.map((q) => ({ module: m.id, prompt: q.question, keywords: q.keywords, idealAnswer: q.idealAnswer, marks: q.marks }))),
      ...c.modules.flatMap((m) =>
        m.checkpoint ? [{ module: m.id, prompt: m.checkpoint.question, keywords: m.checkpoint.keywords, idealAnswer: m.checkpoint.idealAnswer, marks: 8 }] : [],
      ),
    ],
  };
}
export type ExamBank = ReturnType<typeof getExamBank>;
