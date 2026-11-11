"use client";
import { ArrowLeft, CheckCircle2, ChevronDown, Circle, Lightbulb, Target } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CodingLab } from "@/components/coding/CodingLab";
import { WrittenAnswer } from "@/components/practice/WrittenAnswer";
import { Badge, Button, Card, Eyebrow } from "@/components/ui";
import { getLab } from "@/courses";
import { askBuddy, setMood, useBuddyPage } from "@/lib/buddy";
import type { Exercise, Variation } from "@/lib/content/schema";
import type { Derived, LabDef, Section, Task, Value, Values } from "@/lib/lab/types";
import { logActivity, touchLast, updateModule, useCourseProgress } from "@/lib/progress";
import { cn, parseNumber, withinTolerance } from "@/lib/utils";
import { Blocks } from "./Blocks";
import { ChallengeCard } from "./ChallengeCard";
import { Controls } from "./Controls";

interface Props {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  moduleId: string;
  moduleTitle: string;
  labTitle: string;
  variations: Variation[];
  exercises: Exercise[];
}

const initialValues = (lab?: LabDef): Values =>
  Object.fromEntries((lab?.sections ?? []).flatMap((s) => s.controls.map((c) => [c.id, c.default as Value])));

export function LabRunner(props: Props) {
  const { courseId, moduleId } = props;
  const lab = getLab(courseId, moduleId);
  const [values, setValues] = useState<Values>(() => initialValues(lab));
  const [reported, setReported] = useState<Derived>({});
  // Goals only count once the student has actually done something (not on first render).
  const [touched, setTouched] = useState(false);
  const reports = useRef(0);
  const done = useCourseProgress(courseId).modules[moduleId]?.lab?.tasks ?? {};

  useEffect(() => touchLast(courseId, moduleId, "labs"), [courseId, moduleId]);

  const derived: Derived = useMemo(() => {
    const out: Derived = { ...reported };
    for (const s of lab?.sections ?? []) Object.assign(out, s.derive?.(values) ?? {});
    return out;
  }, [lab, values, reported]);

  const set = useCallback((id: string, v: Value) => {
    setTouched(true);
    setValues((prev) => ({ ...prev, [id]: v }));
  }, []);
  const report = useCallback((d: Derived) => {
    setReported((prev) => {
      const next = { ...prev, ...d };
      if (JSON.stringify(next) === JSON.stringify(prev)) return prev;
      if (reports.current++ >= (lab?.sections.filter((s) => s.Visual).length ?? 0)) setTouched(true);
      return next;
    });
  }, [lab]);

  const complete = useCallback(
    (taskId: string) => {
      if (done[taskId]) return;
      updateModule(courseId, moduleId, (m) => ({ ...m, lab: { ...m.lab, tasks: { ...(m.lab?.tasks ?? {}), [taskId]: true } } }));
      logActivity(2);
      setMood("happy");
    },
    [courseId, moduleId, done],
  );

  // Goals tick themselves off as soon as the simulator reaches them.
  useEffect(() => {
    if (!touched) return;
    for (const t of lab?.tasks ?? []) {
      if (t.kind === "goal" && !done[t.id]) {
        try {
          if (t.check(values, derived)) complete(t.id);
        } catch {
          /* a goal shouldn't crash the lab */
        }
      }
    }
  }, [lab, values, derived, done, complete, touched]);

  const labState = useMemo(() => {
    const flat: Record<string, number | string> = {};
    for (const [k, v] of Object.entries({ ...values, ...derived })) {
      flat[k] = typeof v === "number" ? Math.round(v * 10000) / 10000 : String(v);
    }
    return flat;
  }, [values, derived]);

  const tasks = lab?.tasks ?? [];
  const predicts = tasks.filter((t) => t.kind === "predict");
  const goals = tasks.filter((t) => t.kind === "goal");
  const explains = tasks.filter((t) => t.kind === "explain");
  const nextGoal = goals.find((g) => !done[g.id]);

  useBuddyPage({
    courseId,
    courseLabel: `${props.courseCode} ${props.courseTitle}`,
    moduleId,
    moduleTitle: props.moduleTitle,
    context: { view: "lab", lab_title: props.labTitle, lab_state: labState, task: nextGoal?.prompt },
  });

  const codeDone = useCourseProgress(courseId).modules[moduleId]?.code ?? {};
  const doneCount = tasks.filter((t) => done[t.id]).length;

  return (
    <div className="space-y-8">
      <header>
        <Link href={`/${courseId}/learn/${moduleId}/`} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" /> {props.moduleTitle}
        </Link>
        <Eyebrow className="mt-3">{props.courseCode} · Lab</Eyebrow>
        <h1 className="mt-1 font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{props.labTitle}</h1>
        {lab && <p className="mt-2 max-w-3xl text-ink-2">{lab.intro}</p>}
        {(tasks.length > 0 || props.exercises.length > 0) && (
          <ol className="mt-5 flex flex-wrap gap-2">
            {(
              [
                ["predict", "1 · Predict", predicts],
                ["experiment", "2 · Experiment", goals],
                ["explain", "3 · Explain", explains],
                ...(props.exercises.length ? [["code", "4 · Code it", []]] : []),
                ["challenge", props.exercises.length ? "5 · Challenge" : "4 · Challenge", []],
              ] as [string, string, Task[]][]
            )
              .filter(([id, , list]) => list.length > 0 || id === "challenge" || id === "code" || (id === "experiment" && !!lab))
              .map(([id, label, list]) => (
              <li key={id}>
                <a href={`#${id}`} className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1.5 text-[13px] font-semibold">
                  {label}
                  {list.length > 0 && (
                    <span className={cn("font-mono text-xs", list.every((t) => done[t.id]) ? "text-good" : "text-muted")}>
                      {list.filter((t) => done[t.id]).length}/{list.length}
                    </span>
                  )}
                  {id === "code" && (
                    <span className={cn("font-mono text-xs", props.exercises.every((e) => codeDone[e.id]) ? "text-good" : "text-muted")}>
                      {props.exercises.filter((e) => codeDone[e.id]).length}/{props.exercises.length}
                    </span>
                  )}
                </a>
              </li>
            ))}
            {tasks.length > 0 && (
              <li className="ml-auto self-center text-sm text-muted">
                {doneCount}/{tasks.length} tasks done
              </li>
            )}
          </ol>
        )}
      </header>

      {predicts.length > 0 && (
        <Stage id="predict" title="Predict first" blurb="Commit to a guess before you touch anything. Being wrong here is how it sticks.">
          <div className="grid gap-4 md:grid-cols-2">
            {predicts.map((t) => t.kind === "predict" && <Predict key={t.id} task={t} done={!!done[t.id]} onDone={() => complete(t.id)} />)}
          </div>
        </Stage>
      )}

      {lab && (
        <Stage id="experiment" title="Experiment" blurb="Move the controls and watch the outputs. Goals tick off automatically when you reach them.">
          <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
            <div className="space-y-5">
              {lab.sections.map((s) => (
                <SectionCard key={s.id} section={s} values={values} derived={derived} set={set} report={report} />
              ))}
            </div>
            {goals.length > 0 && (
              <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Target className="size-4 text-accent" /> Goals
                  </div>
                  <ul className="mt-3 space-y-3">
                    {goals.map((g) => (
                      <Goal key={g.id} task={g} done={!!done[g.id]} />
                    ))}
                  </ul>
                </Card>
                <Button variant="soft" className="w-full" onClick={() => askBuddy("Look at my lab settings right now — what should I notice, and what should I try next?", "chat")}>
                  What am I looking at?
                </Button>
              </aside>
            )}
          </div>
        </Stage>
      )}

      {explains.length > 0 && (
        <Stage id="explain" title="Explain it" blurb="Put what you saw into words. This is what the exam will ask you to do.">
          {explains.map(
            (t) =>
              t.kind === "explain" && (
                <Card key={t.id} className="p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-lg leading-snug font-medium">{t.prompt}</p>
                    {done[t.id] && <Badge tone="good">Done</Badge>}
                  </div>
                  <div className="mt-3">
                    <WrittenAnswer
                      draftKey={`${courseId}/${moduleId}/lab/${t.id}`}
                      courseId={courseId}
                      moduleId={moduleId}
                      question={t.prompt}
                      keywords={t.keywords}
                      idealAnswer={t.idealAnswer}
                      kind="lab"
                      onGraded={(r) => r.score >= 50 && complete(t.id)}
                    />
                  </div>
                </Card>
              ),
          )}
        </Stage>
      )}

      {props.exercises.length > 0 && (
        <Stage id="code" title="Code it" blurb="Write real code against real data. Python and SQL run right here in your browser and hidden tests check your work; the AI reviews it like an examiner.">
          <CodingLab courseId={courseId} moduleId={moduleId} exercises={props.exercises} />
        </Stage>
      )}

      <Stage id="challenge" title="Challenge" blurb="Fixed variations, a new problem every day, and unlimited AI challenges built from your current settings.">
        <ChallengeCard courseId={courseId} moduleId={moduleId} variations={props.variations} daily={lab?.daily} labState={labState} />
      </Stage>
    </div>
  );
}

function Stage({ id, title, blurb, children }: { id: string; title: string; blurb: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <p className="mt-1 mb-4 text-sm text-ink-2">{blurb}</p>
      {children}
    </section>
  );
}

function SectionCard({
  section: s,
  values,
  derived,
  set,
  report,
}: {
  section: Section;
  values: Values;
  derived: Derived;
  set: (id: string, v: Value) => void;
  report: (d: Derived) => void;
}) {
  const [showCode, setShowCode] = useState(false);
  let blocks;
  try {
    blocks = s.view(values, derived);
  } catch (err) {
    console.error(err);
    blocks = [{ kind: "note" as const, text: "These inputs don't make sense together — try different values.", tone: "warn" as const }];
  }
  return (
    <Card className="p-5 sm:p-6">
      <h3 className="font-display text-lg font-semibold">{s.title}</h3>
      {s.blurb && <p className="mt-1 text-sm text-ink-2">{s.blurb}</p>}
      {s.presets && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {s.presets.map((p) => (
            <button
              key={p.label}
              onClick={() => Object.entries(p.values).forEach(([k, v]) => set(k, v))}
              className="rounded-full border border-line-2 px-3 py-1 text-xs font-semibold text-ink-2 hover:border-accent hover:text-accent"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      {s.controls.length > 0 && (
        <div className="mt-4">
          <Controls controls={s.controls} values={values} set={set} />
        </div>
      )}
      {s.Visual && (
        <div className="mt-4">
          <s.Visual values={values} derived={derived} set={set} report={report} />
        </div>
      )}
      <div className="mt-4">
        <Blocks blocks={blocks} />
      </div>
      {s.code && (
        <div className="mt-3">
          <button onClick={() => setShowCode((c) => !c)} className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink">
            <ChevronDown className={cn("size-3.5 transition", showCode && "rotate-180")} /> The code behind this
          </button>
          {showCode && <pre className="mt-2 overflow-x-auto rounded-xl bg-[#1b1814] p-3.5 font-mono text-[12.5px] leading-relaxed text-[#efe6d6]">{s.code}</pre>}
        </div>
      )}
    </Card>
  );
}

function Goal({ task, done }: { task: Extract<Task, { kind: "goal" }>; done: boolean }) {
  const [hint, setHint] = useState(false);
  return (
    <li className="text-sm">
      <div className="flex gap-2">
        {done ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-good" /> : <Circle className="mt-0.5 size-4 shrink-0 text-line-2" />}
        <span className={cn(done && "text-muted line-through")}>{task.prompt}</span>
      </div>
      {!done && (
        <button onClick={() => setHint((h) => !h)} className="mt-1 ml-6 inline-flex items-center gap-1 text-xs font-semibold text-accent">
          <Lightbulb className="size-3" /> {hint ? task.hint : "Hint"}
        </button>
      )}
    </li>
  );
}

function Predict({ task, done, onDone }: { task: Extract<Task, { kind: "predict" }>; done: boolean; onDone: () => void }) {
  const [guess, setGuess] = useState("");
  const [revealed, setRevealed] = useState(done);
  const value = parseNumber(guess);
  const right = withinTolerance(value, task.answer, task.tolerance ?? Math.abs(task.answer) * 0.02);
  return (
    <Card className="p-5">
      <p className="font-medium">{task.prompt}</p>
      {!revealed ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            inputMode="decimal"
            placeholder={`Your guess${task.unit ? ` (${task.unit})` : ""}`}
            className="w-40 rounded-xl border border-line-2 bg-paper px-3 py-2 font-mono text-sm outline-none focus:border-accent"
          />
          <Button
            variant="ink"
            size="sm"
            disabled={!guess.trim()}
            onClick={() => {
              setRevealed(true);
              onDone();
              setMood(right ? "happy" : "oops");
            }}
          >
            Lock it in
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-2 text-sm">
          {guess && (
            <p className={cn("font-semibold", right ? "text-good" : "text-warn")}>
              {right ? "Spot on!" : `You said ${guess}.`} The answer is {task.answer}
              {task.unit ? ` ${task.unit}` : ""}.
            </p>
          )}
          <p className="text-ink-2">{task.explain}</p>
        </div>
      )}
    </Card>
  );
}
