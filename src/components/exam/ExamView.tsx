"use client";
import { Clock, GraduationCap, Mic, ScrollText, Sparkles, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EvaluationView } from "@/components/practice/EvaluationView";
import { Badge, Bar, Button, ButtonLink, Card, Eyebrow, Spinner } from "@/components/ui";
import { MathText, Rich } from "@/components/ui/Markdown";
import { api, type Evaluation } from "@/lib/api";
import { askBuddy, useBuddyPage } from "@/lib/buddy";
import type { ExamBank } from "@/lib/content/server";
import { gradeAnswer } from "@/lib/grading";
import { type ExamResult, logActivity, updateCourse, useCourseProgress } from "@/lib/progress";
import { cn, parseNumber, withinTolerance } from "@/lib/utils";

type Q =
  | { kind: "mcq"; module: string; question: string; options: string[]; answer: number; explanation: string }
  | { kind: "numeric"; module: string; question: string; answer: number; tolerance: number; explanation: string; unit: string }
  | { kind: "written"; module: string; question: string; keywords: string[]; idealAnswer: string; marks: number; ai?: boolean };

interface Attempt {
  response: string;
  score?: number; // 0–100
  evaluation?: Evaluation;
}

const shuffle = <T,>(xs: T[]) => xs.map((x) => [Math.random(), x] as const).sort((a, b) => a[0] - b[0]).map(([, x]) => x);

export function ExamView({ bank }: { bank: ExamBank }) {
  const [phase, setPhase] = useState<"setup" | "run" | "report">("setup");
  const [mode, setMode] = useState<"oral" | "paper">("paper");
  const [topics, setTopics] = useState<string[]>(bank.modules.map((m) => m.id));
  const [questions, setQuestions] = useState<Q[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [deadline, setDeadline] = useState(0);
  const progress = useCourseProgress(bank.courseId);
  const moduleTitle = (id: string) => bank.modules.find((m) => m.id === id)?.title ?? id;

  useBuddyPage({ courseId: bank.courseId, courseLabel: `${bank.code} ${bank.title}`, context: { view: "exam" } });

  const start = () => {
    const inScope = <T extends { module: string }>(xs: T[]) => xs.filter((x) => topics.includes(x.module));
    let qs: Q[];
    if (mode === "oral") {
      qs = shuffle(inScope(bank.written)).slice(0, 6).map((w) => ({ kind: "written" as const, module: w.module, question: w.prompt, keywords: w.keywords, idealAnswer: w.idealAnswer, marks: w.marks }));
    } else {
      const mcq = shuffle(inScope(bank.mcq)).slice(0, 8).map((q) => ({ kind: "mcq" as const, module: q.module, question: q.question, options: q.options, answer: q.answer, explanation: q.explanation }));
      const num = shuffle(inScope(bank.numeric)).slice(0, 4).map((v) => ({ kind: "numeric" as const, module: v.module, question: v.question, answer: v.answer, tolerance: v.tolerance, explanation: v.explanation, unit: v.unit }));
      const wr = shuffle(inScope(bank.written)).slice(0, 3).map((w) => ({ kind: "written" as const, module: w.module, question: w.prompt, keywords: w.keywords, idealAnswer: w.idealAnswer, marks: w.marks }));
      qs = [...mcq, ...num, ...wr];
    }
    setQuestions(qs);
    setAttempts(qs.map(() => ({ response: "" })));
    setDeadline(Date.now() + (mode === "oral" ? bank.durationMinutes : 30) * 60_000);
    setPhase("run");
    window.scrollTo({ top: 0 });
  };

  const finish = async (graded: Attempt[]) => {
    setAttempts(graded);
    const byModule: Record<string, number[]> = {};
    questions.forEach((q, i) => (byModule[q.module] ??= []).push(graded[i].score ?? 0));
    const result: ExamResult = {
      at: new Date().toISOString(),
      mode,
      score: Math.round(graded.reduce((a, b) => a + (b.score ?? 0), 0) / Math.max(1, graded.length)),
      byModule: Object.fromEntries(Object.entries(byModule).map(([k, v]) => [k, Math.round(v.reduce((a, b) => a + b, 0) / v.length)])),
    };
    updateCourse(bank.courseId, (p) => ({ ...p, exams: [...p.exams, result].slice(-20) }));
    logActivity(5);
    setPhase("report");
    window.scrollTo({ top: 0 });
  };

  if (phase === "run")
    return mode === "oral" ? (
      <OralRun bank={bank} questions={questions} setQuestions={setQuestions} attempts={attempts} setAttempts={setAttempts} deadline={deadline} onFinish={finish} moduleTitle={moduleTitle} />
    ) : (
      <PaperRun bank={bank} questions={questions} attempts={attempts} setAttempts={setAttempts} deadline={deadline} onFinish={finish} moduleTitle={moduleTitle} />
    );
  if (phase === "report") return <Report bank={bank} questions={questions} attempts={attempts} onAgain={() => setPhase("setup")} moduleTitle={moduleTitle} />;

  const history = progress.exams.slice(-5).reverse();
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>{bank.code} · Mock exam</Eyebrow>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">Prove it under exam conditions</h1>
        <p className="mt-2 max-w-2xl text-ink-2">Timed, mixed and graded the way your examiner grades. At the end you get a report of exactly which topics to fix.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {(
          [
            ["paper", ScrollText, "Mixed paper · 30 min", "8 multiple-choice, 4 numeric problems and 3 written answers — like a real paper."],
            ["oral", Mic, `Oral exam · ${bank.durationMinutes} min`, "One examiner, six spoken questions. Answer out loud first, then type what you said."],
          ] as const
        ).map(([id, Icon, title, desc]) => (
          <button key={id} onClick={() => setMode(id)} className="text-left">
            <Card className={cn("h-full p-5 transition", mode === id ? "border-accent ring-4 ring-accent/15" : "hover:border-line-2")}>
              <Icon className="size-6 text-accent" />
              <h2 className="mt-3 font-display text-xl font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-ink-2">{desc}</p>
            </Card>
          </button>
        ))}
      </div>
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Topics</h2>
          <div className="flex gap-2 text-sm">
            <button className="font-semibold text-accent" onClick={() => setTopics(bank.modules.map((m) => m.id))}>All</button>
            <button className="font-semibold text-muted" onClick={() => setTopics([])}>None</button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {bank.modules.map((m) => (
            <button
              key={m.id}
              onClick={() => setTopics((t) => (t.includes(m.id) ? t.filter((x) => x !== m.id) : [...t, m.id]))}
              className={cn("rounded-full border px-3 py-1.5 text-[13px] font-medium", topics.includes(m.id) ? "border-accent bg-accent/10 text-ink" : "border-line text-muted")}
            >
              {m.title}
            </button>
          ))}
        </div>
      </Card>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" size="lg" onClick={start} disabled={!topics.length}>
          <GraduationCap className="size-5" /> Start the exam
        </Button>
        <span className="text-sm text-muted">The clock starts immediately.</span>
      </div>
      {history.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold">Recent attempts</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {history.map((h) => (
              <li key={h.at} className="flex items-center gap-3">
                <span className="w-36 text-muted">{new Date(h.at).toLocaleDateString()} · {h.mode}</span>
                <Bar value={h.score} className="flex-1" tone={h.score >= 70 ? "good" : h.score >= 50 ? "warn" : "bad"} />
                <span className="w-10 text-right font-mono font-semibold">{h.score}%</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function useCountdown(deadline: number, onEnd: () => void) {
  const [left, setLeft] = useState(Math.max(0, deadline - Date.now()));
  useEffect(() => {
    const id = setInterval(() => {
      const l = Math.max(0, deadline - Date.now());
      setLeft(l);
      if (l === 0) {
        clearInterval(id);
        onEnd();
      }
    }, 500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);
  const s = Math.ceil(left / 1000);
  return { label: `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`, warn: s <= 120 };
}

function Timer({ label, warn }: { label: string; warn: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 font-mono text-lg font-semibold", warn && "border-bad/40 text-bad")}>
      <Clock className="size-4" /> {label}
    </span>
  );
}

async function gradeAll(bank: ExamBank, questions: Q[], attempts: Attempt[]): Promise<Attempt[]> {
  const out = attempts.map((a) => ({ ...a }));
  const written: number[] = [];
  questions.forEach((q, i) => {
    if (q.kind === "mcq") out[i].score = Number(out[i].response) === q.answer && out[i].response !== "" ? 100 : 0;
    else if (q.kind === "numeric") out[i].score = withinTolerance(parseNumber(out[i].response), q.answer, q.tolerance) ? 100 : 0;
    else if (out[i].evaluation) out[i].score = out[i].evaluation!.score;
    else if (!out[i].response.trim()) out[i].score = 0;
    else written.push(i);
  });
  // Grade written answers three at a time.
  for (let k = 0; k < written.length; k += 3) {
    await Promise.all(
      written.slice(k, k + 3).map(async (i) => {
        const q = questions[i] as Extract<Q, { kind: "written" }>;
        const ev = await gradeAnswer({ courseId: bank.courseId, moduleId: q.module, question: q.question, answer: out[i].response, keywords: q.keywords, idealAnswer: q.idealAnswer, kind: "written" });
        out[i] = { ...out[i], evaluation: ev, score: ev.score };
      }),
    );
  }
  return out;
}

function PaperRun({
  bank,
  questions,
  attempts,
  setAttempts,
  deadline,
  onFinish,
  moduleTitle,
}: {
  bank: ExamBank;
  questions: Q[];
  attempts: Attempt[];
  setAttempts: (a: Attempt[]) => void;
  deadline: number;
  onFinish: (a: Attempt[]) => void;
  moduleTitle: (id: string) => string;
}) {
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    onFinish(await gradeAll(bank, questions, attempts));
  };
  const timer = useCountdown(deadline, () => void submit());
  const set = (i: number, response: string) => setAttempts(attempts.map((a, j) => (j === i ? { ...a, response } : a)));
  const answered = attempts.filter((a) => a.response.trim() !== "").length;
  const sections: [string, Q["kind"]][] = [
    ["Section A — Multiple choice", "mcq"],
    ["Section B — Problems", "numeric"],
    ["Section C — Written answers", "written"],
  ];
  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-20 -mx-4 flex items-center justify-between gap-3 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur sm:mx-0">
        <div>
          <div className="text-xs font-semibold text-muted uppercase">{bank.code} · Mixed paper</div>
          <div className="text-sm">{answered}/{questions.length} answered</div>
        </div>
        <Timer {...timer} />
        <Button variant="primary" onClick={submit} disabled={busy}>
          {busy ? <><Spinner /> Marking…</> : "Submit paper"}
        </Button>
      </div>
      {sections.map(([title, kind]) => {
        const idx = questions.map((q, i) => (q.kind === kind ? i : -1)).filter((i) => i >= 0);
        if (!idx.length) return null;
        return (
          <section key={kind} className="space-y-3">
            <h2 className="font-display text-xl font-semibold">{title}</h2>
            {idx.map((i, n) => {
              const q = questions[i];
              return (
                <Card key={i} className="p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <b className="font-mono text-accent">Q{n + 1}</b> {moduleTitle(q.module)}
                    {q.kind === "written" && <Badge>{q.marks} marks</Badge>}
                  </div>
                  <p className="font-medium">
                    <Rich html={q.question} />
                  </p>
                  {q.kind === "mcq" && (
                    <div className="mt-3 grid gap-2">
                      {q.options.map((o, oi) => (
                        <label key={o} className={cn("flex cursor-pointer gap-3 rounded-xl border px-4 py-2.5 text-[14.5px]", attempts[i].response === String(oi) ? "border-accent bg-accent/5" : "border-line")}>
                          <input type="radio" name={`q${i}`} checked={attempts[i].response === String(oi)} onChange={() => set(i, String(oi))} className="accent-[var(--accent)]" />
                          {o}
                        </label>
                      ))}
                    </div>
                  )}
                  {q.kind === "numeric" && (
                    <input
                      value={attempts[i].response}
                      onChange={(e) => set(i, e.target.value)}
                      inputMode="decimal"
                      placeholder={q.unit ? `Answer (${q.unit})` : "Answer"}
                      className="mt-3 w-52 rounded-xl border border-line-2 bg-paper px-3 py-2 font-mono text-sm outline-none focus:border-accent"
                    />
                  )}
                  {q.kind === "written" && (
                    <textarea
                      value={attempts[i].response}
                      onChange={(e) => set(i, e.target.value)}
                      rows={6}
                      placeholder="Claim → mechanism → trade-off. Use the course's terms."
                      className="mt-3 w-full rounded-2xl border border-line-2 bg-paper p-4 text-[15px] outline-none focus:border-accent"
                    />
                  )}
                </Card>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(text.replace(/<[^>]+>|`/g, "")));
}

function OralRun({
  bank,
  questions,
  setQuestions,
  attempts,
  setAttempts,
  deadline,
  onFinish,
  moduleTitle,
}: {
  bank: ExamBank;
  questions: Q[];
  setQuestions: (q: Q[]) => void;
  attempts: Attempt[];
  setAttempts: (a: Attempt[]) => void;
  deadline: number;
  onFinish: (a: Attempt[]) => void;
  moduleTitle: (id: string) => string;
}) {
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const end = async () => onFinish(await gradeAll(bank, questions, attempts));
  const timer = useCountdown(deadline, () => void end());
  const q = questions[i] as Extract<Q, { kind: "written" }>;
  useEffect(() => speak(q.question), [q.question]);

  const grade = async () => {
    setBusy(true);
    const ev = await gradeAnswer({ courseId: bank.courseId, moduleId: q.module, question: q.question, answer: attempts[i].response, keywords: q.keywords, idealAnswer: q.idealAnswer, kind: "oral" });
    setAttempts(attempts.map((a, j) => (j === i ? { ...a, evaluation: ev, score: ev.score } : a)));
    setBusy(false);
  };
  const fresh = async () => {
    setGenBusy(true);
    try {
      const r = await api.question({ course_id: bank.courseId, module_id: q.module, difficulty: "tricky", avoid: questions.map((x) => x.question) });
      setQuestions([...questions, { kind: "written", module: r.module_id ?? q.module, question: r.question, keywords: r.keywords, idealAnswer: r.ideal_answer, marks: 10, ai: r.source === "gemini" }]);
      setAttempts([...attempts, { response: "" }]);
      setI(questions.length);
    } finally {
      setGenBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {questions.map((_, k) => (
            <button key={k} onClick={() => setI(k)} className={cn("size-8 rounded-lg border font-mono text-xs font-semibold", k === i ? "border-accent text-accent" : attempts[k].score != null ? "border-good bg-good-bg text-good" : "border-line text-muted")}>
              {k + 1}
            </button>
          ))}
        </div>
        <Timer {...timer} />
      </div>
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-full bg-ink font-display font-semibold text-paper">Ex</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <span>
                Question {i + 1} · {moduleTitle(q.module)} {q.ai && <Badge tone="accent"><Sparkles className="size-3" /> AI</Badge>}
              </span>
              <button onClick={() => speak(q.question)} className="inline-flex items-center gap-1 font-semibold hover:text-ink">
                <Volume2 className="size-3.5" /> Read aloud
              </button>
            </div>
            <p className="mt-2 font-display text-xl leading-snug font-medium">{q.question}</p>
          </div>
        </div>
        <textarea
          value={attempts[i].response}
          onChange={(e) => setAttempts(attempts.map((a, j) => (j === i ? { ...a, response: e.target.value } : a)))}
          rows={6}
          placeholder="Say it out loud first, then type what you said…"
          className="mt-5 w-full rounded-2xl border border-line-2 bg-paper p-4 text-[15px] outline-none focus:border-accent"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="primary" onClick={grade} disabled={busy || attempts[i].response.trim().split(/\s+/).length < 5}>
            {busy ? <><Spinner /> Examiner is reading…</> : "Submit answer"}
          </Button>
          <Button onClick={() => setI(Math.min(questions.length - 1, i + 1))} disabled={i === questions.length - 1}>
            Next question →
          </Button>
          <Button variant="soft" onClick={fresh} disabled={genBusy}>
            {genBusy ? <Spinner /> : <Sparkles className="size-4" />} Follow-up question
          </Button>
          <Button variant="ghost" onClick={end} className="ml-auto">
            Finish exam
          </Button>
        </div>
      </Card>
      {attempts[i].evaluation && <EvaluationView result={attempts[i].evaluation!} />}
    </div>
  );
}

function Report({ bank, questions, attempts, onAgain, moduleTitle }: { bank: ExamBank; questions: Q[]; attempts: Attempt[]; onAgain: () => void; moduleTitle: (id: string) => string }) {
  const total = Math.round(attempts.reduce((a, b) => a + (b.score ?? 0), 0) / Math.max(1, attempts.length));
  const byModule = useMemo(() => {
    const m: Record<string, number[]> = {};
    questions.forEach((q, i) => (m[q.module] ??= []).push(attempts[i].score ?? 0));
    return Object.entries(m)
      .map(([id, s]) => ({ id, score: Math.round(s.reduce((a, b) => a + b, 0) / s.length), n: s.length }))
      .sort((a, b) => a.score - b.score);
  }, [questions, attempts]);
  const weak = byModule.filter((m) => m.score < 60);
  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-6 p-6">
        <div className="grid size-28 place-items-center rounded-full" style={{ background: `conic-gradient(var(--accent) ${total * 3.6}deg, var(--line) 0)` }}>
          <span className="grid size-24 place-items-center rounded-full bg-card font-mono text-3xl font-bold">{total}%</span>
        </div>
        <div className="min-w-0 flex-1">
          <Eyebrow>{bank.code} · Result</Eyebrow>
          <h1 className="mt-1 font-display text-3xl font-semibold">{total >= 75 ? "Exam-ready on these topics 🎉" : total >= 50 ? "Solid — a few gaps to close" : "Good diagnostic — now we know what to fix"}</h1>
          <p className="mt-1 text-ink-2">{weak.length ? `Focus on ${weak.length} topic${weak.length > 1 ? "s" : ""} below, then retake.` : "No weak topics in this attempt."}</p>
        </div>
        <Button variant="primary" onClick={onAgain}>Take another</Button>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold">By topic</h2>
        <ul className="mt-3 space-y-3">
          {byModule.map((m) => (
            <li key={m.id} className="grid items-center gap-2 sm:grid-cols-[1fr_200px_auto]">
              <span className="text-sm font-medium">{moduleTitle(m.id)} <span className="text-muted">· {m.n}q</span></span>
              <Bar value={m.score} tone={m.score >= 70 ? "good" : m.score >= 50 ? "warn" : "bad"} />
              <span className="flex items-center gap-2">
                <span className="w-10 font-mono text-sm font-semibold">{m.score}%</span>
                {m.score < 60 && (
                  <>
                    <ButtonLink size="sm" href={`/${bank.courseId}/learn/${m.id}/`}>Revisit</ButtonLink>
                    <Button size="sm" variant="ghost" onClick={() => askBuddy(`I scored ${m.score}% on ${moduleTitle(m.id)} in a mock exam. Drill me on my weak spots there.`, "quiz")}>Drill me</Button>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Review every answer</h2>
        {questions.map((q, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium"><Rich html={q.question} /></p>
              <Badge tone={(attempts[i].score ?? 0) >= 60 ? "good" : "bad"}>{attempts[i].score ?? 0}%</Badge>
            </div>
            {q.kind === "mcq" && (
              <p className="mt-2 text-sm text-ink-2">
                Your answer: <b>{attempts[i].response === "" ? "—" : q.options[Number(attempts[i].response)]}</b> · Correct: <b>{q.options[q.answer]}</b>. <MathText>{q.explanation}</MathText>
              </p>
            )}
            {q.kind === "numeric" && (
              <p className="mt-2 text-sm text-ink-2">
                Your answer: <b className="font-mono">{attempts[i].response || "—"}</b> · Correct: <b className="font-mono">{q.answer}</b>. <Rich html={q.explanation} />
              </p>
            )}
            {q.kind === "written" && attempts[i].evaluation && <div className="mt-3"><EvaluationView result={attempts[i].evaluation!} /></div>}
            {q.kind === "written" && !attempts[i].evaluation && <p className="mt-2 text-sm text-muted">Not answered. Model answer: <MathText>{q.idealAnswer}</MathText></p>}
          </Card>
        ))}
      </section>
    </div>
  );
}
