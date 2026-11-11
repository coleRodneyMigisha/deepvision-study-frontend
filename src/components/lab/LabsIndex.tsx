"use client";
import { FlaskConical } from "lucide-react";
import Link from "next/link";
import { Badge, Card, Eyebrow } from "@/components/ui";
import { labShapes } from "@/courses";
import { useBuddyPage } from "@/lib/buddy";
import type { CourseOutline } from "@/lib/content/schema";
import { useCourseProgress } from "@/lib/progress";

export function LabsIndex({ course }: { course: CourseOutline }) {
  const progress = useCourseProgress(course.id);
  const shapes = labShapes(course.id);
  useBuddyPage({ courseId: course.id, courseLabel: `${course.code} ${course.title}`, context: { view: "course" } });
  return (
    <div>
      <Eyebrow>{course.code}</Eyebrow>
      <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">Labs</h1>
      <p className="mt-2 max-w-2xl text-ink-2">Each lab is a small simulator of something from the course. Predict what will happen, try it, explain it, then take on the challenges.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {course.modules
          .filter((m) => m.hasLab)
          .map((m, i) => {
            const tasks = shapes[m.id]?.tasks ?? 0;
            const doneTasks = Object.keys(progress.modules[m.id]?.lab?.tasks ?? {}).length;
            const solved = Object.keys(progress.modules[m.id]?.lab?.challenges ?? {}).length;
            return (
              <Link key={m.id} href={`/${course.id}/labs/${m.id}/`} className="group">
                <Card className="h-full p-5 transition group-hover:-translate-y-0.5 group-hover:shadow-lift">
                  <div className="flex items-center gap-2 text-xs font-semibold text-accent">
                    <FlaskConical className="size-4" /> Lab {i + 1}
                  </div>
                  <h2 className="mt-2 font-display text-lg leading-snug font-semibold">{m.labTitle}</h2>
                  <p className="mt-1 text-sm text-ink-2">{m.title}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tasks > 0 && <Badge tone={doneTasks >= tasks ? "good" : "neutral"}>Tasks {doneTasks}/{tasks}</Badge>}
                    {m.coding > 0 && <Badge>{m.coding} coding</Badge>}
                    {solved > 0 && <Badge tone="accent">{solved} challenge{solved > 1 ? "s" : ""} solved</Badge>}
                  </div>
                </Card>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
