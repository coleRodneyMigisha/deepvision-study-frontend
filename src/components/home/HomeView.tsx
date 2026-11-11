"use client";
import { ArrowRight, BookOpen, FlaskConical, GraduationCap, Sparkles } from "lucide-react";
import Link from "next/link";
import { BuddyAvatar } from "@/components/buddy/BuddyAvatar";
import { ButtonLink, Card, ProgressRing } from "@/components/ui";
import { labShapes } from "@/courses";
import { openBuddy, useBuddyPage } from "@/lib/buddy";
import type { CourseOutline } from "@/lib/content/schema";
import { progressStore, useMastery } from "@/lib/progress";
import { useStore } from "@/lib/store";
import { StreakGraph } from "./StreakGraph";

export function HomeView({ courses }: { courses: CourseOutline[] }) {
  useBuddyPage({ context: { view: "home" } });
  const all = useStore(progressStore, {});
  const recent = courses
    .map((c) => ({ c, last: all[c.id]?.last }))
    .filter((x) => x.last)
    .sort((a, b) => (b.last!.at > a.last!.at ? 1 : -1))[0];

  return (
    <div className="space-y-10">
      <section className="grid items-center gap-8 pt-4 md:grid-cols-[1.25fr_1fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-semibold text-ink-2">
            <Sparkles className="size-3.5 text-accent" /> Your AI study buddy knows your syllabus
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl">
            From <span className="hl">zero</span> to exam-ready, one session at a time.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-2">
            Step-through lessons, deep notes and worked examples, labs you can poke at, and mock exams graded the way your examiner
            grades — with a buddy who nudges before it tells.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {recent ? (
              <ButtonLink variant="primary" size="lg" href={`/${recent.c.id}/${recent.last!.view}/${recent.last!.moduleId}/`}>
                Continue {recent.c.code} <ArrowRight className="size-4" />
              </ButtonLink>
            ) : (
              <ButtonLink variant="primary" size="lg" href={`/${courses[0].id}/`}>
                Start studying <ArrowRight className="size-4" />
              </ButtonLink>
            )}
            <button onClick={() => openBuddy()} className="inline-flex h-12 items-center gap-2 rounded-full border border-line-2 bg-card px-5 font-semibold">
              <BuddyAvatar size={26} /> Say hi to your buddy
            </button>
          </div>
        </div>
        <Card className="relative overflow-hidden p-6">
          <div className="flex items-start gap-3">
            <BuddyAvatar mood="wave" size={56} />
            <div className="rounded-2xl rounded-tl-md border border-line bg-paper px-4 py-3 text-[15px]">
              <p className="font-semibold">How studying here works</p>
              <ol className="mt-2 space-y-1.5 text-sm text-ink-2">
                <li><b className="text-ink">1 · Learn</b> — step through the idea, then read the deep notes.</li>
                <li><b className="text-ink">2 · Practise</b> — worked examples, quick checks, written questions.</li>
                <li><b className="text-ink">3 · Do</b> — the lab: predict, experiment, explain.</li>
                <li><b className="text-ink">4 · Prove it</b> — a timed mock exam that finds your weak spots.</li>
              </ol>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl font-semibold">Your courses</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </section>

      <StreakGraph />
    </div>
  );
}

function CourseCard({ course }: { course: CourseOutline }) {
  const { overall } = useMastery(course.id, course.modules, labShapes(course.id));
  return (
    <Link href={`/${course.id}/`} className="group" style={{ ["--accent" as string]: course.accent }}>
      <Card className="flex h-full flex-col p-5 transition group-hover:-translate-y-0.5 group-hover:shadow-lift">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold text-white" style={{ background: course.accent }}>
              {course.code}
            </span>
            <h3 className="mt-3 font-display text-xl leading-snug font-semibold">{course.title}</h3>
          </div>
          <ProgressRing value={overall} size={48} />
        </div>
        <p className="mt-2 flex-1 text-sm text-ink-2">{course.tagline}</p>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1"><BookOpen className="size-3.5" /> {course.moduleCount} modules</span>
          <span className="inline-flex items-center gap-1"><FlaskConical className="size-3.5" /> {course.modules.filter((m) => m.hasLab).length} labs</span>
          <span className="inline-flex items-center gap-1"><GraduationCap className="size-3.5" /> mock exams</span>
        </div>
      </Card>
    </Link>
  );
}
