"use client";
import { toneClass } from "@/components/ui";
import type { Block, Tone } from "@/lib/lab/types";
import { cn } from "@/lib/utils";

const BAR: Record<Tone, string> = { good: "bg-good", bad: "bg-bad", warn: "bg-warn", neutral: "bg-ink-2", accent: "bg-accent" };
const VALUE: Record<Tone, string> = { good: "text-good", bad: "text-bad", warn: "text-warn", neutral: "text-ink", accent: "text-accent" };

function inline(text: string) {
  // **bold** and `code` only
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) =>
    part.startsWith("**") ? (
      <b key={i} className="text-ink">{part.slice(2, -2)}</b>
    ) : part.startsWith("`") ? (
      <code key={i} className="rounded bg-sunk px-1 font-mono text-[0.88em]">{part.slice(1, -1)}</code>
    ) : (
      part
    ),
  );
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "stats":
            return (
              <div key={i} className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
                {b.items.map((s) => (
                  <div key={s.label} className="rounded-xl border border-line bg-paper px-3 py-2.5">
                    <div className="text-[11.5px] text-muted">{s.label}</div>
                    <div className={cn("mt-0.5 font-mono text-[17px] font-semibold break-words", VALUE[s.tone ?? "neutral"])}>{s.value}</div>
                  </div>
                ))}
              </div>
            );
          case "result":
            return (
              <div key={i} className="rounded-2xl bg-ink px-4 py-3.5 text-paper">
                <div className="text-[11px] font-semibold tracking-wider uppercase opacity-60">{b.label}</div>
                <div className="mt-0.5 font-mono text-2xl font-semibold break-words">{b.value}</div>
                {b.work && <div className="mt-1.5 font-mono text-[12.5px] whitespace-pre-line opacity-75">{b.work}</div>}
              </div>
            );
          case "bars": {
            const max = Math.max(...b.items.map((x) => x.max ?? x.value), 1e-9);
            return (
              <div key={i} className="space-y-2">
                {b.title && <div className="text-xs font-semibold text-muted">{b.title}</div>}
                {b.items.map((x) => (
                  <div key={x.label}>
                    <div className="flex justify-between text-[13px]">
                      <span>{x.label}</span>
                      <b className="font-mono">{x.display ?? x.value}</b>
                    </div>
                    <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-sunk">
                      <div
                        className={cn("h-full rounded-full transition-[width] duration-300", BAR[x.tone ?? "accent"])}
                        style={{ width: `${Math.max(0, Math.min(100, (100 * x.value) / (x.max ?? max)))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            );
          }
          case "table":
            return (
              <div key={i} className="overflow-x-auto">
                {b.title && <div className="mb-1.5 text-xs font-semibold text-muted">{b.title}</div>}
                <table className="w-full border-collapse font-mono text-[12.5px]">
                  <thead>
                    <tr>
                      {b.head.map((h) => (
                        <th key={h} className="border border-line bg-sunk px-2 py-1.5 text-left font-sans font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (
                          <td
                            key={c}
                            className={cn("border border-line px-2 py-1.5", b.highlight?.some(([hr, hc]) => hr === r && (hc === c || hc === -1)) && "bg-hl/50 font-semibold")}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "note":
            return (
              <p key={i} className={cn("rounded-xl border px-3.5 py-2.5 text-[13.5px] leading-relaxed", toneClass(b.tone ?? "neutral"))}>
                {inline(b.text)}
              </p>
            );
          case "code":
            return (
              <pre key={i} className="overflow-x-auto rounded-xl bg-[#1b1814] p-3.5 font-mono text-[12.5px] leading-relaxed text-[#efe6d6]">
                {b.code}
              </pre>
            );
        }
      })}
    </div>
  );
}
