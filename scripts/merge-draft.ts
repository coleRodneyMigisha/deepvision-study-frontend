/**
 * Merge a reviewed draft (from `uv run studyroom draft <course> <module>` in the backend repo)
 * into the module's YAML. Items that already exist (same heading/question/term) are skipped.
 *
 *   npm run content:merge -- content/drafts/ds--data-cleaning.yaml
 *   npm run content:merge -- ds--data-cleaning.yaml          (looked up in content/drafts/)
 */
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { CONTENT_ROOT, ContentError, loadCourse } from "../src/lib/content/pack.ts";

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: npm run content:merge -- <draft.yaml>");
  process.exit(1);
}
const draftPath = fs.existsSync(arg) ? arg : path.join("content", "drafts", arg);
const [courseId, moduleId] = path.basename(draftPath).replace(/\.ya?ml$/, "").split("--");
let draft: Record<string, unknown>;
try {
  draft = YAML.parse(fs.readFileSync(draftPath, "utf8"));
} catch (err) {
  console.error(`✗ ${draftPath} is not valid YAML:\n  ${(err as Error).message.split("\n")[0]}`);
  process.exit(1);
}

const modDir = path.join(CONTENT_ROOT, courseId, "modules");
const file = fs.readdirSync(modDir).find((f) => YAML.parse(fs.readFileSync(path.join(modDir, f), "utf8"))?.id === moduleId);
if (!file) {
  console.error(`✗ No module "${moduleId}" in content/courses/${courseId}/modules`);
  process.exit(1);
}
const target = path.join(modDir, file);
const mod = YAML.parse(fs.readFileSync(target, "utf8"));

const added: string[] = [];
function merge<T>(field: string, key: (x: T) => string) {
  const existing: T[] = mod[field] ?? [];
  const seen = new Set(existing.map((x) => key(x).trim().toLowerCase()));
  const fresh = ((draft[field] ?? []) as T[]).filter((x) => !seen.has(key(x).trim().toLowerCase()));
  if (fresh.length) {
    mod[field] = [...existing, ...fresh];
    added.push(`${fresh.length} ${field}`);
  }
}
merge<{ heading: string }>("notes", (n) => n.heading);
merge<{ title: string }>("examples", (e) => e.title);
merge<{ question: string }>("quiz", (q) => q.question);
merge<{ question: string }>("questions", (q) => q.question);
merge<{ term: string }>("terms", (t) => t.term);
merge<string>("traps", (t) => t);
merge<{ id: string }>("coding", (e) => e.id);

const backup = fs.readFileSync(target, "utf8");
fs.writeFileSync(target, YAML.stringify(mod, { lineWidth: 110, blockQuote: "literal" }));
try {
  loadCourse(courseId);
} catch (err) {
  fs.writeFileSync(target, backup);
  console.error(`✗ Merge produced invalid content, nothing changed:\n${err instanceof ContentError ? err.message : err}`);
  process.exit(1);
}
console.log(added.length ? `✓ ${path.relative(process.cwd(), target)}: added ${added.join(", ")}` : "Nothing new to add.");
