/* Smoke test: load the datasets, render every view, and flag broken output.
   Usage: node tools/smoke.mjs
   Runs without a browser — data loading is served from disk. */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};

globalThis.fetch = async (url) => {
  const file = path.join(ROOT, String(url));
  if (!fs.existsSync(file)) return { ok: false, status: 404, json: async () => ({}) };
  return { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(file, "utf8")) };
};

const { loadData, D, dataErrors, paperProgress, learningScore, searchAll } = await import("../assets/js/data.js");
const store = await import("../assets/js/store.js");

const result = await loadData();
console.log(`datasets: ${D.loadedIds.length}/${D.manifest.datasets.length} loaded`);
if (result.errors.length) {
  console.log("load errors:");
  result.errors.forEach((e) => console.log("  -", e));
}

/* a synthetic state so the analytics have something to chew on */
const chapterIds = D.chapters.filter((c) => ["p05", "p06", "p07", "p08", "p09", "p10", "p11", "p12"].includes(c.paperId)).slice(0, 30).map((c) => c.id);
chapterIds.forEach((id, i) => {
  store.setChapterStatus(id, ["studying", "revising", "confident"][i % 3]);
  store.recordAttempt({ qid: `t-${i}`, paperId: D.chapterById[id].paperId, chapterId: id, correct: i % 4 !== 0, marks: 5 });
});
for (let i = 0; i < 10; i++) {
  const d = new Date();
  d.setDate(d.getDate() - i);
  store.addLog({ date: d.toISOString().slice(0, 10), studyHours: 3 + (i % 3), paperId: "p06", questionsAttempted: 12, questionsCorrect: 8, revisionMinutes: 30, topics: "variances" });
}
store.addMock({ date: new Date().toISOString().slice(0, 10), paperId: "p06", score: 58, max: 100, mode: "Full length", notes: "Ran out of time on Q5" });

const checks = [];
const expect = (label, cond, detail = "") => checks.push({ label, cond, detail });

expect("manifest loaded", !!D.manifest);
expect("20 papers", D.papers.length === 20, `${D.papers.length}`);
expect("all chapters indexed", D.chapters.length > 100, `${D.chapters.length} chapters`);
expect("questions indexed", D.questions.length > 80, `${D.questions.length} questions`);
expect("formulas loaded", D.formulas.length > 50, `${D.formulas.length}`);
expect("concepts loaded", D.concepts.length > 50, `${D.concepts.length}`);
expect("certifications loaded", (D.certifications.entries || []).length > 10);
expect("cases loaded", (D.cases.cases || []).length === 6);
expect("portfolio projects", (D.portfolio.projects || []).length === 28);
expect("priority ranks", (D.priority.priorities || []).length === 6);
expect("performance metrics", (D.performance.metrics || []).length === 6);
expect("six weekly questions", (D.performance.weeklyReview?.questions || []).length === 6);
expect("knowledge seed entries", (D.knowledgeSeed.entries || []).length >= 20);
expect("search works", searchAll("break-even").length > 0, `${searchAll("break-even").length} hits`);

const score = learningScore(store.get());
expect("learning score computes", Number.isFinite(score.score), JSON.stringify(score.components));
expect("score in range", score.score >= 0 && score.score <= 100, String(score.score));
expect("p05 progress > 0 after mock state", paperProgress(store.get(), "p05") > 0, String(paperProgress(store.get(), "p05")));

/* render every view */
const views = [
  ["dashboard.js", "render", {}, {}],
  ["dashboard.js", "renderSearch", {}, { query: { q: "variance" } }],
  ["priority.js", "render", {}, {}],
  ["academic.js", "renderPapers", {}, { query: {} }],
  ["academic.js", "renderPaper", {}, { params: ["p05"] }],
  ["academic.js", "renderChapter", {}, { params: ["p06-c01"], query: {} }],
  ["academic.js", "renderSubjects", {}, { query: {} }],
  ["academic.js", "renderConcepts", {}, { query: { focus: "c-break-even" } }],
  ["formulas.js", "render", {}, { query: {} }],
  ["practice.js", "render", {}, { query: {} }],
  ["performance.js", "render", {}, {}],
  ["exam.js", "render", {}, { query: { paper: "p07" } }],
  ["knowledge.js", "render", {}, { query: {} }],
  ["skills.js", "renderAcademies", {}, {}],
  ["skills.js", "renderAcademy", {}, { params: ["software"] }],
  ["skills.js", "renderAcademy", {}, { params: ["finance"] }],
  ["skills.js", "renderAcademy", {}, { params: ["fpa"] }],
  ["skills.js", "renderAcademy", {}, { params: ["markets"] }],
  ["skills.js", "renderAcademy", {}, { params: ["data-ai"] }],
  ["skills.js", "renderAcademy", {}, { params: ["communication"] }],
  ["skills.js", "renderSkill", {}, { params: ["skill-excel"] }],
  ["cases.js", "renderCases", {}, { query: {} }],
  ["cases.js", "renderCase", {}, { params: ["case-01"], query: { tab: "exhibits" } }],
  ["portfolio.js", "render", {}, { query: {} }],
  ["certifications.js", "render", {}, { query: {} }],
  ["careers.js", "render", {}, {}],
  ["careers.js", "render", {}, { params: ["role-management-accountant"] }],
  ["settings.js", "render", {}, {}],
];

for (const [file, fn, , ctx] of views) {
  try {
    const mod = await import(`../assets/js/views/${file}`);
    const html = mod[fn](ctx);
    const bad = ["undefined", "NaN", "[object Object]", "null marks"].filter((t) => html.includes(t));
    expect(`${file}:${fn}`, typeof html === "string" && html.length > 200 && bad.length === 0, `${html.length} chars${bad.length ? ` · suspicious: ${bad.join(", ")}` : ""}`);
    const open = (html.match(/<details/g) || []).length;
    const close = (html.match(/<\/details>/g) || []).length;
    if (open !== close) expect(`${file}:${fn} details balance`, false, `${open} open / ${close} close`);
  } catch (err) {
    expect(`${file}:${fn}`, false, err.message);
  }
}

/* cross-reference scan on the data itself */
const chapterIdsSet = new Set(D.chapters.map((c) => c.id));
const formulaIds = new Set(D.formulas.map((f) => f.id));
const conceptIds = new Set(D.concepts.map((c) => c.id));
const skillIds = new Set((D.software.skills || []).map((s) => s.id));
const missingF = D.formulas.filter((f) => f.source && !chapterIdsSet.has(f.source));
const missingK = (D.knowledgeSeed.entries || []).filter((e) => (e.links?.chapters || []).some((c) => !chapterIdsSet.has(c)));
const missingKC = (D.knowledgeSeed.entries || []).filter((e) => (e.links?.concepts || []).some((c) => !conceptIds.has(c)));
expect("formula sources resolve", missingF.length === 0, missingF.map((f) => `${f.id}->${f.source}`).join(", "));
expect("knowledge chapter links resolve", missingK.length === 0, missingK.map((e) => e.id).join(", "));
expect("knowledge concept links resolve", missingKC.length === 0, missingKC.map((e) => e.id).join(", "));
expect("knowledge formula links resolve", (D.knowledgeSeed.entries || []).every((e) => (e.links?.formulas || []).every((f) => formulaIds.has(f))));

const failed = checks.filter((c) => !c.cond);
checks.forEach((c) => {
  if (!c.cond) console.log(`FAIL  ${c.label}${c.detail ? ` — ${c.detail}` : ""}`);
});
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
if (dataErrors().length) console.log("dataset warnings:", dataErrors());
process.exit(failed.length ? 1 : 0);
