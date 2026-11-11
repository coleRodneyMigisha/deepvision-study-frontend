"use client";
import { motion } from "motion/react";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function TextField({ label, hint, className, ...props }: ComponentProps<"input"> & { label: string; hint?: ReactNode }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-baseline justify-between text-[13px] font-semibold text-ink-2">
        {label}
        {hint}
      </span>
      <input
        {...props}
        className="h-12 w-full rounded-2xl border border-line-2 bg-paper px-4 text-[15px] text-ink outline-none transition placeholder:text-muted focus:border-accent focus:bg-card focus:ring-4 focus:ring-accent/10"
      />
    </label>
  );
}

/** A comic speech bubble pointing left (towards the buddy) on wide screens, up on narrow ones. */
export function SpeechBubble({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "oops" }) {
  return (
    <motion.div
      key={typeof children === "string" ? children : undefined}
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 18, stiffness: 260 }}
      className={cn(
        "relative max-w-xs rounded-3xl border-2 border-ink bg-card px-5 py-3.5 font-display text-[17px] leading-snug font-medium shadow-[4px_4px_0_var(--ink)]",
        tone === "oops" && "bg-warn-bg",
      )}
    >
      {children}
      <span
        aria-hidden
        className={cn(
          "absolute -bottom-[11px] left-10 size-5 rotate-45 border-r-2 border-b-2 border-ink bg-card",
          tone === "oops" && "bg-warn-bg",
        )}
      />
    </motion.div>
  );
}

// Spread all around a centred card…
const AROUND = [
  { t: "∇f(x)", x: "8%", y: "14%", r: -12 },
  { t: "σ²", x: "78%", y: "10%", r: 10 },
  { t: "SELECT *", x: "70%", y: "78%", r: -6 },
  { t: "p(y|x)", x: "6%", y: "70%", r: 8 },
  { t: "3×3 kernel", x: "56%", y: "26%", r: 4 },
  { t: "✦", x: "30%", y: "8%", r: 0 },
  { t: "IoU ≥ 0.5", x: "16%", y: "42%", r: -4 },
  { t: "x̄ ± 1.96σ/√n", x: "40%", y: "88%", r: 3 },
  { t: "★", x: "88%", y: "50%", r: 0 },
];
// …or kept to the right and the edges when text sits on the left.
const RIGHT = [
  { t: "∇f(x)", x: "62%", y: "5%", r: -12 },
  { t: "σ²", x: "86%", y: "12%", r: 10 },
  { t: "3×3 kernel", x: "64%", y: "24%", r: 4 },
  { t: "p(y|x)", x: "84%", y: "36%", r: 8 },
  { t: "IoU ≥ 0.5", x: "74%", y: "56%", r: -4 },
  { t: "★", x: "91%", y: "68%", r: 0 },
  { t: "SELECT *", x: "70%", y: "82%", r: -6 },
  { t: "✦", x: "40%", y: "3%", r: 0 },
];

/** Hand-drawn-ish formula doodles drifting behind the buddy. */
export function Doodles({ layout = "around" }: { layout?: "around" | "right" }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {(layout === "right" ? RIGHT : AROUND).map((d, i) => (
        <motion.span
          key={d.t}
          className="absolute font-mono text-[13px] font-medium text-ink/25 sm:text-sm dark:text-ink/20"
          style={{ left: d.x, top: d.y, rotate: d.r }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5 + (i % 4), repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
        >
          {d.t}
        </motion.span>
      ))}
    </div>
  );
}

/** Cycle through lines every few seconds. */
export function useRotating(lines: string[], ms = 4200) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % lines.length), ms);
    return () => clearInterval(id);
  }, [lines.length, ms]);
  return lines[i];
}

/** True once a pending request has taken long enough that the server is probably waking up. */
export function useSlow(pending: boolean, after = 3500) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!pending) return setSlow(false);
    const id = setTimeout(() => setSlow(true), after);
    return () => clearTimeout(id);
  }, [pending, after]);
  return slow;
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn("inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)} />;
}
