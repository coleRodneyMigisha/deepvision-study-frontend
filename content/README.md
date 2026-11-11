# Course content

Every course unit is a folder of YAML files. The site, the AI buddy, the grader and the backend
all read from here, so **adding a course never requires touching application code**.

```
content/courses/
  ds/
    course.yaml                    # metadata, AI persona, formulas, exam bank
    modules/
      01-data-cleaning.yaml        # one file per module, ordered by filename
      02-pipelines-parquet.yaml
      ...
```

Content is validated at build time (`npm run content`) by `src/lib/content/schema.ts`. A mistake
fails the build with the exact file and field, e.g.
`content/courses/ds/modules/03-star-schemas.yaml: quiz.2.answer: answer index is out of range`.

## Adding a course unit

1. **Create the folder** `content/courses/<id>/` — the id is short, lowercase and becomes the URL
   (`/nlp/`). Use the same id for the backend's `resources/<id>/` folder.
2. **Write `course.yaml`** (copy one from another course):

   ```yaml
   id: nlp
   code: CSC3201
   title: Natural Language Processing
   shortTitle: NLP
   tagline: Tokens to transformers — the one-line pitch shown on cards.
   accent: "#7048E8"              # course colour
   persona: >                     # how the AI examiner/buddy should behave for this course
     You are an expert NLP lecturer examining university students…
   formulas:
     - { name: Softmax, expr: "softmax(z)_i = e^{z_i} / Σ_j e^{z_j}" }
   exam:
     durationMinutes: 10          # oral exam length
     written:                     # exam-bank questions (also used by the mock exam)
       - prompt: Explain self-attention…
         module: attention        # must match a module id
         keywords: [query, key, value, softmax, scaled]
         idealAnswer: …
   ```

3. **Add modules** — `modules/01-<module-id>.yaml`, one per topic:

   ```yaml
   id: attention
   title: Attention & Transformers
   subtitle: One line under the title
   recap: The "In one minute" summary (3–5 sentences).
   traps:                          # mistakes examiners look for
     - Forgetting the √d scaling…
   lesson:
     checkpointStep: 3             # step where the checkpoint question interrupts (-1 = none)
     steps:                        # the step-through lesson, one caption per step
       - Words become vectors…
       - …
   checkpoint:
     question: …
     hint: …
     keywords: [ … ]
     idealAnswer: …
   notes:                          # the deep study notes (Markdown)
     - heading: Why attention?
       body: |
         Paragraphs, **bold**, lists, tables and code blocks all work.
   examples:                       # worked examples, revealed step by step
     - title: Attention by hand
       problem: Given Q = …, compute …
       steps: [ "Step 1 …", "Step 2 …" ]
       answer: …
       takeaway: …
   terms:
     - { term: Query, definition: … }
   quiz:                           # multiple choice; `answer` is the 0-based index
     - question: …
       options: [ A, B, C, D ]
       answer: 2
       explanation: …
   questions:                      # exam-style written practice, graded by the AI
     - question: …
       kind: long                  # short | long
       marks: 10
       keywords: [ … ]
       idealAnswer: …
   fact: { title: …, body: … }     # optional "did you know"
   videos:                         # optional pinned videos (AI adds fresh ones daily)
     - { youtubeId: dQw4w9WgXcQ, title: …, note: why it's worth watching }
   lab:                            # optional — enables /<course>/labs/<module>/
     title: …
     variations:                   # fixed numeric challenges
       - title: …
         question: "May use <b> and <code>."
         answer: 42
         tolerance: 0
         hint: …
         explanation: …
   ```

4. **Run `npm run dev`** — the course appears on the home page, with lessons, notes, quizzes,
   exams, guide and buddy support. That's it.

### Optional code for a course

Two things can't be YAML and are optional:

- **Lesson animations** — `src/courses/<id>/scenes.ts`, one canvas scene per module id
  (see `src/lib/scene/kit.ts`). Without one, lessons show the steps as large text cards.
- **Interactive labs** — `src/courses/<id>/labs.ts(x)`, one `LabDef` per module id
  (see `src/lib/lab/types.ts` and the existing courses). Without one, the lab page still offers the
  YAML variations and AI-generated challenges.

Register them in `src/courses/index.ts`. `npm test` then checks that every lab renders, every daily
challenge is deterministic, and every lab goal is reachable but not already met.

## Coding exercises

Add a `coding:` list to any module. Python and SQL exercises run **in the student's browser**
(Pyodide — CPython + numpy, pandas, scikit-learn, scipy, pydantic and DuckDB compiled to WebAssembly);
`review` exercises are written code checked by the AI against a rubric.

```yaml
coding:
  - id: days-over-capacity
    title: days_over_capacity (two-stage aggregation)
    language: sql                 # python | sql | review
    level: exam                   # warm-up | core | exam
    files: [milk_clean.csv]       # from content/courses/<id>/data/, placed in the working directory
    setup: |                      # hidden; Python for python exercises, SQL for sql exercises
      CREATE TABLE milk AS SELECT * FROM read_csv_auto('milk_clean.csv');
    compare: ordered              # sql: compare the student's last query with the solution (rows | ordered | none)
    prompt: |                     # Markdown
      …
    starter: |
      SELECT …
    solution: |
      WITH daily AS (…) SELECT …
    tests:                        # hidden Python asserts (SQL tests can use `con`, `result`, `expected`)
      - name: Every delivery is kept
        code: |
          assert con.execute("SELECT COUNT(*) FROM fact_delivery").fetchone()[0] == 586
    hints: [ … ]
    rubric: [ … ]                 # required for review exercises; also guides "Review my code"
```

Before committing, run **`npm run verify:exercises`** (needs `uv`): it runs every solution against its
tests with the same harness the browser uses (`public/coding/harness.py`) and checks that the starter
code does **not** pass — so no broken or toothless exercise ships.

## Deeper content from lecture materials

Put the lecturer's slides, notes, lab sheets and past papers in the **backend** repo under
`resources/<course-id>/` and push — the AI uses them for every answer. To turn them into permanent
course content:

```bash
# backend repo (needs GEMINI_API_KEY in backend/.env)
uv run studyroom index
uv run studyroom draft ds data-cleaning --instructions "past-paper style questions"
# frontend repo — review content/drafts/ds--data-cleaning.yaml, then:
npm run content:merge -- ds--data-cleaning.yaml
```

The merge only adds new notes/examples/questions/terms (nothing is overwritten) and re-validates the
course; if the result is invalid the file is left untouched.

## YAML gotchas

Inside `[a, b, c]` lists, quote any item that contains `[ ] { } , : #` or starts with a quote or
backtick, and quote words YAML treats specially — `null`, `true`, `false` — when you mean the text:
`options: ["NULL", "map@[.5:.95]", "Each adds 2: 3 → 5"]`. Plain numbers (`[200, 404]`) are fine;
they're turned into text. When in doubt, use block lists (`- item` on separate lines).
