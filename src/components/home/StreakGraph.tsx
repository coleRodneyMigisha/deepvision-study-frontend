"use client";
import { CalendarRange } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui";
import { type GraphCell, type GraphPreset, type GraphRange, graphWeeks, resolveRange, streaks, useActivity } from "@/lib/progress";
import { persistentStore, useStore } from "@/lib/store";
import { cn, todayISO } from "@/lib/utils";

const LEVELS = ["bg-sunk", "bg-accent/25", "bg-accent/50", "bg-accent/75", "bg-accent"];
const level = (n: number) => (n <= 0 ? 0 : n <= 3 ? 1 : n <= 8 ? 2 : n <= 15 ? 3 : 4);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PRESETS: { id: GraphPreset; label: string }[] = [
  { id: "1m", label: "1M" },
  { id: "3m", label: "3M" },
  { id: "6m", label: "6M" },
  { id: "1y", label: "1Y" },
  { id: "all", label: "All" },
  { id: "custom", label: "Custom" },
];

// Per-viewer preference: which range the graph shows (3 months unless they pick another).
const rangeStore = persistentStore<GraphRange>("studyroom:v3:streak-range", { preset: "3m" });

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

/** GitHub-style contribution graph of study activity over a chosen range (default: 3 months). */
export function StreakGraph() {
  const activity = useActivity();
  const stats = streaks(activity);
  const range = useStore(rangeStore, { preset: "3m" });
  const [editing, setEditing] = useState(false);
  const today = todayISO();
  const { from, to } = resolveRange(range, activity, today);
  const { weeks, months, total, activeDays } = useMemo(() => {
    const { weeks, total } = graphWeeks(activity, from, to);
    const months: { col: number; label: string }[] = [];
    weeks.forEach((col, w) => {
      const first = col.find((c) => !c.outside) ?? col[0];
      const m = Number(first.date.slice(5, 7)) - 1;
      const prev = w > 0 ? weeks[w - 1].find((c) => !c.outside) ?? weeks[w - 1][0] : null;
      if (!prev || Number(prev.date.slice(5, 7)) - 1 !== m) months.push({ col: w, label: MONTHS[m] });
    });
    // Skip a label that would collide with the next one (a month starting in the last column of a range).
    const spaced = months.filter((m, i) => !months[i + 1] || months[i + 1].col - m.col >= 3 || i === months.length - 1);
    const activeDays = weeks.flat().filter((c) => !c.outside && c.count > 0).length;
    return { weeks, months: spaced, total, activeDays };
  }, [activity, from, to]);
  // On narrow screens the grid scrolls sideways: start at the most recent weeks.
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth;
  }, [from, to]);
  // Short ranges get bigger squares so the card doesn't look empty.
  const cell = weeks.length <= 6 ? 26 : weeks.length <= 14 ? 20 : weeks.length <= 27 ? 15 : 11;

  const pick = (preset: GraphPreset) => {
    if (preset === "custom") {
      setEditing(true);
      rangeStore.set((r) => ({ preset: "custom", from: r.from ?? from, to: r.to ?? to }));
    } else {
      setEditing(false);
      rangeStore.set({ preset });
    }
  };

  return (
    <Card id="streak" className="p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11.5px] font-semibold tracking-[0.12em] text-accent uppercase">Study streak</div>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            {stats.current > 0 ? (
              <>
                <span className="hl">{stats.current} day{stats.current === 1 ? "" : "s"}</span> in a row {stats.studiedToday ? "🔥" : ""}
              </>
            ) : (
              "Start a streak today"
            )}
          </h2>
          <p className="mt-1 text-sm text-ink-2">
            {stats.studiedToday
              ? "Today counts. Come back tomorrow to keep it going."
              : stats.current > 0
                ? "Study anything today — one quiz question is enough — to keep your streak."
                : "Every answered question, graded answer, lab goal and buddy chat fills in a square."}
          </p>
        </div>
        <dl className="flex gap-6 text-sm">
          {[
            ["Longest", `${stats.longest}d`],
            ["Active days", activeDays],
            ["Actions in range", total],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="font-mono text-lg font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full border border-line bg-sunk p-0.5" role="group" aria-label="Graph range">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => pick(p.id)}
              aria-pressed={range.preset === p.id}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold text-ink-2 transition hover:text-ink",
                range.preset === p.id && "bg-card text-ink shadow-card",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {range.preset === "custom" && editing ? (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <input
              type="date"
              aria-label="From"
              value={from}
              max={to}
              onChange={(e) => e.target.value && rangeStore.set((r) => ({ ...r, preset: "custom", from: e.target.value }))}
              className="h-8 rounded-lg border border-line-2 bg-paper px-2 font-mono outline-none focus:border-accent"
            />
            <span className="text-muted">to</span>
            <input
              type="date"
              aria-label="To"
              value={to}
              min={from}
              max={today}
              onChange={(e) => e.target.value && rangeStore.set((r) => ({ ...r, preset: "custom", to: e.target.value }))}
              className="h-8 rounded-lg border border-line-2 bg-paper px-2 font-mono outline-none focus:border-accent"
            />
          </div>
        ) : (
          <button
            onClick={() => (range.preset === "custom" ? setEditing(true) : undefined)}
            className={cn("inline-flex items-center gap-1.5 text-xs text-muted", range.preset === "custom" && "hover:text-ink")}
          >
            <CalendarRange className="size-3.5" /> {fmt(from)} – {fmt(to)}
          </button>
        )}
      </div>
      <div ref={scroller} className="mt-4 overflow-x-auto pb-1">
        <div className="inline-grid min-w-max gap-1" style={{ gridTemplateColumns: `24px repeat(${weeks.length}, ${cell}px)` }}>
          <div />
          {weeks.map((_, w) => (
            <div key={w} className="h-4 text-[10px] whitespace-nowrap text-muted">
              {months.find((m) => m.col === w)?.label ?? ""}
            </div>
          ))}
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <Row key={d} day={d} weeks={weeks} size={cell} />
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5 text-[11px] text-muted">
        Less {LEVELS.map((c) => <span key={c} className={cn("size-[11px] rounded-[3px]", c)} />)} More
      </div>
    </Card>
  );
}

function Row({ day, weeks, size }: { day: number; weeks: GraphCell[][]; size: number }) {
  return (
    <>
      <div className="pr-1 text-right text-[10px] text-muted" style={{ lineHeight: `${size}px` }}>
        {day === 1 ? "Mon" : day === 3 ? "Wed" : day === 5 ? "Fri" : ""}
      </div>
      {weeks.map((col) => {
        const cell = col[day];
        return (
          <div
            key={cell.date}
            title={cell.outside ? "" : `${cell.count} study action${cell.count === 1 ? "" : "s"} on ${fmt(cell.date)}`}
            style={{ width: size, height: size }}
            className={cn("rounded-[3px]", size >= 20 && "rounded-[5px]", cell.outside ? "bg-transparent" : LEVELS[level(cell.count)])}
          />
        );
      })}
    </>
  );
}
