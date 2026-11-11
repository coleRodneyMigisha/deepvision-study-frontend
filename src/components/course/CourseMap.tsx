"use client";
import { ArrowRight, BookOpen, CheckCircle2, FlaskConical, GraduationCap, ScrollText, Target } from "lucide-react";
import Link from "next/link";
import { BuddyAvatar } from "@/components/buddy/BuddyAvatar";
import { Badge, Bar, ButtonLink, Card, Eyebrow, ProgressRing } from "@/components/ui";
import { labShapes } from "@/courses";
import { askBuddy, useBuddyPage } from "@/lib/buddy";
import type { CourseOutline } from "@/lib/content/schema";
import { useCourseProgress, useMastery } from "@/lib/progress";
import { cn } from "@/lib/utils";

export function CourseMap({ course }: { course: CourseOutline }) {
  const progress = useCourseProgress(course.id);
  const labs = labShapes(course.id);
  const { per, overall } = useMastery(course.id, course.modules, labs);
  useBuddyPage({ courseId: course.id, courseLabel: `${course.code} ${course.title}`, context: { view: "course" } });

  const next = course.modules.find((m) => per[m.id] < 80) ?? course.modules[0];
  const weakest = [...course.modules].filter((m) => (progress.modules[m.id] ? true : false)).sort((a, b) => per[a.id] - per[b.id]).slice(0, 3);
  const lastExam = progress.exams[progress.exams.length - 1];

  return (
    <div className="space-y-8">
      <header className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <Eyebrow>{course.code} · {course.moduleCount} modules</Eyebrow>
          <h1 className="mt-2 font-display text-4xl leading-tight font-semibold tracking-tight">{course.title}</h1>
          <p className="mt-2 max-w-2xl text-lg text-ink-2">{course.tagline}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <ButtonLink variant="primary" size="lg" href={`/${course.id}/learn/${next.id}/`}>
              {overall > 0 ? "Continue" : "Start"}: {next.title.split(/[:(]/)[0]} <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink size="lg" href={`/${course.id}/exam/`}>
              <GraduationCap className="size-4" /> Mock exam
            </ButtonLink>
            <ButtonLink size="lg" variant="ghost" href={`/${course.id}/guide/`}>
              <ScrollText className="size-4" /> Revision guide
            </ButtonLink>
          </div>
        </div>
        <Card className="flex items-center gap-4 p-5">
          <ProgressRing value={overall} size={76} stroke={7} />
          <div>
            <div className="text-xs font-semibold tracking-wide text-muted uppercase">Exam readiness</div>
            <div className="mt-0.5 font-display text-2xl font-semibold">{readinessLabel(overall)}</div>
            {lastExam && <div className="mt-1 text-xs text-muted">Last mock: {lastExam.score}%</div>}
          </div>
        </Card>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ol className="relative space-y-3">
          <span className="absolute top-6 bottom-6 left-[27px] w-0.5 bg-line" aria-hidden />
          {course.modules.map((m, i) => {
            const mp = progress.modules[m.id];
            const mastery = per[m.id];
            const labTasks = labs[m.id]?.tasks ?? 0;
            return (
              <li key={m.id} className="relative">
                <Card className="flex gap-4 p-4 sm:p-5">
                  <div
                    className={cn(
                      "z-10 grid size-14 shrink-0 place-items-center rounded-2xl border-2 bg-card font-display text-xl font-semibold",
                      mastery >= 80 ? "border-good bg-good-bg text-good" : mastery > 0 ? "border-accent text-accent" : "border-line-2 text-muted",
                    )}
                  >
                    {mastery >= 80 ? <CheckCircle2 className="size-6" /> : i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-display text-lg leading-snug font-semibold">{m.title}</h3>
                        <p className="text-sm text-ink-2">{m.subtitle}</p>
                      </div>
                      <ProgressRing value={mastery} size={40} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge tone={(mp?.stepsSeen ?? 0) >= m.steps ? "good" : "neutral"}>
                        Lesson {Math.min(mp?.stepsSeen ?? 0, m.steps)}/{m.steps}
                      </Badge>
                      {m.notes > 0 && <Badge tone="neutral">{m.notes} note sections</Badge>}
                      {m.checkpoint && (
                        <Badge tone={mp?.checkpoint?.passed ? "good" : mp?.checkpoint ? "warn" : "neutral"}>
                          Checkpoint {mp?.checkpoint ? `${mp.checkpoint.best}%` : "—"}
                        </Badge>
                      )}
                      {m.quiz > 0 && (
                        <Badge tone="neutral">
                          Quiz {Object.values(mp?.quiz ?? {}).filter(Boolean).length}/{m.quiz}
                        </Badge>
                      )}
                      {m.coding > 0 && (
                        <Badge tone={Object.keys(mp?.code ?? {}).length >= m.coding ? "good" : "neutral"}>
                          Code {Object.keys(mp?.code ?? {}).length}/{m.coding}
                        </Badge>
                      )}
                      {labTasks > 0 && (
                        <Badge tone={Object.keys(mp?.lab?.tasks ?? {}).length >= labTasks ? "good" : "neutral"}>
                          Lab {Object.keys(mp?.lab?.tasks ?? {}).length}/{labTasks}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ButtonLink size="sm" variant="ink" href={`/${course.id}/learn/${m.id}/`}>
                        <BookOpen className="size-3.5" /> Learn
                      </ButtonLink>
                      {m.hasLab && (
                        <ButtonLink size="sm" href={`/${course.id}/labs/${m.id}/`}>
                          <FlaskConical className="size-3.5" /> Lab
                        </ButtonLink>
                      )}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Target className="size-4 text-accent" /> Focus next
            </div>
            {weakest.length ? (
              <ul className="mt-3 space-y-3">
                {weakest.map((m) => (
                  <li key={m.id}>
                    <Link href={`/${course.id}/learn/${m.id}/`} className="text-sm font-medium hover:text-accent">
                      {m.title}
                    </Link>
                    <Bar value={per[m.id]} className="mt-1.5" tone={per[m.id] < 40 ? "bad" : per[m.id] < 70 ? "warn" : "good"} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-2">Start any module — your weakest topics will show up here.</p>
            )}
          </Card>
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <BuddyAvatar size={40} />
              <div>
                <p className="text-sm font-semibold">Not sure where to begin?</p>
                <p className="mt-1 text-sm text-ink-2">I&apos;ll give you the big picture of the course in two minutes.</p>
                <button
                  onClick={() => askBuddy(`Give me the big picture of ${course.title}: how the modules connect and what examiners care about most.`, "explain")}
                  className="mt-3 text-sm font-semibold text-accent hover:underline"
                >
                  Give me the big picture →
                </button>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function readinessLabel(v: number) {
  if (v >= 85) return "Exam-ready";
  if (v >= 65) return "Nearly there";
  if (v >= 35) return "Building up";
  if (v > 0) return "Getting started";
  return "Not started";
}
