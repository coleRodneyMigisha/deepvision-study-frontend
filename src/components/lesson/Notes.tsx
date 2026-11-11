"use client";
import { Check, MessageCircle } from "lucide-react";
import { Markdown } from "@/components/ui/Markdown";
import { askBuddy } from "@/lib/buddy";
import type { Note } from "@/lib/content/schema";
import { logActivity, updateModule, useCourseProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export function Notes({ courseId, moduleId, notes }: { courseId: string; moduleId: string; notes: Note[] }) {
  const read = useCourseProgress(courseId).modules[moduleId]?.notesRead ?? {};
  const mark = (i: number) => {
    updateModule(courseId, moduleId, (m) => ({ ...m, notesRead: { ...(m.notesRead ?? {}), [i]: true } }));
    logActivity();
  };
  return (
    <div className="space-y-4">
      {notes.map((n, i) => (
        <article key={n.heading} id={`note-${i}`} className={cn("rounded-card border bg-card p-5 shadow-card sm:p-7", read[i] ? "border-good/30" : "border-line")}>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-xl leading-snug font-semibold">
              <span className="mr-2 font-mono text-sm text-accent">{String(i + 1).padStart(2, "0")}</span>
              {n.heading}
            </h3>
          </div>
          <Markdown className="mt-3 text-[15.5px]">{n.body}</Markdown>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
            <button
              onClick={() => mark(i)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold",
                read[i] ? "border-good/30 bg-good-bg text-good" : "border-line-2 hover:border-ink-2",
              )}
            >
              <Check className="size-3.5" /> {read[i] ? "Got it" : "I've got this"}
            </button>
            <button
              onClick={() => askBuddy(`I just read the section "${n.heading}". Check I really understood it: ask me one question about it.`, "quiz", { step: n.heading })}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-ink-2 hover:bg-sunk"
            >
              <MessageCircle className="size-3.5" /> Test me on this
            </button>
            <button
              onClick={() => askBuddy(`Explain "${n.heading}" a different way — simpler, with an everyday analogy.`, "explain", { step: n.heading })}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-ink-2 hover:bg-sunk"
            >
              Explain it differently
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
