# StudyRoom — web

The study-buddy website: step-through lessons, deep notes, worked examples, guided labs, mock exams,
a revision guide and an AI buddy that sees what you're working on. Next.js 15 (App Router, static
export) + Tailwind 4, deployed on Cloudflare Pages. AI features call the
[StudyRoom API](https://github.com/coleRodneyMigisha/deepvision-study) on Render.

## Quick start

```bash
nvm use            # Node 24 (see .nvmrc)
npm install
npm run dev        # http://localhost:3000
```

To use a local backend, create `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8000`
(or change it at runtime from the status pill → AI connection).

| Script | What it does |
| --- | --- |
| `npm run dev` | validate content, then run the dev server |
| `npm run build` | validate content and export the static site to `out/` |
| `npm run content` | validate YAML and publish `public/content/courses/*.json` for the backend |
| `npm run content:merge -- <draft>` | merge a reviewed AI draft into a module (see `content/README.md`) |
| `npm test` | content validation + lab integrity tests + unit tests |
| `npm run verify:exercises` | run every coding exercise's solution and starter against its hidden tests (needs `uv`) |
| `npm run typecheck` | TypeScript |

## How it's organised

```
content/courses/<id>/          course packs — YAML, the single source of truth (see content/README.md)
scripts/                       build-content.ts (YAML → validated JSON), merge-draft.ts
src/
  app/                         routes
    page.tsx                   home: courses, streak graph
    [course]/                  course map (learning path + exam readiness)
      learn/[module]/          lesson: scene player, checkpoint, recap, notes, examples, terms, quiz, practice, videos
      labs/ , labs/[module]/   guided labs: predict → experiment → explain → code it → challenge
      exam/                    mock exam: mixed paper or oral, with a per-topic report
      guide/                   printable revision guide
  components/
    buddy/                     the study buddy (avatar, chat panel)
    coding/                    coding labs: CodeMirror editor, runner UI, AI review
    lesson/ lab/ exam/ practice/ home/ course/ shell/ ui/
  courses/<id>/                optional code per course: scenes.ts (canvas lessons), labs.ts(x)
  courses/index.ts             registry of that code
  lib/
    content/                   schema (zod), loader, server helpers
    api.ts                     backend client (JSON + SSE streaming)
    buddy.ts                   buddy state; pages register what's on screen via useBuddyPage()
    progress.ts                progress, mastery, activity/streaks (localStorage)
    lab/ scene/                lab and scene frameworks
public/coding/                 harness.py (runs exercises + hidden tests) and py-worker.mjs (Pyodide Web Worker)
tests/                         node:test suites (run with tsx)
```

**Adding a course** is a content task — see [`content/README.md`](content/README.md).

### The study buddy

Every page calls `useBuddyPage({ courseId, moduleId, context })` describing what the student sees:
the lesson step, lab control values and outputs, the task they're on, their last answer and score.
The backend grounds replies in that context, the module's content and the lecturer's resources, and
streams them back. Modes — nudge, hint, walkthrough, explain, quiz — change how much it gives away.

### Progress & streaks

Everything is stored in the browser (`localStorage`, keys `studyroom:v3:*`); progress from the old
site is imported automatically. Any meaningful action (answer graded, quiz answered, lab goal reached,
buddy question) counts toward the day's square in the streak graph.

## Deploying (Cloudflare Pages)

The project is now built, so update the Pages project once:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js (Static HTML Export) — or None |
| Build command | `npm run build` |
| Build output directory | `out` |
| Environment variable | `NEXT_PUBLIC_API_URL` = your Render URL (optional; defaults to `https://deepvision-study-backend.onrender.com`) |

Node 24 is picked up from `.nvmrc`. `public/_headers` sets security and caching headers, and allows
the backend to fetch `/content/courses/*.json`.
