"use client";
import { CalendarDays, CheckCircle2, Lightbulb, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Card, Spinner } from "@/components/ui";
import { Rich } from "@/components/ui/Markdown";
import { api, ApiError } from "@/lib/api";
import { askBuddy, setMood } from "@/lib/buddy";
import type { Variation } from "@/lib/content/schema";
import type { LabDef } from "@/lib/lab/types";
import { logActivity, updateModule, useCourseProgress } from "@/lib/progress";
import { cn, makePicker, parseNumber, seededRng, todayISO, withinTolerance } from "@/lib/utils";

type Item = Variation & { key: string; tag: string; verified?: boolean };

export function ChallengeCard({
  courseId,
  moduleId,
  variations,
  daily,
  labState,
}: {
  courseId: string;
  moduleId: string;
  variations: Variation[];
  daily?: LabDef["daily"];
  labState: Record<string, number | string>;
}) {
  const solved = useCourseProgress(courseId).modules[moduleId]?.lab?.challenges ?? {};
  const today = todayISO();
  const [ai, setAi] = useState<Item[]>([]);
  const [aiState, setAiState] = useState<{ busy: boolean; error?: string }>({ busy: false });

  const items: Item[] = useMemo(() => {
    const list: Item[] = variations.map((v, i) => ({ ...v, key: `v${i}`, tag: `Variation ${i + 1}` }));
    if (daily) {
      const d = daily(makePicker(seededRng(`${courseId}:${moduleId}:${today}`)), today);
      list.push({ unit: "", ...d, key: `daily:${today}`, tag: "Today" });
    }
    return [...list, ...ai];
  }, [variations, daily, courseId, moduleId, today, ai]);

  const [active, setActive] = useState(0);
  const item = items[Math.min(active, items.length - 1)];

  const generate = async () => {
    setAiState({ busy: true });
    try {
      const r = await api.challenge({ course_id: courseId, module_id: moduleId, lab_state: labState, avoid: items.map((i) => i.question).slice(-6) });
      const next: Item = {
        title: r.title,
        question: r.question,
        answer: r.answer,
        tolerance: r.tolerance,
        hint: r.hint,
        explanation: r.explanation,
        unit: r.unit,
        key: `ai:${Date.now()}`,
        tag: `AI #${ai.length + 1}`,
        verified: r.verified,
      };
      setAi((a) => [...a, next]);
      setActive(items.length);
      setAiState({ busy: false });
    } catch (err) {
      setAiState({ busy: false, error: err instanceof ApiError && err.status === 503 ? "AI isn't configured on the server yet." : "Couldn't generate one right now — try again." });
    }
  };

  if (!item) return null;
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <button
            key={it.key}
            onClick={() => setActive(i)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold",
              i === active ? "border-ink bg-ink text-paper" : "border-line-2 text-ink-2 hover:border-ink-2",
              solved[it.key] && i !== active && "border-good/40 text-good",
            )}
          >
            {it.key.startsWith("daily") && <CalendarDays className="size-3" />}
            {it.key.startsWith("ai") && <Sparkles className="size-3" />}
            {solved[it.key] && <CheckCircle2 className="size-3" />}
            {it.tag}
          </button>
        ))}
        <Button size="sm" variant="soft" onClick={generate} disabled={aiState.busy} className="ml-auto">
          {aiState.busy ? <Spinner /> : <Sparkles className="size-3.5" />} New AI challenge
        </Button>
      </div>
      {aiState.error && <p className="mt-2 text-sm text-bad">{aiState.error}</p>}
      <Attempt key={item.key} item={item} solved={!!solved[item.key]} courseId={courseId} moduleId={moduleId} />
    </Card>
  );
}

function Attempt({ item, solved, courseId, moduleId }: { item: Item; solved: boolean; courseId: string; moduleId: string }) {
  const [value, setValue] = useState("");
  const [verdict, setVerdict] = useState<null | boolean>(null);
  const [hint, setHint] = useState(false);
  const check = () => {
    const ok = withinTolerance(parseNumber(value), item.answer, item.tolerance);
    setVerdict(ok);
    setMood(ok ? "happy" : "oops", 1400);
    if (ok && !solved) {
      updateModule(courseId, moduleId, (m) => ({ ...m, lab: { ...m.lab, challenges: { ...(m.lab?.challenges ?? {}), [item.key]: true } } }));
      logActivity(2);
    }
  };
  return (
    <div className="mt-4">
      <h3 className="font-display text-lg font-semibold">
        {item.title}
        {item.verified && <span className="ml-2 align-middle text-[11px] font-medium text-good">✓ answer re-computed</span>}
      </h3>
      <p className="mt-2 text-[15.5px] leading-relaxed">
        <Rich html={item.question} />
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && check()}
          inputMode="decimal"
          placeholder={`Your answer${item.unit ? ` (${item.unit})` : ""}`}
          className="w-48 rounded-xl border border-line-2 bg-paper px-3 py-2 font-mono text-sm outline-none focus:border-accent"
        />
        <Button variant="primary" size="sm" onClick={check}>
          Check
        </Button>
        {item.hint && (
          <Button variant="ghost" size="sm" onClick={() => setHint((h) => !h)}>
            <Lightbulb className="size-3.5" /> Hint
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => askBuddy(`Help me set up this problem without solving it: ${item.question.replace(/<[^>]+>/g, "")}`, "nudge", { task: item.question })}>
          Nudge me
        </Button>
        {verdict !== null && <span className={cn("text-sm font-semibold", verdict ? "text-good" : "text-bad")}>{verdict ? "✓ Correct!" : "✗ Not quite — check the hint."}</span>}
        {solved && verdict === null && <span className="text-sm font-semibold text-good">Solved before ✓</span>}
      </div>
      {hint && item.hint && <div className="mt-3 rounded-xl border border-warn/25 bg-warn-bg px-4 py-2.5 text-sm">{item.hint}</div>}
      {verdict !== null && item.explanation && (
        <div className="mt-3 rounded-r-xl border-l-4 border-accent bg-sunk px-4 py-3 text-sm leading-relaxed">
          <b>Worked solution: </b>
          <Rich html={item.explanation} />
        </div>
      )}
    </div>
  );
}
