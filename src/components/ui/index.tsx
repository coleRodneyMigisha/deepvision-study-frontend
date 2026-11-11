import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ink" | "soft" | "ghost" | "outline";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink shadow-[0_6px_16px_-6px_color-mix(in_srgb,var(--accent)_70%,transparent)] hover:brightness-110",
  ink: "bg-ink text-paper hover:opacity-90",
  soft: "bg-sunk text-ink hover:bg-line",
  ghost: "text-ink-2 hover:bg-sunk hover:text-ink",
  outline: "border border-line-2 bg-card text-ink hover:border-ink-2",
};
const SIZES = { sm: "h-8 px-3 text-[13px] gap-1.5", md: "h-10 px-4 text-sm gap-2", lg: "h-12 px-6 text-[15px] gap-2" };

export function buttonClass(variant: Variant = "outline", size: keyof typeof SIZES = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap transition active:scale-[.97] disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: keyof typeof SIZES }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: keyof typeof SIZES }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-card border border-line bg-card shadow-card", className)} {...props} />;
}

export function Eyebrow({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("text-[11.5px] font-semibold tracking-[0.12em] text-accent uppercase", className)} {...props} />;
}

export function SectionTitle({ eyebrow, title, children, className }: { eyebrow?: ReactNode; title: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">{title}</h2>
      </div>
      {children}
    </div>
  );
}

type Tone = "good" | "bad" | "warn" | "neutral" | "accent";
const TONES: Record<Tone, string> = {
  good: "bg-good-bg text-good border-good/20",
  bad: "bg-bad-bg text-bad border-bad/20",
  warn: "bg-warn-bg text-warn border-warn/20",
  neutral: "bg-sunk text-ink-2 border-line",
  accent: "bg-[color-mix(in_srgb,var(--accent)_12%,var(--card))] text-accent border-accent/25",
};
export const toneClass = (tone: Tone = "neutral") => TONES[tone];

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", TONES[tone], className)}
      {...props}
    />
  );
}

export function ProgressRing({ value, size = 44, stroke = 4, label, className }: { value: number; size?: number; stroke?: number; label?: ReactNode; className?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("relative grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute font-mono text-[11px] font-semibold">{label ?? `${Math.round(v)}%`}</span>
    </div>
  );
}

export function Bar({ value, tone = "accent", className }: { value: number; tone?: "accent" | "good" | "bad" | "warn"; className?: string }) {
  const color = { accent: "bg-accent", good: "bg-good", bad: "bg-bad", warn: "bg-warn" }[tone];
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-sunk", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn("inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent", className)} aria-hidden />;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-md border border-line-2 bg-sunk px-1.5 py-0.5 font-mono text-[11px] text-ink-2">{children}</kbd>;
}
