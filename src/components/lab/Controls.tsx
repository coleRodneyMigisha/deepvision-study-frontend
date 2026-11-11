"use client";
import type { Control, Value, Values } from "@/lib/lab/types";
import { fmt } from "@/lib/utils";

export function Controls({ controls, values, set }: { controls: Control[]; values: Values; set: (id: string, v: Value) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {controls.map((c) => {
        const v = values[c.id];
        switch (c.kind) {
          case "range":
            return (
              <label key={c.id} className="block text-[13px] text-ink-2 sm:col-span-2">
                <span className="flex justify-between gap-2">
                  <span>{c.label}</span>
                  <output className="font-mono font-semibold text-accent">
                    {c.format ? c.format(Number(v)) : fmt(Number(v), 4)}
                    {c.unit ? ` ${c.unit}` : ""}
                  </output>
                </span>
                <input type="range" min={c.min} max={c.max} step={c.step ?? 1} value={Number(v)} onChange={(e) => set(c.id, Number(e.target.value))} className="mt-1 w-full" />
              </label>
            );
          case "number":
            return (
              <label key={c.id} className="block text-[13px] text-ink-2">
                {c.label}
                {c.unit ? ` (${c.unit})` : ""}
                <input
                  type="number"
                  value={Number.isFinite(Number(v)) ? Number(v) : ""}
                  step={c.step ?? "any"}
                  min={c.min}
                  max={c.max}
                  onChange={(e) => set(c.id, e.target.value === "" ? 0 : Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-line-2 bg-paper px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent"
                />
              </label>
            );
          case "select":
            return (
              <label key={c.id} className="block text-[13px] text-ink-2">
                {c.label}
                <select
                  value={String(v)}
                  onChange={(e) => set(c.id, e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line-2 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                >
                  {c.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            );
          case "toggle":
            return (
              <label key={c.id} className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink-2">
                <input type="checkbox" checked={Boolean(v)} onChange={(e) => set(c.id, e.target.checked)} className="size-4 accent-[var(--accent)]" />
                {c.label}
              </label>
            );
        }
      })}
    </div>
  );
}
