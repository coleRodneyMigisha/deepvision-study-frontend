"use client";
import { useMemo } from "react";
import { Card } from "@/components/ui";
import { streaks, useActivity } from "@/lib/progress";
import { addDays, cn, todayISO } from "@/lib/utils";

const LEVELS = ["bg-sunk", "bg-accent/25", "bg-accent/50", "bg-accent/75", "bg-accent"];
const level = (n: number) => (n <= 0 ? 0 : n <= 3 ? 1 : n <= 8 ? 2 : n <= 15 ? 3 : 4);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** GitHub-style contribution graph of study activity over the last year. */
export function StreakGraph() {
  const activity = useActivity();
  const stats = streaks(activity);
  const { weeks, months, total } = useMemo(() => {
    const today = todayISO();
    const dow = new Date().getDay(); // 0 = Sunday, like GitHub
    const start = addDays(today, -(52 * 7 + dow));
    const weeks: { date: string; count: number; future: boolean }[][] = [];
    const months: { col: number; label: string }[] = [];
    let total = 0;
    for (let w = 0; w < 53; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(start, w * 7 + d);
        const count = activity[date] ?? 0;
        if (date <= today) total += count;
        col.push({ date, count, future: date > today });
      }
      const m = Number(col[0].date.slice(5, 7)) - 1;
      if (w === 0 || Number(weeks[w - 1][0].date.slice(5, 7)) - 1 !== m) months.push({ col: w, label: MONTHS[m] });
      weeks.push(col);
    }
    return { weeks, months, total };
  }, [activity]);

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
            ["Active days", stats.activeDays],
            ["Actions this year", total],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="font-mono text-lg font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="mt-5 overflow-x-auto pb-1">
        <div className="inline-grid min-w-max gap-1" style={{ gridTemplateColumns: `24px repeat(53, 11px)` }}>
          <div />
          {weeks.map((_, w) => (
            <div key={w} className="h-4 text-[10px] text-muted">
              {months.find((m) => m.col === w)?.label ?? ""}
            </div>
          ))}
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <Row key={d} day={d} weeks={weeks} />
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5 text-[11px] text-muted">
        Less {LEVELS.map((c) => <span key={c} className={cn("size-[11px] rounded-[3px]", c)} />)} More
      </div>
    </Card>
  );
}

function Row({ day, weeks }: { day: number; weeks: { date: string; count: number; future: boolean }[][] }) {
  return (
    <>
      <div className="pr-1 text-right text-[10px] leading-[11px] text-muted">{day === 1 ? "Mon" : day === 3 ? "Wed" : day === 5 ? "Fri" : ""}</div>
      {weeks.map((col) => {
        const cell = col[day];
        return (
          <div
            key={cell.date}
            title={cell.future ? "" : `${cell.count} study action${cell.count === 1 ? "" : "s"} on ${cell.date}`}
            className={cn("size-[11px] rounded-[3px]", cell.future ? "bg-transparent" : LEVELS[level(cell.count)])}
          />
        );
      })}
    </>
  );
}
