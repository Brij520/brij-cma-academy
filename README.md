# PROJECT CMA

**An integrated CMA learning, professional-development and performance system.**

Built around one governing constraint: **CMA Intermediate Group I — December 2026 — comes first.** Every other module is ranked beneath it, and the interface says so on every relevant screen.

- Static site. No build step. No account. No tracking.
- All personal data stays in your browser (`localStorage`).
- Educational use only — not investment, tax, legal or audit advice.

```bash
python3 serve.py          # → http://localhost:8000
node tools/validate.mjs   # data integrity: 0 errors required
node tools/smoke.mjs      # renders every view headlessly
```

> Opening `index.html` directly from the filesystem will not work: browsers block ES modules and `fetch` on `file://`. Use `serve.py` (or any static server).

---

## 1. The priority hierarchy

The plan is enforced through time allocation, not good intentions.

| Rank | Priority | Target | Weekly hours | Share |
|---|---|---|---|---|
| 1 | CMA Intermediate Group I (Papers 5–8) | 10–17 Dec 2026 | 25 | 62% |
| 2 | CMA Intermediate Group II (Papers 9–12) | June 2027 | — | — |
| 3 | CMA Final (Papers 13–20) | after eligibility | — | — |
| 4 | Professional accounting and finance skills | continuous | 4 | 10% |
| 5 | AI, data and automation | continuous | 1.5 | 4% |
| 6 | Career, certifications and portfolio | continuous | — | — |

Governing rule: **professional development must never interfere with examination preparation.** In the 12 weeks before an exam window, ranks 4–6 pause except communication practice, which continues because it is cheap and compounds. Exam windows, gates and escalation triggers live in `data/priority.json`; the rules are applied in the UI rather than left as advice.

The unlock path is explicit: **CMA student → CMA professional → finance analyst → FP&A professional → strategic finance leader**, each stage with the evidence that opens it.

## 2. What is inside

### 2.1 Academic knowledge system
20 ICMAI Syllabus 2022 papers, 198 chapters mapped to sections and indicative marks, and 116 authored chapters. Group I (Papers 5–8) and the whole Foundation level are authored in depth: summaries, definitions, formulas, worked examples, revision notes, pitfalls, concept links and a question bank with worked answers (110 seeded questions).

Per chapter: syllabus topics, key terms, formulas, examples, questions, revision protocol, concept dependencies and a status/confidence record that drives revision scheduling.

### 2.2 Practice and revision engine
Weighted question sessions by paper, chapter and difficulty. Chapters you have not attempted or that sit below 60% accuracy are selected more often. Every answer updates chapter accuracy, the learning score and the revision queue. Sessions can be logged as study in one click.

### 2.3 Exam intelligence
- **Confirmed**: exam calendar and published section weights, each with a source and verification date.
- **Derived**: chapter-level indicative marks, computed arithmetically and labelled as such.
- **Predicted**: themes and emphasis, kept in a separately styled section and never mixed with confirmed information.
- Chapter heatmaps (syllabus weight vs your logged attempts), weakness diagnosis with an explicit minimum-evidence rule (three attempts), revision priority index and a mock plan.

No ICMAI question papers or suggested answers are reproduced — they are the Institute's intellectual property.

### 2.4 Professional academies (ranks 4–6)
| Academy | Content |
|---|---|
| Software (16 skills) | Excel → Advanced Excel, Power Query, Power Pivot, Power BI, DAX, Tally Prime, SAP FICO, Oracle Financials, SQL, Python for Finance, Financial Modelling, PowerPoint, Word, Google Workspace, AI Automation. Three levels each, with exercises, projects, assessments and portfolio deliverables. Free tools flagged. |
| Accounting & Finance (3 tracks, 33 modules) | Accounting, corporate finance, cost and management accounting for practice rather than marks alone. |
| FP&A and CFO | 15 topics, the planning cycle, two business simulations and the eight named projects (annual operating budget, three-statement model, monthly MIS, department profitability, cash-flow forecast, budget-variance dashboard, business performance review, management reporting presentation). |
| Financial markets | 16 modules across structure, instruments, valuation and risk, three simulated portfolios and a six-step research workflow. Simulated money only; education is explicitly separated from investment advice. |
| Data and AI | Three pathways (Python, SQL, applied AI) plus eight automation projects — MIS generator, invoice extraction, expense classification, financial-statement analyser, tax research assistant, budget-variance explainer, accounting Q&A assistant, reconciliation prototype — each with a written guardrail. |
| Communication | 12 finance-specific areas, a daily rotation of speaking and writing prompts, and a five-criterion rubric. Not generic English lessons. |

### 2.5 Case laboratory and portfolio
Six fictional companies (manufacturing, retail, banking, services, infrastructure, technology) with synthetic exhibits, marks-weighted questions, a model approach and separate business-judgement points. Marking rubric distinguishes technical accuracy from judgement.

The portfolio holds 28 candidate artefacts and an eight-section documentation template (business problem, data, methodology, analysis, results, limitations, recommendations, reflection). Synthetic or appropriately anonymised data only.

### 2.6 Career and certification layer
Eleven roles — management accountant, financial analyst, FP&A analyst, cost accountant, internal auditor, financial reporting analyst, tax analyst, business analyst, corporate finance analyst, finance transformation analyst, financial data analyst — each with qualifications, technical knowledge, software, experience expectations, assessments, interview questions, case studies, résumé requirements, portfolio projects and progression. Big Four / consulting / banking preparation is included.

23 certifications with eligibility, prerequisites, cost band, duration, curriculum, practical value and the official registration page. Free and low-cost options are prioritised; every entry is marked verify-before-use. **No certification is presented as a guaranteed job qualification.**

### 2.7 Personal knowledge management and performance
Tagged, searchable notes (definition, formula, legal provision, amendment, vocabulary, mistake, reference, project) with links to chapters, formulas and concepts — including the marginal-costing → break-even → contribution → profit-planning → CVP chain.

The performance layer measures learning, not activity: a weighted learning score (accuracy 25, mocks 25, revision 15, weakness improvement 15, artefacts 10, study hours only 10), a daily log with honest definitions, mock records, and the six-question weekly review:

1. What was completed?
2. What remains incomplete, and why?
3. Which concepts are still weak?
4. Which mistakes were repeated?
5. What needs more practice?
6. What is next week's priority?

## 3. Content status — stated plainly

| Level | Chapters mapped | Authored |
|---|---|---|
| Foundation (P1–P4) | 41 | 41 |
| Intermediate Group I (P5–P8) | 48 | 48 |
| Intermediate Group II (P9–P12) | 42 | 18 |
| Final (P13–P20) | 67 | 9 |
| **Total** | **198** | **116** |

Every chapter exists in the syllabus map and is navigable. Un-authored chapters render an honest "no authored summary yet" state rather than fabricated content. See [`docs/CONTENT-STATUS.md`](docs/CONTENT-STATUS.md) for the chapter list and the authoring convention.

## 4. Architecture

```
index.html                 shell, sidebar, drawer, toast
serve.py                   local static server with correct MIME types
assets/css/app.css         design system (dark/light, print)
assets/js/app.js           boot, router, nav, global search, quick log
assets/js/data.js          dataset loading, indexes, analytics, search
assets/js/store.js         localStorage state (project-cma-v2)
assets/js/ui.js            escaped HTML helpers, SVG charts, toasts
assets/js/views/           13 view modules (dashboard, academic, practice, …)
data/                      27 datasets, all fetched at runtime via manifest.json
tools/validate.mjs         structural + referential-integrity validator
tools/smoke.mjs            loads data, renders every view, flags broken output
tools/browser-test.mjs     jsdom: boots the app, walks 37 routes, runs a session
docs/                      architecture, data model, content status, sources
```

The app fetches `data/manifest.json`, then loads each dataset concurrently. Missing datasets degrade gracefully and are reported in **Settings → Dataset health**. No shared state exists outside `localStorage`; export/import is one JSON file.

Data-driven by design: adding a chapter means editing JSON, not the interface. See [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md).

## 5. Quality gates

| Command | Checks |
|---|---|
| `node tools/validate.mjs` | Required fields, unique ids, chapter/paper consistency, section weights summing to 100, metric weights summing to 100, weekly-review question count, cross-references, exhibit column counts, case-approach drafting artefacts, certification links. Errors fail; soft `c-*`/`skill-*` references warn. |
| `node tools/smoke.mjs` | Loads all 26 datasets, seeds a synthetic study history, renders all 28 view entry points and flags `undefined`, `NaN`, `[object Object]`, unbalanced markup, and unresolved formula/chapter/concept links. |
| `node tools/browser-test.mjs` | jsdom boot of the real app: nav, countdown, 37 routes, quick-log persistence, a full practice session, theme persistence, chapter status, weekly review. Requires `npm i` (jsdom is the only dev dependency). |

Current state: **0 validation errors · 49/49 smoke checks · 56/56 browser checks.**

## 6. Honest limitations

- **Law and tax figures date quickly.** Content states its position and review date. `data/academics/knowledge/p07.json` deliberately omits slab tables and rate bands and marks them “verify current figure” — the Income-tax Act, 2025 received assent on 21 August 2025 and is in force from 1 April 2026, while the 1961 Act still governs earlier tax years. Verify on the official source before relying on any number.
- **Chapter marks are indicative.** They are derived by splitting published section weights, not from ICMAI chapter-level guidance.
- **Predictions are predictions.** They are labelled, separately styled and must never shrink syllabus coverage.
- **No employment promise.** Certifications and projects are evidence of study; hiring depends on the employer, the market and your performance.
- **Synthetic data only.** Case companies are invented. Do not put employer or client data into the portfolio.
- **Coverage is partial beyond Group I.** 82 chapters are mapped but not yet authored.
- **Local-only storage.** Clearing site data deletes progress. Export a backup regularly.

## 7. Deploying

The site is pure static files. GitHub Pages works without changes:

1. Merge this branch into `main`.
2. Repository **Settings → Pages → Deploy from a branch → `main` / root**.
3. Open the published URL. `data/` and `assets/` are served as-is.

Any static host works (Netlify, Cloudflare Pages, S3). No server-side code is required; `serve.py` exists only for local development.

## 8. Sources

Syllabus structure follows the ICMAI **Syllabus 2022** curriculum; the December 2026 timetable was verified on 2 November 2026; direct-tax transition detail follows the Income-tax Act, 2025. Full source log with dates and what each source was used for: [`docs/SOURCES.md`](docs/SOURCES.md).

---

Educational use only. Not investment, tax or legal advice. Certified qualifications are not guaranteed employment. Verify every fee, date and legal figure on the official source before relying on it.
