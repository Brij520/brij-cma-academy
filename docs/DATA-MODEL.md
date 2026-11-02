# Data model

All reference data lives in `data/` as JSON and is loaded at runtime through `data/manifest.json`. Personal data never leaves the browser.

## The manifest

```json
{
  "version": "2.0.0",
  "name": "PROJECT CMA",
  "lastUpdated": "2026-11-02",
  "datasets": [
    { "id": "papers", "path": "data/academics/papers.json", "label": "Papers and chapters", "required": true }
  ]
}
```

The `id` is the key used in `assets/js/data.js`. Adding a dataset means: create the file, add an entry here, and (if it needs indexing or a view) extend `loadData()`.

Dataset ids in use: `profile`, `priority`, `papers`, seven `knowledge*` files, `subjects`, `concepts`, `formulas`, `software`, `financeAcademy`, `fpa`, `markets`, `dataAi`, `communication`, `careers`, `certifications`, `cases`, `portfolio`, `examIntel`, `knowledgeSeed`, `performance`.

## Syllabus map — `data/academics/papers.json`

```json
{
  "meta": { "syllabus": "ICMAI Syllabus 2022", "lastVerified": "2026-11-02",
            "weightBasis": "Published section weights", "note": "…" },
  "levels": [{ "id": "foundation", "name": "Foundation", "order": 1 }],
  "papers": [{
    "id": "p05", "code": 5, "level": "intermediate", "group": "Group I",
    "name": "Business Laws and Ethics", "short": "BLE",
    "priority": 1, "target": "2026-12", "status": "active",
    "summary": "…",
    "sections": [{ "id": "A", "name": "Commercial Laws", "weight": 30 }],
    "chapters": [{ "id": "p05-c01", "no": 1, "section": "A",
                   "title": "Introduction to Law and Legal System in India",
                   "topics": ["…"] }]
  }]
}
```

Rules: section weights must sum to 100 per paper; chapter ids must be `<paperId>-cNN`; every chapter must reference a section that exists on its paper. The validator enforces all three.

## Chapter content — `data/academics/knowledge/*.json`

Two container shapes are accepted:

- single paper: `{ "paperId": "p05", "syllabus": "…", "lastReviewed": "…", "chapters": [...] }`
- bundled: `{ "scope": ["p09","p10","p11","p12"], "syllabus": "…", "lastReviewed": "…", "chapters": [...] }`

Chapter record:

```json
{
  "id": "p06-c01",
  "status": "complete",
  "summary": "…",
  "keyTerms": [{ "term": "…", "definition": "…" }],
  "formulas": [{ "name": "…", "expression": "…", "note": "…", "example": "…" }],
  "examples": [{ "title": "…", "problem": "…", "solution": "…", "lesson": "…" }],
  "questions": [{ "id": "p06-c01-q1", "q": "…", "type": "problem", "marks": 5,
                  "difficulty": "medium", "answer": "…", "tags": ["…"] }],
  "revisionNotes": ["…"],
  "pitfalls": ["…"],
  "linkedConcepts": ["c-double-entry"]
}
```

`status` is `complete` or `outline`. Only `id` and `status` are strictly required, so the map can exist before the prose; the UI reports content depth per chapter rather than pretending an empty chapter is finished.

## Reference indexes

| File | Shape | Purpose |
|---|---|---|
| `subjects.json` | `{ meta, categories[], subjects[] }` | Cross-paper lenses (e.g. Accounting Fundamentals) with chapter and skill links. |
| `concepts.json` | `{ meta, concepts[], paths[] }` | The dependency graph. `before` = prerequisites, `after` = unlocks, `paths` = named chains such as marginal costing → CVP → decisions. |
| `formulas.json` | `{ meta, categories[], formulas[] }` | Each formula links to its source chapter, which makes "why is this formula here?" answerable. |
| `skills/software.json` | `{ meta, tracks[], skills[] }` | 16 tools × 3 levels, each with modules, exercise, assessment, projects, portfolio deliverables and a certification pointer. |

## Academy datasets

- `finance-academy.json` — `{ meta, tracks[{ id, name, hours, level, outcome, modules[] }] }`; modules carry `papers[]` and `concepts[]` links.
- `fpa.json` — `{ meta, cycle, topics[15], projects[8], simulations[2] }`.
- `markets.json` — `{ meta: { disclaimer{ headline, body, rules[] } }, modules[16], projects[3], researchWorkflow[] }`. The disclaimer is mandatory.
- `data-ai.json` — `{ meta: { dataPolicy, principle }, pathway[3], automationProjects[8], capstone }`. Every automation project must carry a `guardrail`.
- `communication.json` — `{ meta, levels[4], areas[12], dailyPractice{ rotation, speakingPrompts, writingPrompts }, assessment }`.
- `careers.json` — `{ meta: { disclaimer }, roles[11], companyPreparation[4], portfolioGuidance }`. Roles carry the ten elements plus `progression` and `nextSkills`.

## Evidence and practice

- `cases.json` — six cases with `exhibits[{ title, columns[], rows[][] }]`, marks-weighted `questions`, `modelApproach[]` and `judgementPoints[]`. Row width must match column count.
- `portfolio.json` — `{ meta, documentationTemplate[8], complexityLevels[3], projects[28] }`.
- `exam-intel.json` — `{ meta.integrity, examCalendar, paperBlueprints, recurringThemes, questionLog, mockPlan, analyticsSpec, predictions }`. Predictions carry a `label` and live in their own section.
- `certifications.json` — `{ meta.verification{ rule, costBands, disclaimer }, entries[23], priorityOrder[5] }`.

## Personal systems

- `knowledge-seed.json` — `{ meta{ purpose, linkingPrinciple, example }, types[], entries[] }`. Seeded notes you can pin into your own notebook.
- `priority.json` — `{ meta{ governingRule }, priorities[6], examWindows[], timeBudget, escalationTriggers[] }`. Time-budget hours must sum to `weeklyAvailableHours`.
- `performance.json` — `{ meta, dailyLog{ fields[], targets }, metrics[6], learningScore, weeklyReview{ questions[6] }, monthlyReview, guardrails[] }`. Metric weights must sum to 100 and there must be exactly six weekly questions.
- `profile.json` — `{ meta, defaults, privacy, unlockPath[] }`.

## Browser state — `project-cma-v2`

```js
{
  version: 2, createdAt, profile: {},
  chapters: { "p06-c01": { status, confidence, attempts, correct, lastStudied } },
  attempts: [{ ts, qid, paperId, chapterId, correct, marks, seconds }],
  log: [{ id, date, studyHours, paperId, questionsAttempted, questionsCorrect,
          revisionMinutes, professionalHours, communicationMinutes, notes }],
  mocks: [{ id, date, paperId, score, max, mode, notes }],
  reviews: [{ id, weekEnding, answers: { wq1..wq6 }, score, savedAt }],
  cases: { "case-01": { status, answer, scores, updatedAt } },
  portfolio: { "pf-01": { status, docs: { section: text }, updatedAt } },
  certifications: { "cert-x": { status, updatedAt } },
  skills: { "skill-excel": { levels: { Beginner: { status, updatedAt } } } },
  notes: [{ id, title, type, body, tags[], chapter, formula, status, createdAt }],
  settings: { theme }
}
```

Log entries are unique by date: submitting twice merges into the same day, so a practice session enriches today's entry rather than creating a second one.

Attempts cap at 3,000 and log entries at 1,200 to bound storage use. Export produces this object with an `exportedAt` envelope; import accepts either the envelope or the raw state.
