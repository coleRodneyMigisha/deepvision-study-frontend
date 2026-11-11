/**
 * Course-pack schema. Every YAML file under `content/courses/` is validated against this at
 * build time, so a typo in a course fails the build with a readable message instead of
 * breaking a page in production. See `content/README.md` for an annotated example.
 */
import { z } from "zod";

const slug = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "use lowercase letters, digits and dashes");
/** Plain YAML numbers in option/keyword lists (e.g. `[200, 400, 422]`) are accepted and become text. */
const text = z.union([z.string(), z.number()]).transform(String);
const words = z.array(text).default([]);

export const VariationSchema = z.object({
  title: z.string(),
  /** May contain <b> and <code> tags. */
  question: z.string(),
  answer: z.number(),
  tolerance: z.number().min(0).default(0.02),
  hint: z.string().default(""),
  explanation: z.string().default(""),
  unit: z.string().default(""),
});

export const QuizSchema = z
  .object({
    question: z.string(),
    options: z.array(text).min(2),
    /** Index of the correct option (0-based). */
    answer: z.number().int().min(0),
    explanation: z.string().default(""),
  })
  .refine((q) => q.answer < q.options.length, { message: "answer index is out of range" });

export const CheckpointSchema = z.object({
  question: z.string(),
  hint: z.string().default(""),
  keywords: words,
  idealAnswer: z.string(),
});

export const NoteSchema = z.object({
  heading: z.string(),
  /** Markdown: paragraphs, lists, tables, `code`, fenced code blocks. */
  body: z.string(),
});

export const ExampleSchema = z.object({
  title: z.string(),
  /** Markdown problem statement. */
  problem: z.string(),
  /** Each step is Markdown; shown one at a time so students can try before revealing. */
  steps: z.array(z.string()).min(1),
  answer: z.string(),
  takeaway: z.string().default(""),
});

export const QuestionSchema = z.object({
  question: z.string(),
  kind: z.enum(["short", "long"]).default("short"),
  marks: z.number().int().positive().default(5),
  keywords: words,
  idealAnswer: z.string(),
});

export const ExerciseSchema = z
  .object({
    id: slug,
    title: z.string(),
    /** python and sql run in the browser; review is written code checked by the AI against the rubric. */
    language: z.enum(["python", "sql", "review"]),
    level: z.enum(["warm-up", "core", "exam"]).default("core"),
    /** Markdown task description. */
    prompt: z.string(),
    starter: z.string().default(""),
    /** CSV files from content/courses/<course>/data/, available in the working directory. */
    files: z.array(z.string()).default([]),
    /** Hidden code run first: Python for python exercises, SQL for sql exercises. */
    setup: z.string().default(""),
    /** Hidden Python tests using `assert` (see public/coding/harness.py). */
    tests: z.array(z.object({ name: z.string(), code: z.string() })).default([]),
    /** sql only: compare the student's last query with the solution's result. */
    compare: z.enum(["rows", "ordered", "none"]).default("rows"),
    solution: z.string(),
    hints: z.array(z.string()).default([]),
    /** What a good answer must do — used by the AI reviewer (required for review exercises). */
    rubric: z.array(z.string()).default([]),
  })
  .refine((e) => e.language === "review" || e.tests.length > 0 || (e.language === "sql" && e.compare !== "none"), {
    message: "runnable exercises need tests (or an SQL comparison)",
  })
  .refine((e) => e.language !== "review" || e.rubric.length > 0, { message: "review exercises need a rubric" });

export const ModuleSchema = z
  .object({
    id: slug,
    title: z.string(),
    subtitle: z.string().default(""),
    /** "In one minute" recap shown on the lesson page and in the guide. */
    recap: z.string().default(""),
    /** Common mistakes examiners look for. */
    traps: z.array(z.string()).default([]),
    lesson: z.object({
      /** One narrated caption per step. Scenes (if any) draw a picture per step. */
      steps: z.array(z.string()).min(1),
      /** Step index where the checkpoint question interrupts the lesson (-1 = none). */
      checkpointStep: z.number().int().default(-1),
    }),
    checkpoint: CheckpointSchema.optional(),
    /** Deep-dive study notes (Markdown). This is the "textbook" of the module. */
    notes: z.array(NoteSchema).default([]),
    /** Worked examples, solved step by step. */
    examples: z.array(ExampleSchema).default([]),
    terms: z.array(z.object({ term: z.string(), definition: z.string() })).default([]),
    /** Multiple-choice practice bank. */
    quiz: z.array(QuizSchema).default([]),
    /** Exam-style written questions with model answers. */
    questions: z.array(QuestionSchema).default([]),
    /** Coding exercises shown in the module's lab. */
    coding: z.array(ExerciseSchema).default([]),
    fact: z.object({ title: z.string(), body: z.string() }).optional(),
    /** Hand-picked videos that are always shown (AI adds fresh picks daily on top). */
    videos: z
      .array(z.object({ youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/), title: z.string(), note: z.string().default("") }))
      .default([]),
    lab: z
      .object({
        title: z.string(),
        variations: z.array(VariationSchema).default([]),
      })
      .optional(),
  })
  .refine((m) => m.lesson.checkpointStep < m.lesson.steps.length, {
    message: "lesson.checkpointStep must point at an existing step",
  });

export const CourseMetaSchema = z.object({
  id: slug,
  code: z.string(),
  title: z.string(),
  shortTitle: z.string(),
  tagline: z.string().default(""),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#E8590C"),
  /** System persona the AI uses for this course (examiner & buddy). */
  persona: z.string().default(""),
  formulas: z.array(z.object({ name: z.string(), expr: z.string() })).default([]),
  exam: z
    .object({
      durationMinutes: z.number().int().positive().default(10),
      written: z
        .array(z.object({ prompt: z.string(), module: slug, keywords: words, idealAnswer: z.string(), tip: z.string().default("") }))
        .default([]),
    })
    .default({ durationMinutes: 10, written: [] }),
});

export type Variation = z.infer<typeof VariationSchema>;
export type QuizItem = z.infer<typeof QuizSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type Note = z.infer<typeof NoteSchema>;
export type Example = z.infer<typeof ExampleSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type CourseMeta = z.infer<typeof CourseMetaSchema>;
export type Course = CourseMeta & { modules: Module[] };
export type CourseSummary = Pick<Course, "id" | "code" | "title" | "shortTitle" | "tagline" | "accent"> & {
  moduleCount: number;
  firstModule: string;
};

/** The counts mastery is computed from — small enough to send to any page. */
export interface ModuleShape {
  id: string;
  title: string;
  subtitle: string;
  steps: number;
  notes: number;
  checkpoint: boolean;
  quiz: number;
  examples: number;
  questions: number;
  coding: number;
  hasLab: boolean;
  labTitle?: string;
}

export const moduleShape = (m: Module): ModuleShape => ({
  id: m.id,
  title: m.title,
  subtitle: m.subtitle,
  steps: m.lesson.steps.length,
  notes: m.notes.length,
  checkpoint: !!m.checkpoint,
  quiz: m.quiz.length,
  examples: m.examples.length,
  questions: m.questions.length,
  coding: m.coding.length,
  hasLab: !!m.lab,
  labTitle: m.lab?.title,
});

export type CourseOutline = CourseSummary & { modules: ModuleShape[] };
