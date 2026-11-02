#!/usr/bin/env node
/* PROJECT CMA — dataset validator.
   Checks structure, required fields and referential integrity across every dataset.
   Errors fail the run; soft cross-references (c-* concepts, skill-* ids) are warnings.

   Usage: node tools/validate.mjs [--strict]
*/

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const strict = process.argv.includes("--strict");

const errors = [];
const warnings = [];
const err = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

const read = (rel) => {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    err(`missing file: ${rel}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    err(`${rel}: invalid JSON — ${e.message}`);
    return null;
  }
};

const isArr = (v) => Array.isArray(v);
const nonEmpty = (v) => typeof v === "string" && v.trim().length > 0;
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const req = (obj, keys, where) => {
  if (!obj || typeof obj !== "object") return err(`${where}: not an object`);
  keys.forEach((k) => {
    if (obj[k] === undefined || obj[k] === null || obj[k] === "") err(`${where}: missing "${k}"`);
  });
};
const unique = (list, key, where) => {
  const seen = new Set();
  list.forEach((item) => {
    const v = item?.[key];
    if (v === undefined) return;
    if (seen.has(v)) err(`${where}: duplicate ${key} "${v}"`);
    seen.add(v);
  });
};

/* ---------------- manifest ---------------- */

const manifest = read("data/manifest.json");
const loaded = {};
if (manifest) {
  req(manifest, ["version", "name", "datasets"], "manifest");
  if (!isArr(manifest.datasets)) err("manifest.datasets must be an array");
  else {
    unique(manifest.datasets, "id", "manifest.datasets");
    manifest.datasets.forEach((ds, i) => {
      req(ds, ["id", "path", "label"], `manifest.datasets[${i}]`);
      if (ds.path && !fs.existsSync(path.join(ROOT, ds.path))) err(`manifest: ${ds.path} does not exist`);
      if (ds.path) loaded[ds.id] = read(ds.path);
    });
  }
}

/* ---------------- papers and chapters ---------------- */

const papersDoc = loaded.papers;
const papers = papersDoc?.papers || [];
const paperIds = new Set(papers.map((p) => p.id));
const chapterIds = new Set();
const chapters = [];
const paperById = Object.fromEntries(papers.map((p) => [p.id, p]));

if (!papers.length) err("papers.json: no papers found");
unique(papers, "id", "papers");
papers.forEach((p) => {
  req(p, ["id", "name", "short", "level"], `paper ${p.id || "?"}`);
  if (!/^p\d{2}$/.test(p.id || "")) err(`paper ${p.id}: id should look like p05`);
  if (!isArr(p.sections)) err(`paper ${p.id}: sections must be an array`);
  else {
    const total = p.sections.reduce((a, s) => a + (Number(s.weight) || 0), 0);
    if (Math.abs(total - 100) > 0.01) err(`paper ${p.id}: section weights sum to ${total}, expected 100`);
  }
  if (!isArr(p.chapters) || !p.chapters.length) err(`paper ${p.id}: no chapters`);
  (p.chapters || []).forEach((c) => {
    req(c, ["id", "no", "title"], `chapter in ${p.id}`);
    if (!String(c.id).startsWith(`${p.id}-`)) err(`chapter ${c.id}: id does not match paper ${p.id}`);
    if (!String(c.id).startsWith(`${p.id}-c`)) err(`chapter ${c.id}: expected ${p.id}-cNN`);
    if (chapterIds.has(c.id)) err(`duplicate chapter id ${c.id}`);
    chapterIds.add(c.id);
    const sectionIds = (p.sections || []).map((s) => s.id);
    if (c.section && !sectionIds.includes(c.section)) err(`chapter ${c.id}: unknown section "${c.section}"`);
    chapters.push({ ...c, paperId: p.id });
  });
});

/* ---------------- knowledge files ---------------- */

const knowledgeFiles = {
  knowledgeFoundation: "foundation.json",
  knowledgeP05: "p05.json",
  knowledgeP06: "p06.json",
  knowledgeP07: "p07.json",
  knowledgeP08: "p08.json",
  knowledgeInter2: "intermediate-2.json",
  knowledgeFinal: "final.json",
};
const contentChapters = new Map();
const questionIds = new Set();

Object.entries(knowledgeFiles).forEach(([key, file]) => {
  const doc = loaded[key];
  if (!doc) return;
  if (!isArr(doc.chapters)) return err(`${file}: chapters must be an array`);
  if (!doc.scope && !doc.paperId) warn(`${file}: no scope/paperId declared`);
  (doc.chapters || []).forEach((c) => {
    if (!c.id) return err(`${file}: chapter without id`);
    if (!chapterIds.has(c.id)) return err(`${file}: chapter ${c.id} is not mapped in papers.json`);
    if (contentChapters.has(c.id)) err(`duplicate content for chapter ${c.id}`);
    contentChapters.set(c.id, c);
    if (c.status && !["complete", "outline"].includes(c.status)) warn(`${c.id}: unusual status "${c.status}"`);
    (c.keyTerms || []).forEach((t, i) => {
      if (!t.term || !t.definition) err(`${c.id}: keyTerms[${i}] needs term and definition`);
    });
    (c.questions || []).forEach((q, i) => {
      req(q, ["id", "q", "answer"], `${c.id}.questions[${i}]`);
      if (q.id && questionIds.has(q.id)) err(`duplicate question id ${q.id}`);
      if (q.id) questionIds.add(q.id);
      if (q.marks !== undefined && !isNum(q.marks)) err(`${q.id}: marks must be a number`);
    });
    (c.linkedConcepts || []).forEach((cid) => {
      if (!String(cid).startsWith("c-")) warn(`${c.id}: linked concept "${cid}" is not a c-* id`);
    });
  });
});

const missingContent = chapters.filter((c) => !contentChapters.has(c.id));
if (missingContent.length) {
  warn(`${missingContent.length} chapters have no authored content (visible as empty in the library)`);
}

/* ---------------- concept + formula indexes ---------------- */

const conceptsDoc = loaded.concepts;
const concepts = conceptsDoc?.concepts || [];
const conceptIds = new Set(concepts.map((c) => c.id));
unique(concepts, "id", "concepts");
concepts.forEach((c) => {
  req(c, ["id", "label", "domain", "level"], `concept ${c.id || "?"}`);
  (c.papers || []).forEach((p) => {
    if (!paperIds.has(p)) err(`concept ${c.id}: unknown paper ${p}`);
  });
  ["before", "after"].forEach((side) => {
    (c[side] || []).forEach((other) => {
      if (!conceptIds.has(other)) warn(`concept ${c.id}.${side}: "${other}" is not in the concept graph`);
    });
  });
});
(conceptsDoc?.paths || []).forEach((p) => {
  req(p, ["id", "name", "sequence"], `concept path ${p.id || "?"}`);
  (p.sequence || []).forEach((cid) => {
    if (!conceptIds.has(cid)) err(`path ${p.id}: unknown concept ${cid}`);
  });
});

const formulasDoc = loaded.formulas;
const formulas = formulasDoc?.formulas || [];
const formulaIds = new Set(formulas.map((f) => f.id));
unique(formulas, "id", "formulas");
formulas.forEach((f) => {
  req(f, ["id", "name", "expression"], `formula ${f.id || "?"}`);
  if (f.source && !chapterIds.has(f.source)) warn(`formula ${f.id}: source "${f.source}" is not a mapped chapter`);
});

/* ---------------- subjects ---------------- */

(loaded.subjects?.subjects || []).forEach((s) => {
  req(s, ["id", "name", "category"], `subject ${s.id || "?"}`);
  (s.papers || []).forEach((p) => {
    if (!paperIds.has(p)) err(`subject ${s.id}: unknown paper ${p}`);
  });
  (s.chapters || []).forEach((c) => {
    if (!chapterIds.has(c)) warn(`subject ${s.id}: unknown chapter ${c}`);
  });
  (s.skills || []).forEach((sk) => {
    if (!String(sk).startsWith("skill-")) warn(`subject ${s.id}: "${sk}" is not a skill-* id`);
  });
});
const subjectCats = new Set((loaded.subjects?.categories || []).map((c) => c.id));
(loaded.subjects?.subjects || []).forEach((s) => {
  if (s.category && !subjectCats.has(s.category)) err(`subject ${s.id}: unknown category ${s.category}`);
});

/* ---------------- software skills ---------------- */

const skillsDoc = loaded.software;
const skills = skillsDoc?.skills || [];
const skillIds = new Set(skills.map((s) => s.id));
unique(skills, "id", "software.skills");
skills.forEach((s) => {
  req(s, ["id", "name", "track", "levels"], `skill ${s.id || "?"}`);
  if (!String(s.id).startsWith("skill-")) err(`skill ${s.id}: id should start with skill-`);
  if (!isArr(s.levels) || s.levels.length !== 3) err(`skill ${s.id}: expected three levels, found ${s.levels?.length}`);
  (s.levels || []).forEach((l) => {
    req(l, ["level", "outcomes", "modules", "assessment"], `${s.id} ${l.level || "?"}`);
    if (l.assessment && (!isArr(l.assessment.items) || !l.assessment.items.length)) err(`${s.id} ${l.level}: assessment has no items`);
  });
  (s.prerequisites || []).forEach((p) => {
    if (!skillIds.has(p)) warn(`skill ${s.id}: prerequisite "${p}" not found`);
  });
  if (s.totalHours && isArr(s.levels)) {
    const sum = s.levels.reduce((a, l) => a + (Number(l.hours) || 0), 0);
    if (sum && Math.abs(sum - s.totalHours) > 0.01) warn(`skill ${s.id}: level hours sum to ${sum}, totalHours says ${s.totalHours}`);
  }
});

/* ---------------- academy datasets ---------------- */

const checkPaperLinks = (list, where) => {
  (list || []).forEach((p) => {
    if (!paperIds.has(p)) err(`${where}: unknown paper ${p}`);
  });
};
const checkConceptLinks = (list, where) => {
  (list || []).forEach((c) => {
    if (!conceptIds.has(c)) warn(`${where}: concept "${c}" not in the graph`);
  });
};

(loaded.financeAcademy?.tracks || []).forEach((t) => {
  req(t, ["id", "name", "modules"], `finance track ${t.id || "?"}`);
  (t.modules || []).forEach((m) => {
    req(m, ["id", "name", "topics", "deliverable"], `finance module ${m.id || "?"}`);
    checkPaperLinks(m.papers, `finance module ${m.id}`);
    checkConceptLinks(m.concepts, `finance module ${m.id}`);
  });
});

(loaded.fpa?.topics || []).forEach((t, i) => {
  req(t, ["id", "name", "hours", "outcome", "deliverable"], `fpa topic[${i}]`);
});
const fpaProjects = loaded.fpa?.projects || [];
if (fpaProjects.length !== 8) err(`fpa: expected the eight named projects, found ${fpaProjects.length}`);
fpaProjects.forEach((p) => {
  req(p, ["id", "title", "brief", "deliverables", "rubric"], `fpa project ${p.id || "?"}`);
  (p.skills || []).forEach((s) => {
    if (!skillIds.has(s)) warn(`fpa project ${p.id}: unknown skill ${s}`);
  });
});

const marketsMeta = loaded.markets?.meta?.disclaimer;
if (!marketsMeta || typeof marketsMeta !== "object" || !marketsMeta.headline) {
  err("markets: meta.disclaimer with a headline is required (education vs investment advice)");
}

const automation = loaded.dataAi?.automationProjects || [];
if (automation.length !== 8) err(`data-ai: expected eight automation projects, found ${automation.length}`);
automation.forEach((p) => {
  req(p, ["id", "title", "problem", "approach", "deliverable"], `automation project ${p.id || "?"}`);
  if (!p.guardrail) err(`automation project ${p.id}: a guardrail is required`);
});

(loaded.communication?.areas || []).forEach((a) => {
  req(a, ["id", "name", "outcome", "drills"], `communication area ${a.id || "?"}`);
});

(loaded.careers?.roles || []).forEach((r) => {
  req(r, ["id", "name", "family", "qualifications", "technicalKnowledge", "software", "interviewQuestions"], `career role ${r.id || "?"}`);
});
/* ---------------- certifications ---------------- */

const certs = loaded.certifications?.entries || [];
const certIds = new Set(certs.map((c) => c.id));
unique(certs, "id", "certifications.entries");
certs.forEach((c) => {
  req(c, ["id", "name", "provider", "category", "priority", "eligibility", "costBand", "duration", "officialPage", "status"], `certification ${c.id || "?"}`);
  if (c.officialPage && !/^https:\/\//.test(c.officialPage)) warn(`certification ${c.id}: officialPage is not https`);
  if (c.verifyBeforeUse && !c.freeOrLowCost) {
    // expected for paid items
  }
  (c.prerequisites || []).forEach(() => {});
});
(loaded.certifications?.priorityOrder || []).forEach((g, i) => {
  (g.items || []).forEach((id) => {
    if (!certIds.has(id)) err(`certifications.priorityOrder[${i}]: unknown entry ${id}`);
  });
});

/* ---------------- case laboratory ---------------- */

const cases = loaded.cases?.cases || [];
if (cases.length !== 6) err(`cases: expected six cases, found ${cases.length}`);
cases.forEach((c) => {
  req(c, ["id", "no", "sector", "company", "difficulty", "problem", "scenario", "questions", "modelApproach", "judgementPoints"], `case ${c.id || "?"}`);
  (c.exhibits || []).forEach((ex, i) => {
    req(ex, ["title", "columns", "rows"], `case ${c.id} exhibit[${i}]`);
    (ex.rows || []).forEach((row, r) => {
      if (row.length !== (ex.columns || []).length) err(`case ${c.id} exhibit[${i}] row ${r}: ${row.length} cells for ${ex.columns.length} columns`);
    });
  });
  (c.modelApproach || []).forEach((line, i) => {
    if (/—\s*wait|recompute carefully|rather than asserting/i.test(line)) err(`case ${c.id} modelApproach[${i}]: contains a drafting self-correction`);
  });
  checkPaperLinks(c.links?.papers, `case ${c.id}`);
  checkConceptLinks(c.links?.concepts, `case ${c.id}`);
  (c.links?.skills || []).forEach((s) => {
    if (!skillIds.has(s)) warn(`case ${c.id}: unknown skill ${s}`);
  });
});

/* ---------------- portfolio ---------------- */

const portfolio = loaded.portfolio?.projects || [];
if (portfolio.length !== 28) err(`portfolio: expected 28 projects, found ${portfolio.length}`);
portfolio.forEach((p) => {
  req(p, ["id", "title", "problem", "deliverables", "complexity", "status"], `portfolio project ${p.id || "?"}`);
  checkPaperLinks(p.papers, `portfolio ${p.id}`);
  if (p.skill && String(p.skill).startsWith("skill-") && !skillIds.has(p.skill)) warn(`portfolio ${p.id}: unknown skill ${p.skill}`);
});

/* ---------------- exam intelligence ---------------- */

const exam = loaded.examIntel;
if (exam) {
  req(exam, ["meta", "examCalendar", "paperBlueprints", "recurringThemes", "questionLog", "mockPlan", "analyticsSpec", "predictions"], "exam-intel");
  if (!exam.meta?.integrity?.prediction) err("exam-intel: meta.integrity.prediction is required");
  (exam.paperBlueprints || []).forEach((b) => {
    if (!paperIds.has(b.paperId)) err(`exam-intel blueprint: unknown paper ${b.paperId}`);
  });
  (exam.predictions || []).forEach((p) => {
    if (!p.label) err(`exam-intel prediction ${p.id}: every prediction needs a label`);
  });
}

/* ---------------- knowledge seed (PKM) ---------------- */

const seed = loaded.knowledgeSeed;
if (seed) {
  req(seed, ["meta", "types", "entries"], "knowledge-seed");
  const typeIds = new Set((seed.types || []).map((t) => t.id));
  (seed.entries || []).forEach((e) => {
    req(e, ["id", "type", "title", "body"], `knowledge entry ${e.id || "?"}`);
    if (!typeIds.has(e.type)) err(`knowledge ${e.id}: unknown type ${e.type}`);
    (e.links?.chapters || []).forEach((c) => {
      if (!chapterIds.has(c)) err(`knowledge ${e.id}: unknown chapter ${c}`);
    });
    (e.links?.concepts || []).forEach((c) => {
      if (!conceptIds.has(c)) warn(`knowledge ${e.id}: concept "${c}" not in the graph`);
    });
    (e.links?.formulas || []).forEach((f) => {
      if (!formulaIds.has(f)) err(`knowledge ${e.id}: unknown formula ${f}`);
    });
  });
}

/* ---------------- priority ---------------- */

const priority = loaded.priority;
if (priority) {
  req(priority, ["meta", "priorities", "examWindows", "timeBudget"], "priority");
  const ranks = (priority.priorities || []).map((p) => p.rank);
  [1, 2, 3, 4, 5, 6].forEach((r) => {
    if (!ranks.includes(r)) err(`priority: rank ${r} is missing`);
  });
  (priority.priorities || []).forEach((p) => {
    req(p, ["rank", "name", "why", "weeklyHours", "allocationShare"], `priority rank ${p.rank}`);
    checkPaperLinks(p.papers, `priority rank ${p.rank}`);
  });
  const budget = priority.timeBudget || {};
  if (isArr(budget.split) && isNum(budget.weeklyAvailableHours)) {
    const sum = budget.split.reduce((a, s) => a + (Number(s.hours) || 0), 0);
    if (Math.abs(sum - budget.weeklyAvailableHours) > 0.01) err(`priority.timeBudget: split sums to ${sum}h, weeklyAvailableHours is ${budget.weeklyAvailableHours}h`);
  }
}

/* ---------------- performance ---------------- */

const perf = loaded.performance;
if (perf) {
  req(perf, ["meta", "dailyLog", "metrics", "learningScore", "weeklyReview"], "performance");
  const weights = (perf.metrics || []).reduce((a, m) => a + (Number(m.weight) || 0), 0);
  if (weights !== 100) err(`performance.metrics: weights sum to ${weights}, expected 100`);
  const qs = perf.weeklyReview?.questions || [];
  if (qs.length !== 6) err(`performance.weeklyReview: expected the six fixed questions, found ${qs.length}`);
  qs.forEach((q) => req(q, ["no", "id", "question", "guidance"], `weekly question ${q.id || "?"}`));
}

/* ---------------- profile ---------------- */

if (loaded.profile) {
  req(loaded.profile, ["defaults", "privacy", "unlockPath"], "profile");
  checkPaperLinks(loaded.profile.defaults?.targetPapers, "profile.defaults.targetPapers");
  checkPaperLinks(loaded.profile.defaults?.secondPapers, "profile.defaults.secondPapers");
}

/* ---------------- output ---------------- */

console.log(`papers ${papers.length} · chapters ${chapters.length} · authored ${contentChapters.size} · questions ${questionIds.size}`);
console.log(`concepts ${concepts.length} · formulas ${formulas.length} · skills ${skills.length} · certifications ${certs.length} · cases ${cases.length} · portfolio ${portfolio.length}`);

warnings.forEach((w) => console.log(`WARN  ${w}`));
errors.forEach((e) => console.log(`ERROR ${e}`));

const fail = errors.length || (strict && warnings.length);
console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)${strict ? " (strict)" : ""}`);
process.exit(fail ? 1 : 0);
