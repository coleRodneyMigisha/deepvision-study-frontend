"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Key terms as flip cards: read the term, say the definition out loud, then flip. */
export function Flashcards({ terms }: { terms: { term: string; definition: string }[] }) {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {terms.map((t, i) => (
        <button
          key={t.term}
          onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
          className={cn(
            "min-h-28 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5",
            flipped[i] ? "border-accent/30 bg-card" : "border-line bg-sunk",
          )}
        >
          {flipped[i] ? (
            <>
              <div className="text-xs font-semibold text-accent">{t.term}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{t.definition}</p>
            </>
          ) : (
            <>
              <div className="font-display text-lg font-semibold">{t.term}</div>
              <p className="mt-2 text-xs text-muted">Define it out loud, then tap to check</p>
            </>
          )}
        </button>
      ))}
    </div>
  );
}
