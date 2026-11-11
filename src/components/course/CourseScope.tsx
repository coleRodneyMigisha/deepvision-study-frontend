"use client";
import { useEffect } from "react";
import { migrateLegacyProgress } from "@/lib/progress";

/** Course-wide side effects: import progress saved by the previous version of the site. */
export function CourseScope({ courseId, moduleIds }: { courseId: string; moduleIds: string[] }) {
  useEffect(() => {
    migrateLegacyProgress({ id: courseId, modules: moduleIds.map((id) => ({ id })) });
  }, [courseId, moduleIds]);
  return null;
}
