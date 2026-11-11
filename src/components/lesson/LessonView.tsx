"use client";
import { AlertTriangle, ArrowLeft, ArrowRight, Clock, FlaskConical, Lightbulb, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BuddyAvatar } from "@/components/buddy/BuddyAvatar";
import { WrittenAnswer } from "@/components/practice/WrittenAnswer";
import { Badge, ButtonLink, Card, Eyebrow, ProgressRing } from "@/components/ui";
import { getLab, getScene, labShapes } from "@/courses";
import { askBuddy, useBuddyPage } from "@/lib/buddy";
import type { CourseOutline, Module } from "@/lib/content/schema";
import { logActivity, touchLast, updateModule, useCourseProgress, useMastery } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { Flashcards } from "./Flashcards";
import { Notes } from "./Notes";
import { PracticeQuestions } from "./PracticeQuestions";
import { QuickCheck } from "./QuickCheck";
import { ScenePlayer } from "./ScenePlayer";
import { Videos } from "./Videos";
import { WorkedExamples } from "./WorkedExamples";

export function LessonView({ course, module: m, index }: { course: CourseOutline; module: Module; index: number }) {
  const progress = useCourseProgress(course.id);
  const mp = progress.modules[m.id];
  const { per } = useMastery(course.id, course.modules, labShapes(course.id));
  const [step, setStep] = useState(0);
  const [gateArmed, setGateArmed] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const checkpointRef = useRef<HTMLDivElement>(null);
  const passed = !!mp?.checkpoint?.passed;
  const scene = getScene(course.id, m.id);
  const lab = getLab(course.id, m.id);
  const prev = course.modules[index - 1];
  const next = course.modules[index + 1];
  const minutes = estimateMinutes(m);

  useEffect(() => {
    touchLast(course.id, m.id, "learn");
    setStep(0);
    setGateArmed(false);
    setSkipped(false);
  }, [course.id, m.id]);

  const onStep = useCallback(
    (i: number) => {
      setStep(i);
      if (i + 1 > (mp?.stepsSeen ?? 0)) {
        updateModule(course.id, m.id, (x) => ({ ...x, stepsSeen: Math.max(x.stepsSeen ?? 0, i + 1) }));
        if (i === m.lesson.steps.length - 1) logActivity();
      }
    },
    [course.id, m.id, m.lesson.steps.length, mp?.stepsSeen],
  );

  const onGate = useCallback(() => {
    setGateArmed(true);
    checkpointRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  useBuddyPage({
    courseId: course.id,
    courseLabel: `${course.code} ${course.title}`,
    moduleId: m.id,
    moduleTitle: m.title,
    context: { view: "lesson", step: m.lesson.steps[step] },
    fallback: m.recap || m.checkpoint?.idealAnswer,
  });

  const sections = useMemo(
    () =>
      [
        ["lesson", "Lesson"],
        m.recap && ["recap", "In one minute"],
        m.notes.length && ["notes", "Notes"],
        m.examples.length && ["examples", "Worked examples"],
        m.terms.length && ["terms", "Key terms"],
        m.quiz.length && ["quiz", "Quick check"],
        m.questions.length && ["practice", "Exam practice"],
        ["videos", "Videos"],
        m.lab && ["lab", m.coding.length ? "Lab & code" : "Lab"],
      ].filter(Boolean) as [string, string][],
    [m],
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Eyebrow>
            <Link href={`/${course.id}/`} className="hover:underline">
              {course.code}
            </Link>{" "}
            · Module {index + 1} of {course.modules.length}
          </Eyebrow>
          <h1 className="mt-1.5 font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{m.title}</h1>
          <p className="mt-1.5 text-ink-2">{m.subtitle}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> ~{minutes} min to study properly
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ProgressRing value={per[m.id] ?? 0} size={52} />
          {m.lab && (
            <ButtonLink href={`/${course.id}/labs/${m.id}/`} variant="outline">
              <FlaskConical className="size-4" /> Open lab
            </ButtonLink>
          )}
        </div>
      </header>

      <nav className="no-print sticky top-16 z-20 -mx-4 overflow-x-auto border-y border-line bg-paper/90 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-full sm:border sm:px-2">
        <ul className="flex gap-1">
          {sections.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="block rounded-full px-3 py-1 text-[13px] font-medium whitespace-nowrap text-ink-2 hover:bg-card hover:text-ink">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="lesson" className="space-y-4">
        <ScenePlayer
          scene={scene}
          steps={m.lesson.steps}
          step={step}
          onStep={onStep}
          gateStep={m.checkpoint ? m.lesson.checkpointStep : -1}
          gateOpen={passed || skipped}
          onGate={onGate}
        />
        {m.checkpoint && (
          <div ref={checkpointRef}>
            <Card className={cn("p-5 transition sm:p-6", gateArmed && !passed && "border-accent ring-4 ring-accent/15")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Eyebrow>Checkpoint · the examiner asks</Eyebrow>
                {mp?.checkpoint && (
                  <Badge tone={mp.checkpoint.passed ? "good" : "warn"}>
                    Best {mp.checkpoint.best}% {mp.checkpoint.passed ? "· passed" : ""}
                  </Badge>
                )}
              </div>
              <p className="mt-2 font-display text-xl leading-snug font-medium">{m.checkpoint.question}</p>
              <div className="mt-4">
                <WrittenAnswer
                  draftKey={`${course.id}/${m.id}/checkpoint`}
                  courseId={course.id}
                  moduleId={m.id}
                  question={m.checkpoint.question}
                  keywords={m.checkpoint.keywords}
                  idealAnswer={m.checkpoint.idealAnswer}
                  hint={m.checkpoint.hint}
                  onGraded={(r) => {
                    updateModule(course.id, m.id, (x) => ({
                      ...x,
                      checkpoint: { best: Math.max(x.checkpoint?.best ?? 0, r.score), passed: !!x.checkpoint?.passed || r.score >= 60 },
                    }));
                    if (r.score >= 60) setGateArmed(false);
                  }}
                />
              </div>
              {gateArmed && !passed && (
                <button
                  onClick={() => {
                    setGateArmed(false);
                    setSkipped(true);
                    onStep(Math.min(m.lesson.steps.length - 1, m.lesson.checkpointStep + 1));
                  }}
                  className="mt-3 text-sm font-semibold text-muted hover:text-ink"
                >
                  Skip for now and continue the lesson →
                </button>
              )}
            </Card>
          </div>
        )}
      </section>

      {m.recap && (
        <section id="recap" className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <Card className="bg-[color-mix(in_srgb,var(--hl)_22%,var(--card))] p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-accent" /> In one minute
            </div>
            <p className="mt-2 text-[15.5px] leading-relaxed">{m.recap}</p>
          </Card>
          {m.traps.length > 0 && (
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-bad">
                <AlertTriangle className="size-4" /> Traps examiners look for
              </div>
              <ul className="mt-2 space-y-2 text-[14.5px] text-ink-2">
                {m.traps.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-bad" />
                    {t}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      )}

      {m.notes.length > 0 && (
        <Section id="notes" eyebrow="Read" title="Study notes">
          <Notes courseId={course.id} moduleId={m.id} notes={m.notes} />
        </Section>
      )}

      {m.examples.length > 0 && (
        <Section id="examples" eyebrow="Watch it done" title="Worked examples">
          <WorkedExamples courseId={course.id} moduleId={m.id} examples={m.examples} />
        </Section>
      )}

      {m.terms.length > 0 && (
        <Section id="terms" eyebrow="Vocabulary" title="Key terms">
          <Flashcards terms={m.terms} />
          {m.fact && (
            <Card className="mt-4 flex gap-4 p-5">
              <Lightbulb className="mt-0.5 size-5 shrink-0 text-accent" />
              <div>
                <p className="font-semibold">{m.fact.title}</p>
                <p className="mt-1 text-sm text-ink-2">{m.fact.body}</p>
              </div>
            </Card>
          )}
        </Section>
      )}

      {m.quiz.length > 0 && (
        <Section id="quiz" eyebrow="Practise" title="Quick check">
          <QuickCheck courseId={course.id} moduleId={m.id} quiz={m.quiz} />
        </Section>
      )}

      {m.questions.length > 0 && (
        <Section id="practice" eyebrow="Exam-style" title="Written practice">
          <PracticeQuestions courseId={course.id} moduleId={m.id} questions={m.questions} />
        </Section>
      )}

      <Section id="videos" eyebrow="Watch" title="Videos">
        <Videos courseId={course.id} moduleId={m.id} pinned={m.videos} />
      </Section>

      {m.lab && (
        <section id="lab">
          <Card className="flex flex-wrap items-center gap-5 p-6">
            <BuddyAvatar size={52} mood="wave" />
            <div className="min-w-0 flex-1">
              <Eyebrow>Hands-on</Eyebrow>
              <h2 className="mt-1 font-display text-xl font-semibold">{m.lab.title}</h2>
              <p className="mt-1 text-sm text-ink-2">
                {lab ? `${lab.tasks.length} guided tasks: predict, experiment, explain — then challenge yourself.` : "Numeric challenges with daily variations."}
                {m.coding.length > 0 && ` Plus ${m.coding.length} coding exercise${m.coding.length > 1 ? "s" : ""} you run right in the browser.`}
              </p>
            </div>
            <ButtonLink variant="primary" href={`/${course.id}/labs/${m.id}/`}>
              Start the lab <ArrowRight className="size-4" />
            </ButtonLink>
          </Card>
        </section>
      )}

      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        {prev ? (
          <Link href={`/${course.id}/learn/${prev.id}/`} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-2 hover:text-ink">
            <ArrowLeft className="size-4" /> {prev.title}
          </Link>
        ) : (
          <span />
        )}
        <button
          onClick={() => askBuddy(`Before I move on from "${m.title}", quiz me on the three things I'm most likely to be examined on.`, "quiz")}
          className="text-sm font-semibold text-accent hover:underline"
        >
          Am I ready to move on?
        </button>
        {next ? (
          <Link href={`/${course.id}/learn/${next.id}/`} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-2 hover:text-ink">
            {next.title} <ArrowRight className="size-4" />
          </Link>
        ) : (
          <Link href={`/${course.id}/exam/`} className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
            Take the mock exam <ArrowRight className="size-4" />
          </Link>
        )}
      </Card>
    </div>
  );
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-1 mb-4 font-display text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function estimateMinutes(m: Module) {
  const words = [m.recap, ...m.lesson.steps, ...m.notes.map((n) => n.body), ...m.examples.flatMap((e) => [e.problem, ...e.steps])].join(" ").split(/\s+/).length;
  return Math.round(words / 160 + m.quiz.length * 1 + m.questions.length * 6 + (m.checkpoint ? 5 : 0) + (m.lab ? 20 : 0));
}
