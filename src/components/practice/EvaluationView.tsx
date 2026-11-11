"use client";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui";
import type { Evaluation } from "@/lib/api";
import { cn } from "@/lib/utils";
import { MathText } from "@/components/ui/Markdown";

export function EvaluationView({ result, onDiscuss }: { result: Evaluation; onDiscuss?: () => void }) {
  const tone = result.score >= 75 ? "text-good" : result.score >= 50 ? "text-warn" : "text-bad";
  const ring = result.score >= 75 ? "var(--good)" : result.score >= 50 ? "var(--warn)" : "var(--bad)";
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="flex items-center gap-4 bg-sunk px-5 py-4">
        <div
          className="grid size-16 shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(${ring} ${result.score * 3.6}deg, var(--line) 0)` }}
        >
          <span className={cn("grid size-[52px] place-items-center rounded-full bg-card font-mono text-lg font-bold", tone)}>{result.score}</span>
        </div>
        <div className="min-w-0">
          <div className="font-display text-lg font-semibold">{result.grade_label}</div>
          <p className="text-sm text-ink-2">{result.feedback}</p>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="grid gap-2 sm:grid-cols-3">
          {(
            [
              ["1 · Claim", result.beats.claim],
              ["2 · Mechanism", result.beats.mechanism],
              ["3 · Trade-off", result.beats.tradeoff],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-line p-3 text-sm">
              <div className="mb-1 text-[11px] font-semibold tracking-wider text-accent uppercase">{k}</div>
              <MathText>{v}</MathText>
            </div>
          ))}
        </div>
        {(result.terms_used.length > 0 || result.terms_missed.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {result.terms_used.map((t) => (
              <Badge key={`u${t}`} tone="good">✓ {t}</Badge>
            ))}
            {result.terms_missed.map((t) => (
              <Badge key={`m${t}`} tone="bad">+ {t}</Badge>
            ))}
          </div>
        )}
        <div>
          <div className="mb-1.5 text-[11px] font-semibold tracking-wider text-muted uppercase">Model answer</div>
          <div className="rounded-r-xl border-l-4 border-accent bg-sunk px-4 py-3 text-[14.5px] leading-relaxed"><MathText>{result.model_answer}</MathText></div>
        </div>
        {(result.examiner_tip || result.next_step) && (
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            {result.examiner_tip && (
              <p>
                <b>Examiner tip:</b> <MathText>{result.examiner_tip}</MathText>
              </p>
            )}
            {result.next_step && (
              <p>
                <b>Next step:</b> <MathText>{result.next_step}</MathText>
              </p>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <span className="text-xs text-muted">{result.source === "heuristic" ? "Offline keyword check" : "Graded by the AI examiner"}</span>
          {onDiscuss && (
            <button onClick={onDiscuss} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
              <MessageCircle className="size-4" /> Go over it with the buddy
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
