/**
 * Code-side parts of each course (everything that can't live in YAML):
 *   scenes — canvas animations for lesson steps (optional; lessons fall back to text cards)
 *   labs   — guided interactive labs keyed by module id (optional; challenges still work)
 *
 * A course with only YAML content works fine — register code here when you add it.
 */
import type { LabDef } from "@/lib/lab/types";
import type { Scene } from "@/lib/scene/kit";
import { labs as aiLabs } from "./ai/labs";
import { scenes as aiScenes } from "./ai/scenes";
import { labs as cvLabs } from "./cv/labs";
import { scenes as cvScenes } from "./cv/scenes";
import { labs as dsLabs } from "./ds/labs";
import { scenes as dsScenes } from "./ds/scenes";

export interface CourseCode {
  scenes?: Record<string, Scene>;
  labs?: Record<string, LabDef>;
}

const REGISTRY: Record<string, CourseCode> = {
  ai: { scenes: aiScenes, labs: aiLabs },
  cv: { scenes: cvScenes, labs: cvLabs },
  ds: { scenes: dsScenes, labs: dsLabs },
};

export const courseCode = (courseId: string): CourseCode => REGISTRY[courseId] ?? {};
export const getScene = (courseId: string, moduleId: string) => courseCode(courseId).scenes?.[moduleId];
export const getLab = (courseId: string, moduleId: string) => courseCode(courseId).labs?.[moduleId];
export const labShapes = (courseId: string) =>
  Object.fromEntries(Object.entries(courseCode(courseId).labs ?? {}).map(([id, lab]) => [id, { tasks: lab.tasks.length }]));
