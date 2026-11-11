"use client";
import { Eye } from "lucide-react";
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { Markdown } from "@/components/ui/Markdown";
import { askBuddy } from "@/lib/buddy";
import type { Example } from "@/lib/content/schema";
import { logActivity, updateModule, useCourseProgress } from "@/lib/progress";

export function WorkedExamples({ courseId, moduleId, examples }: { courseId: string; moduleId: string; examples: Example[] }) {
  return (
    <div className="space-y-4">
      {examples.map((ex, i) => (
        <ExampleCard key={ex.title} ex={ex} index={i} courseId={courseId} moduleId={moduleId} />
      ))}
    </div>
  );
}

function ExampleCard({ ex, index, courseId, moduleId }: { ex: Example; index: number; courseId: string; moduleId: string }) {
  const done = !!useCourseProgress(courseId).modules[moduleId]?.examples?.[index];
  const [shown, setShown] = useState(done ? ex.steps.length : 0);
  const reveal = () => {
    const next = shown + 1;
    setShown(next);
    if (next === ex.steps.length) {
      updateModule(courseId, moduleId, (m) => ({ ...m, examples: { ...(m.examples ?? {}), [index]: true } }));
      logActivity();
    }
  };
  return (
    <Card className="p-5 sm:p-6">
      <div className="text-[11px] font-semibold tracking-wider text-accent uppercase">Worked example {index + 1}</div>
      <h3 className="mt-1 font-display text-lg font-semibold">{ex.title}</h3>
      <Markdown className="mt-2">{ex.problem}</Markdown>
      <ol className="mt-4 space-y-2">
        {ex.steps.slice(0, shown).map((s, i) => (
          <li key={i} className="flex gap-3 rounded-xl bg-sunk p-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent font-mono text-xs font-bold text-accent-ink">{i + 1}</span>
            <Markdown className="min-w-0 flex-1 text-[14.5px]">{s}</Markdown>
          </li>
        ))}
      </ol>
      {shown < ex.steps.length ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="ink" size="sm" onClick={reveal}>
            <Eye className="size-3.5" /> {shown === 0 ? "Try it, then reveal step 1" : `Reveal step ${shown + 1} of ${ex.steps.length}`}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShown(ex.steps.length)}>
            Show full solution
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => askBuddy(`I'm working on the example "${ex.title}". Give me a hint for the next step without solving it.`, "hint", { task: ex.problem })}
          >
            Hint
          </Button>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-good/25 bg-good-bg p-4 text-sm">
          <b>Answer:</b> {ex.answer}
          {ex.takeaway && <p className="mt-1 text-ink-2"><b>Takeaway:</b> {ex.takeaway}</p>}
        </div>
      )}
    </Card>
  );
}
