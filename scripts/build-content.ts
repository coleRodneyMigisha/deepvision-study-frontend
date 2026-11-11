/**
 * Validates every course pack and publishes it as JSON for the backend:
 *   public/content/courses/index.json
 *   public/content/courses/<id>.json
 * Runs automatically before `next dev` and `next build`.
 */
import fs from "node:fs";
import path from "node:path";
import { CONTENT_ROOT, ContentError, loadAllCourses, toApiJson } from "../src/lib/content/pack.ts";

const OUT = path.join(process.cwd(), "public", "content", "courses");

try {
  const courses = loadAllCourses();
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  for (const c of courses) {
    fs.writeFileSync(path.join(OUT, `${c.id}.json`), JSON.stringify(toApiJson(c)));
    // Datasets for coding labs: public/content/courses/<id>/data/*
    const data = path.join(CONTENT_ROOT, c.id, "data");
    if (fs.existsSync(data)) fs.cpSync(data, path.join(OUT, c.id, "data"), { recursive: true });
  }
  const index = { courses: courses.map((c) => ({ id: c.id, code: c.code, title: c.title, shortTitle: c.shortTitle })) };
  fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index));
  const modules = courses.reduce((n, c) => n + c.modules.length, 0);
  console.log(`✓ content: ${courses.length} courses, ${modules} modules → public/content/courses`);
} catch (err) {
  if (err instanceof ContentError) {
    console.error(`\n✗ Course content error\n${err.message}\n`);
    process.exit(1);
  }
  throw err;
}
