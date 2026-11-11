/**
 * Guided-lab contract. A lab is plain data + pure functions, rendered by <LabRunner>:
 *
 *   1. Predict     — commit a numeric guess before touching anything (`predict` tasks)
 *   2. Experiment  — sections of controls → live outputs, with goals that tick themselves off (`goal` tasks)
 *   3. Explain     — a written answer graded by the AI examiner (`explain` tasks)
 *   4. Challenge   — YAML variations, a daily seeded problem (`daily`) and fresh AI challenges
 *
 * Control ids share one namespace per lab. `derive` turns values into metrics; goals check them
 * and the study buddy sees them, so it can comment on exactly what the student is doing.
 */
import type { ComponentType } from "react";
import type { Variation } from "@/lib/content/schema";
import type { Rng } from "@/lib/utils";

export type Value = number | string | boolean;
export type Values = Record<string, Value>;
export type Derived = Record<string, number | string | boolean>;
export type Tone = "good" | "bad" | "warn" | "neutral" | "accent";

export type Control =
  | { kind: "range"; id: string; label: string; min: number; max: number; step?: number; default: number; unit?: string; format?: (v: number) => string }
  | { kind: "number"; id: string; label: string; default: number; step?: number; min?: number; max?: number; unit?: string }
  | { kind: "select"; id: string; label: string; default: string; options: { value: string; label: string }[] }
  | { kind: "toggle"; id: string; label: string; default: boolean };

export type Block =
  | { kind: "stats"; items: { label: string; value: string | number; tone?: Tone }[] }
  | { kind: "result"; label: string; value: string; work?: string; tone?: Tone }
  | { kind: "bars"; title?: string; items: { label: string; value: number; max?: number; display?: string; tone?: Tone }[] }
  | { kind: "table"; title?: string; head: string[]; rows: (string | number)[][]; highlight?: [row: number, col: number][] }
  | { kind: "note"; text: string; tone?: Tone }
  | { kind: "code"; code: string };

export interface VisualProps {
  values: Values;
  derived: Derived;
  set: (id: string, value: Value) => void;
  /** Report metrics computed inside the visual (e.g. IoU of a painted mask). */
  report: (d: Derived) => void;
}

export interface Section {
  id: string;
  title: string;
  blurb?: string;
  controls: Control[];
  derive?: (v: Values) => Derived;
  view: (v: Values, d: Derived) => Block[];
  /** Python/SQL the simulation mirrors, shown under the outputs. */
  code?: string;
  Visual?: ComponentType<VisualProps>;
  presets?: { label: string; values: Values }[];
}

export type Task =
  | { kind: "predict"; id: string; prompt: string; answer: number; tolerance?: number; unit?: string; explain: string }
  | { kind: "goal"; id: string; prompt: string; hint: string; check: (v: Values, d: Derived) => boolean }
  | { kind: "explain"; id: string; prompt: string; keywords: string[]; idealAnswer: string };

export interface LabDef {
  /** One paragraph: what this lab lets you see that the notes can't. */
  intro: string;
  sections: Section[];
  tasks: Task[];
  /** Deterministic "challenge of the day" (same numbers all day, new tomorrow). */
  daily?: (rng: Rng, date: string) => Omit<Variation, "unit"> & { unit?: string };
}

export const taskCount = (lab?: LabDef) => lab?.tasks.length ?? 0;
