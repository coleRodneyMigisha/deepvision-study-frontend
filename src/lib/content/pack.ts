/**
 * Reads and validates course packs from `content/courses/<id>/`.
 * Used by the Next.js build (server components) and by `scripts/build-content.ts`.
 *
 *   content/courses/<id>/course.yaml        → course metadata, formulas, exam bank
 *   content/courses/<id>/modules/NN-*.yaml  → one file per module, ordered by filename
 */
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import type { ZodError } from "zod";
import { type Course, CourseMetaSchema, ModuleSchema } from "./schema.ts";

export const CONTENT_ROOT = path.join(process.cwd(), "content", "courses");

export class ContentError extends Error {}

function readYaml(file: string): unknown {
  try {
    return YAML.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    throw new ContentError(`${path.relative(process.cwd(), file)}: invalid YAML — ${(err as Error).message}`);
  }
}

function explain(file: string, err: ZodError): ContentError {
  const issues = err.issues.map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
  return new ContentError(`${path.relative(process.cwd(), file)} is invalid:\n${issues}`);
}

export function courseIds(root = CONTENT_ROOT): string[] {
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(root, d.name, "course.yaml")))
    .map((d) => d.name)
    .sort();
}

export function loadCourse(id: string, root = CONTENT_ROOT): Course {
  const dir = path.join(root, id);
  const metaFile = path.join(dir, "course.yaml");
  const meta = CourseMetaSchema.safeParse(readYaml(metaFile));
  if (!meta.success) throw explain(metaFile, meta.error);
  if (meta.data.id !== id) throw new ContentError(`${metaFile}: id "${meta.data.id}" must match its folder name "${id}"`);

  const modDir = path.join(dir, "modules");
  const files = fs.existsSync(modDir) ? fs.readdirSync(modDir).filter((f) => /\.ya?ml$/.test(f)).sort() : [];
  const modules = files.map((f) => {
    const file = path.join(modDir, f);
    const parsed = ModuleSchema.safeParse(readYaml(file));
    if (!parsed.success) throw explain(file, parsed.error);
    return parsed.data;
  });
  if (!modules.length) throw new ContentError(`${dir}: a course needs at least one file in modules/`);

  const seen = new Set<string>();
  const dataDir = path.join(dir, "data");
  for (const m of modules) {
    if (seen.has(m.id)) throw new ContentError(`${id}: duplicate module id "${m.id}"`);
    seen.add(m.id);
    const ids = new Set<string>();
    for (const ex of m.coding) {
      if (ids.has(ex.id)) throw new ContentError(`${id}/${m.id}: duplicate exercise id "${ex.id}"`);
      ids.add(ex.id);
      for (const f of ex.files) {
        if (!fs.existsSync(path.join(dataDir, f))) throw new ContentError(`${id}/${m.id}/${ex.id}: data file "${f}" not found in ${path.relative(process.cwd(), dataDir)}`);
      }
    }
  }
  for (const q of meta.data.exam.written) {
    if (!seen.has(q.module)) throw new ContentError(`${metaFile}: exam question refers to unknown module "${q.module}"`);
  }
  return { ...meta.data, modules };
}

export function loadAllCourses(root = CONTENT_ROOT): Course[] {
  return courseIds(root).map((id) => loadCourse(id, root));
}

/** The JSON contract the backend reads (see backend/app/services/content.py). */
export function toApiJson(course: Course) {
  return {
    id: course.id,
    code: course.code,
    title: course.title,
    shortTitle: course.shortTitle,
    tagline: course.tagline,
    persona: course.persona,
    formulas: course.formulas,
    modules: course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      subtitle: m.subtitle,
      summary: m.subtitle,
      recap: m.recap,
      traps: m.traps,
      steps: m.lesson.steps,
      notes: m.notes,
      examples: m.examples.map((e) => ({ title: e.title, problem: e.problem, answer: e.answer })),
      checkpoint: m.checkpoint,
      terms: m.terms,
      lab: m.lab ? { id: m.id, title: m.lab.title } : null,
    })),
  };
}
