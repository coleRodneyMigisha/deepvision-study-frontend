"use client";
import { MessageCircle, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui";
import { MathText } from "@/components/ui/Markdown";
import { askBuddy, setMood } from "@/lib/buddy";
import type { QuizItem } from "@/lib/content/schema";
import { logActivity, updateModule, useCourseProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export function QuickCheck({ courseId, moduleId, quiz }: { courseId: string; moduleId: string; quiz: QuizItem[] }) {
  const record = useCourseProgress(courseId).modules[moduleId]?.quiz ?? {};
  const right = Object.values(record).filter(Boolean).length;
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-2">
        <b className="text-ink">{right}</b> of {quiz.length} correct so far. Wrong answers come with an explanation — and the buddy can unpack them.
      </p>
      {quiz.map((q, i) => (
        <Mcq key={q.question} q={q} index={i} courseId={courseId} moduleId={moduleId} />
      ))}
    </div>
  );
}

function Mcq({ q, index, courseId, moduleId }: { q: QuizItem; index: number; courseId: string; moduleId: string }) {
  const [picked, setPicked] = useState<number | null>(null);
  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === q.answer;
    updateModule(courseId, moduleId, (m) => ({ ...m, quiz: { ...(m.quiz ?? {}), [index]: ok } }));
    logActivity();
    setMood(ok ? "happy" : "oops", 1400);
  };
  const correct = picked === q.answer;
  return (
    <Card className="p-5">
      <p className="font-medium">
        <span className="mr-2 font-mono text-sm text-accent">Q{index + 1}</span>
        {q.question}
      </p>
      <div className="mt-3 grid gap-2">
        {q.options.map((o, i) => (
          <button
            key={o}
            onClick={() => choose(i)}
            disabled={picked !== null}
            className={cn(
              "rounded-xl border px-4 py-2.5 text-left text-[14.5px] transition",
              picked === null && "border-line hover:border-accent hover:bg-paper",
              picked !== null && i === q.answer && "border-good bg-good-bg text-good",
              picked === i && i !== q.answer && "border-bad bg-bad-bg text-bad",
              picked !== null && i !== q.answer && picked !== i && "border-line opacity-60",
            )}
          >
            <span className="mr-2 font-mono text-xs">{String.fromCharCode(65 + i)}</span>
            {o}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className="mt-3 space-y-2 text-sm">
          <p>
            <b className={correct ? "text-good" : "text-bad"}>{correct ? "Correct." : "Not quite."}</b> <MathText>{q.explanation}</MathText>
          </p>
          <div className="flex gap-3">
            <button onClick={() => setPicked(null)} className="inline-flex items-center gap-1 font-semibold text-ink-2 hover:text-ink">
              <RotateCcw className="size-3.5" /> Retry
            </button>
            {!correct && (
              <button
                onClick={() =>
                  askBuddy(
                    `Quiz: "${q.question}". I picked "${q.options[picked]}" but the answer is "${q.options[q.answer]}". Why was my choice wrong?`,
                    "chat",
                  )
                }
                className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
              >
                <MessageCircle className="size-3.5" /> Why was I wrong?
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
