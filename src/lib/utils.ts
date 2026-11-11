import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

/** Local calendar date as YYYY-MM-DD (streaks and daily challenges follow the student's day). */
export function todayISO(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return todayISO(new Date(y, m - 1, d + days));
}

/** Deterministic PRNG (FNV-1a seed + mulberry32) so a "daily" challenge is the same all day. */
export function seededRng(seed: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = ReturnType<typeof makePicker>;
export function makePicker(rand: () => number) {
  return {
    rand,
    int: (min: number, max: number, step = 1) => min + Math.floor(rand() * (Math.floor((max - min) / step) + 1)) * step,
    pick: <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)],
  };
}

export const fmt = (n: number, dp = 2) =>
  Number.isInteger(n) ? n.toLocaleString("en-US") : n.toLocaleString("en-US", { maximumFractionDigits: dp });

export function parseNumber(s: string): number {
  return parseFloat(String(s).replace(/[, _]/g, "").replace(/[−–]/g, "-"));
}

export function withinTolerance(value: number, answer: number, tol: number): boolean {
  return Number.isFinite(value) && Math.abs(value - answer) <= Math.max(tol, Math.abs(answer) * 1e-9);
}
