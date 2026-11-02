# Architecture

## Shape of the system

PROJECT CMA is a static single-page application with no build step, no framework and no server-side code.

```
browser
 ├─ index.html            shell: sidebar, topbar, main, drawer, toast
 ├─ assets/css/app.css    design tokens + components (dark/light, print)
 └─ assets/js
     ├─ app.js            boot → data load → chrome → router
     ├─ data.js           dataset loading, indexes, analytics, search
     ├─ store.js          localStorage state and mutations
     ├─ ui.js             escaped templates, SVG charts, toasts
     └─ views/*.js        one module per screen area
```

Everything is an ES module. Views are imported lazily by the router, so a broken view cannot stop the shell from booting; the failure is contained to that screen.

## Boot sequence

1. `app.js` calls `loadData()`.
2. `data.js` fetches `data/manifest.json`.
3. Every dataset in the manifest is fetched concurrently with `Promise.allSettled`.
4. Failures are collected, not thrown: the app runs with the datasets that loaded, and **Settings → Dataset health** lists what is missing.
5. Indexes are built: papers → chapters (flat, with `paperId`), chapter content merged from the seven knowledge files, questions flattened, concepts/formulas indexed by id.
6. `store.load()` reads `project-cma-v2` from `localStorage`, migrating older shapes.
7. Chrome renders: navigation, countdown chip, sidebar status.
8. The router resolves the hash and mounts the view.

If the initial load fails (typically because the page was opened via `file://`), the shell replaces the spinner with an explicit instruction to use `serve.py`.

## Routing

Hash-based, so it works on any static host without rewrite rules.

| Route | View |
|---|---|
| `#/` | Dashboard — what to do next |
| `#/priority` | Priority hierarchy, gates, time budget |
| `#/papers`, `#/paper/:id`, `#/chapter/:id` | Academic library |
| `#/subjects`, `#/concepts`, `#/formulas` | Cross-paper indexes |
| `#/practice` | Practice engine |
| `#/performance`, `#/exam` | Analytics and exam intelligence |
| `#/knowledge` | Personal knowledge base |
| `#/academies`, `#/academy/:id`, `#/skill/:id` | Professional academies |
| `#/cases`, `#/case/:id` | Case laboratory |
| `#/portfolio`, `#/certifications`, `#/careers` | Career layer |
| `#/settings` | Profile, backup, dataset health |
| `#/search?q=` | Global search results |

Each view module exports a `render(ctx)` that returns HTML and an optional `mount(ctx)` for event handlers. `ctx` is `{ params, query, path, view }`.

## State and rendering

`store.js` holds one object, persisted to `project-cma-v2` after every mutation and broadcast to subscribers.

- The **shell** subscribes all the time (status line, countdown).
- The **current view** re-renders only when a view explicitly dispatches `pcm:refresh` after a mutation. This is deliberate: auto-rerendering on every keystroke-level state change would destroy in-progress practice sessions and half-filled forms.

Consequences worth knowing:

- A practice session holds its own local state; answering questions records attempts but does not re-render the session.
- After deleting a log entry, saving a review, pinning a note, changing a chapter status or moving a portfolio item, the view dispatches a refresh and re-reads state.

### Why not a reactive framework

The app is read-mostly: 198 chapters, 110 questions, 110 formulas, 100 concepts are static reference data. The only mutable state is the student's own record. A framework would add a build step and a dependency for no benefit at this scale.

## Analytics

`data.js` owns the derived numbers so that views stay presentational:

- **Chapter marks** — section weight split evenly across that section's chapters. Labelled indicative everywhere it appears.
- **Paper progress** — chapter status weighted by indicative marks, so a large chapter counts more than a small one.
- **Accuracy** — from recorded attempts per chapter, and a rolling 7-day window.
- **Weakness** — accuracy below 60% with at least three attempts; fewer attempts is "insufficient evidence", never "strong".
- **Revision due** — studied more than seven days ago, ordered by marks at stake.
- **Learning score** — weighted composite: accuracy 25, mocks 25, revision consistency 15, weakness improvement 15, artefacts 10, study hours 10. Hours are capped at the daily target so over-logging cannot buy points.
- **Search** — an in-memory index across chapters, formulas, concepts, subjects, skills and definitions.

## Failure behaviour

| Failure | Behaviour |
|---|---|
| A dataset is missing or invalid | Loaded set continues; the screen renders; Settings lists it as missing. |
| A view throws while importing | "This page failed to load" with the error, shell intact. |
| A view throws while rendering | "This page could not be rendered" — the rest of the app is unaffected. |
| `localStorage` full or blocked | Persistence warns in the console; the session continues in memory. |
| Import of an invalid backup | Rejected with a message; existing data untouched. |

## Accessibility and printing

- Skip-to-content link, landmark roles, focus styles, `aria-label` on icon buttons.
- Charts are inline SVG with `role="img"` and an `aria-label`; every chart has a table or text equivalent nearby.
- Controls are real `<button>`, `<a>`, `<select>` elements, so keyboard navigation works without custom handling.
- `@media print` hides navigation, tabs and buttons, and the formula database prints as a revision sheet.

## Testing

- `tools/validate.mjs` — data contract. Errors fail CI; warnings surface soft cross-reference gaps.
- `tools/smoke.mjs` — imports `data.js`, seeds a synthetic study history, then calls every view's `render` and inspects the output for broken interpolation. No browser required.
- `tools/browser-test.mjs` — jsdom: boots `app.js`, walks all routes, opens the quick-log drawer, submits a log, runs a full practice session, toggles the theme, saves a review, and asserts persistence.

These three are deliberately independent: the validator can pass while a view is broken, and the browser test can pass while a dataset is malformed.
