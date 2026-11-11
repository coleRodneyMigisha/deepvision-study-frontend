"use client";
import { Lightbulb } from "lucide-react";
import { useState } from "react";
import { Button, Spinner } from "@/components/ui";
import type { Evaluation } from "@/lib/api";
import { useApiStatus } from "@/lib/api";
import { askBuddy, setMood } from "@/lib/buddy";
import { gradeAnswer } from "@/lib/grading";
import { logActivity } from "@/lib/progress";
import { persistentStore, useStore } from "@/lib/store";
import { EvaluationView } from "./EvaluationView";

const drafts = persistentStore<Record<string, string>>("studyroom:v3:drafts", {});

/** A question + answer box + AI grading. Used for checkpoints, practice questions and lab explains. */
export function WrittenAnswer({
  draftKey,
  courseId,
  moduleId,
  question,
  keywords,
  idealAnswer,
  hint,
  kind = "oral",
  placeholder = "Answer as if you were speaking to the examiner: what it is → how it works → a trade-off.",
  onGraded,
  submitLabel = "Grade my answer",
}: {
  draftKey: string;
  courseId: string;
  moduleId: string;
  question: string;
  keywords: string[];
  idealAnswer: string;
  hint?: string;
  kind?: "oral" | "written" | "lab";
  placeholder?: string;
  onGraded?: (r: Evaluation) => void;
  submitLabel?: string;
}) {
  const all = useStore(drafts, {});
  const draft = all[draftKey] ?? "";
  const [busy, setBusy] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<Evaluation | null>(null);
  const [error, setError] = useState("");
  const { status } = useApiStatus();

  const submit = async () => {
    if (draft.trim().split(/\s+/).length < 5) {
      setError("Give a fuller answer — at least a couple of sentences.");
      return;
    }
    setError("");
    setBusy(true);
    setMood("thinking", 30_000);
    const r = await gradeAnswer({ courseId, moduleId, question, answer: draft, keywords, idealAnswer, kind });
    setBusy(false);
    setResult(r);
    setMood(r.score >= 60 ? "happy" : "oops");
    logActivity(2);
    onGraded?.(r);
  };

  return (
    <div className="space-y-3">
      <textarea
        value={draft}
        onChange={(e) => drafts.set((d) => ({ ...d, [draftKey]: e.target.value }))}
        placeholder={placeholder}
        rows={5}
        className="w-full resize-y rounded-2xl border border-line-2 bg-paper p-4 text-[15px] leading-relaxed outline-none placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/10"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={submit} disabled={busy}>
          {busy ? (
            <>
              <Spinner /> {status === "waking" ? "Waking the examiner…" : "Grading…"}
            </>
          ) : (
            submitLabel
          )}
        </Button>
        {hint && (
          <Button variant="soft" onClick={() => setShowHint((s) => !s)}>
            <Lightbulb className="size-4" /> {showHint ? "Hide hint" : "Hint"}
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => askBuddy(`Help me answer this without giving it away: "${question}"`, "nudge", { last_question: question, last_answer: draft || undefined })}
        >
          Nudge me
        </Button>
        {error && <span className="text-sm text-bad">{error}</span>}
      </div>
      {showHint && hint && <div className="rounded-xl border border-warn/25 bg-warn-bg px-4 py-3 text-sm">{hint}</div>}
      {result && (
        <EvaluationView
          result={result}
          onDiscuss={() =>
            askBuddy(`I was asked: "${question}"\n\nMy answer: "${draft}"\n\nI scored ${result.score}. What did I miss? Then ask me a follow-up.`, "chat", {
              last_question: question,
              last_answer: draft,
              last_score: result.score,
            })
          }
        />
      )}
    </div>
  );
}
