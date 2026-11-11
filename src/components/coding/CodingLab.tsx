"use client";
import { CheckCircle2, Circle, Database, Download, Eye, FileCode2, Lightbulb, MessageCircle, Play, RotateCcw, Sparkles, XCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Badge, Button, Card, Spinner } from "@/components/ui";
import { Markdown } from "@/components/ui/Markdown";
import { api, type CodeReview } from "@/lib/api";
import { askBuddy, setMood } from "@/lib/buddy";
import { type RunReport, runExercise } from "@/lib/coding/runner";
import type { Exercise } from "@/lib/content/schema";
import { logActivity, updateModule, useCourseProgress } from "@/lib/progress";
import { persistentStore, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const CodeEditor = dynamic(() => import("./CodeEditor"), {
  ssr: false,
  loading: () => <div className="h-[260px] animate-pulse rounded-2xl border border-line bg-sunk" />,
});

const drafts = persistentStore<Record<string, string>>("studyroom:v3:code", {});
const LANG = { python: { label: "Python", icon: FileCode2 }, sql: { label: "SQL · DuckDB", icon: Database }, review: { label: "Write & review", icon: MessageCircle } };

export function CodingLab({ courseId, moduleId, exercises }: { courseId: string; moduleId: string; exercises: Exercise[] }) {
  const passed = useCourseProgress(courseId).modules[moduleId]?.code ?? {};
  const [active, setActive] = useState(0);
  const ex = exercises[Math.min(active, exercises.length - 1)];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {exercises.map((e, i) => {
          const Icon = LANG[e.language].icon;
          return (
            <button
              key={e.id}
              onClick={() => setActive(i)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold",
                i === active ? "border-ink bg-ink text-paper" : "border-line-2 bg-card text-ink-2 hover:border-ink-2",
              )}
            >
              {passed[e.id] ? <CheckCircle2 className="size-3.5 text-good" /> : <Icon className="size-3.5" />}
              {e.title}
            </button>
          );
        })}
      </div>
      <ExerciseCard key={ex.id} ex={ex} courseId={courseId} moduleId={moduleId} done={!!passed[ex.id]} />
    </div>
  );
}

function ExerciseCard({ ex, courseId, moduleId, done }: { ex: Exercise; courseId: string; moduleId: string; done: boolean }) {
  const key = `${courseId}/${moduleId}/${ex.id}`;
  const code = useStore(drafts, {})[key] ?? ex.starter;
  const setCode = (v: string) => drafts.set((d) => ({ ...d, [key]: v }));
  const [status, setStatus] = useState("");
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<RunReport | null>(null);
  const [runError, setRunError] = useState("");
  const [review, setReview] = useState<CodeReview | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [hints, setHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const markDone = () => {
    if (done) return;
    updateModule(courseId, moduleId, (m) => ({ ...m, code: { ...(m.code ?? {}), [ex.id]: true } }));
    logActivity(3);
  };

  const run = async () => {
    if (ex.language === "review" || running) return;
    setRunning(true);
    setRunError("");
    setReport(null);
    setAttempts((a) => a + 1);
    try {
      const r = await runExercise(
        { language: ex.language, setup: ex.setup, code, tests: ex.tests, solution: ex.solution, compare: ex.compare },
        ex.files.map((name) => ({ name, url: `/content/courses/${courseId}/data/${name}` })),
        setStatus,
      );
      setReport(r);
      setMood(r.ok ? "happy" : "oops", 1500);
      if (r.ok) markDone();
      else logActivity();
    } catch (err) {
      setRunError((err as Error).message);
      setMood("oops");
    } finally {
      setRunning(false);
      setStatus("");
    }
  };

  const testSummary = report
    ? report.error
      ? `Error: ${report.error}`
      : report.tests.map((t) => `${t.passed ? "PASS" : "FAIL"} ${t.name}${t.message ? ` — ${t.message}` : ""}`).join("\n")
    : "";

  const requestReview = async () => {
    setReviewing(true);
    try {
      const r = await api.codeReview({
        course_id: courseId,
        module_id: moduleId,
        title: ex.title,
        prompt: ex.prompt,
        language: ex.language,
        code,
        reference: ex.solution,
        rubric: ex.rubric,
        test_summary: testSummary,
      });
      setReview(r);
      logActivity();
      if (ex.language === "review" && r.source === "gemini" && r.score >= 60) markDone();
    } catch {
      setReview({ score: 0, verdict: "Not reviewed", summary: "Couldn't reach the AI reviewer — try again in a minute.", strengths: [], issues: [], suggestion: "", source: "unavailable" });
    } finally {
      setReviewing(false);
    }
  };

  const passedCount = report?.tests.filter((t) => t.passed).length ?? 0;
  const Lang = LANG[ex.language];

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">
          <Lang.icon className="size-3" /> {Lang.label}
        </Badge>
        <Badge>{ex.level}</Badge>
        {done && <Badge tone="good">✓ Completed</Badge>}
      </div>
      <h3 className="mt-3 font-display text-xl font-semibold">{ex.title}</h3>
      <Markdown className="mt-2 text-[15px]">{ex.prompt}</Markdown>
      {ex.files.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
          Data in the working directory:
          {ex.files.map((f) => (
            <a key={f} href={`/content/courses/${courseId}/data/${f}`} download className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 font-mono text-ink-2 hover:border-accent">
              <Download className="size-3" /> {f}
            </a>
          ))}
        </div>
      )}

      <div className="mt-4">
        <CodeEditor value={code} onChange={setCode} language={ex.language} onRun={run} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {ex.language !== "review" ? (
          <Button variant="primary" onClick={run} disabled={running}>
            {running ? <Spinner /> : <Play className="size-4 fill-current" />} Run &amp; check
          </Button>
        ) : (
          <Button variant="primary" onClick={requestReview} disabled={reviewing || !code.trim()}>
            {reviewing ? <Spinner /> : <Sparkles className="size-4" />} Submit for review
          </Button>
        )}
        {ex.language !== "review" && (
          <Button onClick={requestReview} disabled={reviewing || !code.trim()}>
            {reviewing ? <Spinner /> : <Sparkles className="size-4" />} Review my code
          </Button>
        )}
        {ex.hints.length > 0 && (
          <Button variant="soft" onClick={() => setHints((h) => Math.min(ex.hints.length, h + 1))} disabled={hints >= ex.hints.length}>
            <Lightbulb className="size-4" /> {hints ? `Hint ${Math.min(hints + 1, ex.hints.length)}/${ex.hints.length}` : "Hint"}
          </Button>
        )}
        <Button variant="ghost" onClick={() => askBuddy(`I'm stuck on the coding exercise "${ex.title}". Look at my code and nudge me without giving the solution.`, "nudge", { task: ex.prompt.slice(0, 1900), last_answer: code.slice(0, 5900) })}>
          <MessageCircle className="size-4" /> Ask buddy
        </Button>
        <Button variant="ghost" onClick={() => { setCode(ex.starter); setReport(null); setReview(null); }} title="Reset to starter code">
          <RotateCcw className="size-4" />
        </Button>
        <span className="ml-auto text-xs text-muted">Ctrl/⌘ + Enter to run</span>
      </div>

      {hints > 0 && (
        <ol className="mt-3 space-y-1.5">
          {ex.hints.slice(0, hints).map((h, i) => (
            <li key={i} className="rounded-xl border border-warn/25 bg-warn-bg px-4 py-2 text-sm">
              <b>Hint {i + 1}.</b> {h}
            </li>
          ))}
        </ol>
      )}

      {(status || running) && (
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted">
          <Spinner /> {status || "Working…"}
        </p>
      )}
      {runError && <p className="mt-3 rounded-xl border border-bad/25 bg-bad-bg px-4 py-3 text-sm text-bad">{runError}</p>}

      {report && (
        <div className="mt-4 space-y-3">
          {report.error && <pre className="overflow-x-auto rounded-xl border border-bad/25 bg-bad-bg p-3 font-mono text-[12.5px] whitespace-pre-wrap text-bad">{report.error}</pre>}
          {report.stdout && (
            <div>
              <div className="mb-1 text-xs font-semibold text-muted">Output</div>
              <pre className="max-h-60 overflow-auto rounded-xl bg-[#1b1814] p-3 font-mono text-[12.5px] text-[#efe6d6]">{report.stdout}</pre>
            </div>
          )}
          {report.result && <ResultTable result={report.result} />}
          {report.tests.length > 0 && (
            <div className="rounded-xl border border-line">
              <div className={cn("flex items-center justify-between border-b border-line px-4 py-2.5 text-sm font-semibold", report.ok ? "bg-good-bg text-good" : "bg-sunk")}>
                <span>{report.ok ? "All tests passed 🎉" : `${passedCount} of ${report.tests.length} tests passed`}</span>
              </div>
              <ul className="divide-y divide-line">
                {report.tests.map((t) => (
                  <li key={t.name} className="flex gap-2.5 px-4 py-2.5 text-sm">
                    {t.passed ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-good" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-bad" />}
                    <div className="min-w-0">
                      <div className={cn(!t.passed && "font-medium")}>{t.name}</div>
                      {t.message && <div className="mt-0.5 font-mono text-xs break-words text-bad">{t.message}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {review && <ReviewView review={review} />}

      <div className="mt-4 border-t border-line pt-3">
        {showSolution ? (
          <div>
            <div className="mb-1.5 text-xs font-semibold text-muted">Reference solution</div>
            <pre className="overflow-x-auto rounded-xl bg-[#1b1814] p-3.5 font-mono text-[12.5px] leading-relaxed text-[#efe6d6]">{ex.solution}</pre>
            {ex.language === "review" && !done && (
              <Button size="sm" variant="ghost" className="mt-2" onClick={markDone}>
                I&apos;ve compared mine with it — mark as done
              </Button>
            )}
          </div>
        ) : (
          <button
            onClick={() => (attempts > 0 || review || window.confirm("Try it yourself first? Seeing the solution early makes it much harder to learn.")) && setShowSolution(true)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
          >
            <Eye className="size-4" /> Show reference solution
          </button>
        )}
      </div>
    </Card>
  );
}

function ResultTable({ result }: { result: NonNullable<RunReport["result"]> }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-muted">
        Query result · {result.total} row{result.total === 1 ? "" : "s"}
        {result.total > result.rows.length ? ` (first ${result.rows.length} shown)` : ""}
      </div>
      <div className="max-h-72 overflow-auto rounded-xl border border-line">
        <table className="w-full border-collapse font-mono text-[12.5px]">
          <thead className="sticky top-0">
            <tr>{result.columns.map((c) => <th key={c} className="border-b border-line bg-sunk px-3 py-1.5 text-left font-sans font-semibold">{c}</th>)}</tr>
          </thead>
          <tbody>
            {result.rows.map((r, i) => (
              <tr key={i} className="odd:bg-paper">{r.map((v, j) => <td key={j} className="px-3 py-1 whitespace-nowrap">{v === null ? <span className="text-muted">NULL</span> : String(v)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReviewView({ review: r }: { review: CodeReview }) {
  if (r.source === "unavailable") return <p className="mt-4 rounded-xl border border-warn/25 bg-warn-bg px-4 py-3 text-sm">{r.summary}</p>;
  const tone = r.score >= 75 ? "text-good" : r.score >= 60 ? "text-warn" : "text-bad";
  return (
    <div className="mt-4 rounded-2xl border border-line bg-paper p-4">
      <div className="flex items-center gap-3">
        <span className={cn("font-mono text-2xl font-bold", tone)}>{r.score}</span>
        <div>
          <div className="font-semibold">{r.verdict}</div>
          <p className="text-sm text-ink-2">{r.summary}</p>
        </div>
      </div>
      {r.strengths.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {r.strengths.map((s) => <li key={s} className="flex gap-2"><Circle className="mt-1.5 size-2 shrink-0 fill-good text-good" />{s}</li>)}
        </ul>
      )}
      {r.issues.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm">
          {r.issues.map((s, i) => (
            <li key={i} className="flex gap-2">
              <Circle className="mt-1.5 size-2 shrink-0 fill-bad text-bad" />
              <span>{s.line ? <b className="font-mono">line {s.line}: </b> : null}{s.message}</span>
            </li>
          ))}
        </ul>
      )}
      {r.suggestion && <p className="mt-3 text-sm"><b>Next:</b> {r.suggestion}</p>}
    </div>
  );
}
