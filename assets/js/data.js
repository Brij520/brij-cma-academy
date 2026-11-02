/* PROJECT CMA — data loading, indexing and analytics. */

const cache = { loaded: false, errors: [] };

export const D = {
  manifest: null,
  profile: null,
  priority: null,
  papersDoc: null,
  papers: [],
  papersById: {},
  chapters: [],          // flat list with paperId attached
  chapterById: {},
  content: {},           // chapterId -> knowledge content
  questions: [],
  questionById: {},
  subjectsDoc: null,
  conceptsDoc: null,
  formulasDoc: null,
  subjects: [],
  concepts: [],
  conceptById: {},
  conceptPaths: [],
  formulas: [],
  software: null,
  finance: null,
  fpa: null,
  markets: null,
  dataAi: null,
  communication: null,
  careers: null,
  certifications: null,
  cases: null,
  portfolio: null,
  examIntel: null,
  knowledgeSeed: null,
  performance: null,
  loadedIds: [],
};

async function getJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
}

export async function loadData() {
  if (cache.loaded) return cache;
  const manifest = await getJSON("data/manifest.json");
  D.manifest = manifest;

  const results = await Promise.allSettled(
    manifest.datasets.map(async (ds) => ({ id: ds.id, data: await getJSON(ds.path) }))
  );

  const byId = {};
  results.forEach((r, i) => {
    if (r.status === "fulfilled") byId[r.value.id] = r.value.data;
    else cache.errors.push(`${manifest.datasets[i].path}: ${r.reason?.message || r.reason}`);
  });

  D.profile = byId.profile || { defaults: {} };
  D.priority = byId.priority || { priorities: [] };
  D.papersDoc = byId.papers || { levels: [], papers: [] };
  D.subjectsDoc = byId.subjects || { categories: [], subjects: [] };
  D.conceptsDoc = byId.concepts || { concepts: [], paths: [] };
  D.formulasDoc = byId.formulas || { categories: [], formulas: [] };
  D.subjects = D.subjectsDoc.subjects || [];
  D.concepts = D.conceptsDoc.concepts || [];
  D.conceptPaths = byId.concepts?.paths || [];
  D.formulas = byId.formulas?.formulas || [];
  D.software = byId.software || { skills: [] };
  D.finance = byId.financeAcademy || { tracks: [] };
  D.fpa = byId.fpa || { topics: [], projects: [] };
  D.markets = byId.markets || { modules: [], projects: [] };
  D.dataAi = byId.dataAi || { pathway: [], automationProjects: [] };
  D.communication = byId.communication || { areas: [], dailyPractice: {} };
  D.careers = byId.careers || { roles: [] };
  D.certifications = byId.certifications || { entries: [] };
  D.cases = byId.cases || { cases: [] };
  D.portfolio = byId.portfolio || { projects: [] };
  D.examIntel = byId.examIntel || {};
  D.knowledgeSeed = byId.knowledgeSeed || { entries: [] };
  D.performance = byId.performance || {};

  D.loadedIds = Object.keys(byId);
  buildIndexes(byId);
  cache.loaded = true;
  return cache;
}

function buildIndexes(byId) {
  D.papers = (D.papersDoc.papers || []).map((p) => ({ ...p, chapters: p.chapters || [] }));
  D.papersById = Object.fromEntries(D.papers.map((p) => [p.id, p]));

  D.chapters = [];
  D.papers.forEach((p) =>
    p.chapters.forEach((c, i) => {
      const chapter = { ...c, paperId: p.id, order: i + 1, paper: p };
      D.chapters.push(chapter);
      D.chapterById[c.id] = chapter;
    })
  );

  // merge knowledge files
  const mergeKnowledge = (doc) => {
    (doc?.chapters || []).forEach((ch) => {
      const base = D.chapterById[ch.id];
      D.content[ch.id] = {
        ...ch,
        paperId: ch.paperId || base?.paperId,
        title: base?.title || ch.title || ch.id,
        topics: base?.topics || [],
        amendmentWatch: doc?.amendmentWatch,
      };
      (ch.questions || []).forEach((q) => {
        const qq = { ...q, chapterId: ch.id, paperId: ch.paperId || base?.paperId || "unknown" };
        D.questions.push(qq);
        D.questionById[q.id] = qq;
      });
    });
  };

  mergeKnowledge(byId.knowledgeFoundation);
  mergeKnowledge(byId.knowledgeP05);
  mergeKnowledge(byId.knowledgeP06);
  mergeKnowledge(byId.knowledgeP07);
  mergeKnowledge(byId.knowledgeP08);
  mergeKnowledge(byId.knowledgeInter2);
  mergeKnowledge(byId.knowledgeFinal);

  D.conceptById = Object.fromEntries(D.concepts.map((c) => [c.id, c]));
}

/* ---------------- syllabus maths ---------------- */

export function sectionWeight(paper, sectionId) {
  const s = (paper.sections || []).find((x) => x.id === sectionId);
  return s ? Number(s.weight) || 0 : 0;
}

/** Indicative marks per chapter: the section weight split evenly across its chapters. */
export function chapterMarks(chapter) {
  const paper = D.papersById[chapter.paperId];
  if (!paper) return 0;
  const siblings = paper.chapters.filter((c) => c.section === chapter.section);
  const w = sectionWeight(paper, chapter.section);
  return siblings.length ? Math.round((w / siblings.length) * 10) / 10 : 0;
}

export function paperChapters(paperId) {
  return D.chapters.filter((c) => c.paperId === paperId);
}

export function contentFor(chapterId) {
  return D.content[chapterId] || null;
}

export function questionsForChapter(chapterId) {
  return D.questions.filter((q) => q.chapterId === chapterId);
}

export function questionsForPaper(paperId) {
  return D.questions.filter((q) => q.paperId === paperId);
}

export function hasContent(chapterId) {
  const c = D.content[chapterId];
  return !!(c && ((c.keyTerms && c.keyTerms.length) || (c.questions && c.questions.length) || c.summary));
}

export function contentDepth(chapterId) {
  const c = D.content[chapterId];
  if (!c) return "none";
  if (c.status === "complete" || (c.questions && c.questions.length >= 2 && c.keyTerms && c.keyTerms.length >= 2)) return "full";
  if (c.status === "outline" || (c.summary && c.summary.length > 80)) return "outline";
  return "stub";
}

/* ---------------- progress analytics ---------------- */

const STATUS_WEIGHT = { "not-started": 0, studying: 0.35, revising: 0.7, confident: 1 };

export function chapterProgress(state, chapterId) {
  const rec = state.chapters?.[chapterId];
  if (!rec) return 0;
  return STATUS_WEIGHT[rec.status] ?? 0;
}

export function paperProgress(state, paperId) {
  const chs = paperChapters(paperId);
  if (!chs.length) return 0;
  // weight by indicative marks so a large chapter counts more
  const total = chs.reduce((a, c) => a + chapterMarks(c), 0) || chs.length;
  const done = chs.reduce((a, c) => a + chapterMarks(c) * chapterProgress(state, c.id), 0);
  return total ? Math.round((done / total) * 100) : 0;
}

export function chapterStats(state, chapterId) {
  const rec = state.chapters?.[chapterId] || {};
  const attempts = rec.attempts || 0;
  const correct = rec.correct || 0;
  return {
    attempts,
    correct,
    accuracy: attempts ? Math.round((correct / attempts) * 100) : null,
    status: rec.status || "not-started",
    confidence: rec.confidence || 0,
    lastStudied: rec.lastStudied || null,
  };
}

export function paperStats(state, paperId) {
  const chs = paperChapters(paperId);
  const attempted = chs.filter((c) => (state.chapters?.[c.id]?.attempts || 0) > 0);
  const attempts = chs.reduce((a, c) => a + (state.chapters?.[c.id]?.attempts || 0), 0);
  const correct = chs.reduce((a, c) => a + (state.chapters?.[c.id]?.correct || 0), 0);
  return {
    chapters: chs.length,
    attempted: attempted.length,
    attempts,
    correct,
    accuracy: attempts ? Math.round((correct / attempts) * 100) : null,
    progress: paperProgress(state, paperId),
  };
}

export function overallProgress(state) {
  const papers = D.papers.filter((p) => ["p05", "p06", "p07", "p08"].includes(p.id));
  if (!papers.length) return 0;
  return Math.round(papers.reduce((a, p) => a + paperProgress(state, p.id), 0) / papers.length);
}

export function studyHours(state, { from = null, to = null, paperId = null } = {}) {
  return (state.log || []).reduce((a, e) => {
    if (from && e.date < from) return a;
    if (to && e.date > to) return a;
    if (paperId && e.paperId !== paperId) return a;
    return a + (Number(e.studyHours) || 0);
  }, 0);
}

export function lastNDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function dailySeries(state, days = 28) {
  const dates = lastNDays(days);
  const map = Object.fromEntries((state.log || []).map((l) => [l.date, l]));
  return dates.map((d) => ({ date: d, hours: Number(map[d]?.studyHours) || 0, questions: Number(map[d]?.questionsAttempted) || 0, revision: Number(map[d]?.revisionMinutes) || 0 }));
}

export function streak(state) {
  const dates = new Set((state.log || []).filter((l) => Number(l.studyHours) > 0).map((l) => l.date));
  let n = 0;
  const d = new Date();
  // allow today to be empty without breaking the streak
  if (!dates.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (dates.has(d.toISOString().slice(0, 10))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function rollingAccuracy(state, days = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const a = (state.attempts || []).filter((x) => new Date(x.ts) >= cutoff);
  if (!a.length) return { attempts: 0, accuracy: null };
  return { attempts: a.length, accuracy: Math.round((a.filter((x) => x.correct).length / a.length) * 100) };
}

export function mockAverage(state, count = 3) {
  const mocks = (state.mocks || []).slice(-count);
  if (!mocks.length) return { count: 0, average: null };
  const avg = mocks.reduce((a, m) => a + (Number(m.score) / Number(m.max || 100)) * 100, 0) / mocks.length;
  return { count: mocks.length, average: Math.round(avg) };
}

export function weakChapters(state, limit = 8) {
  return D.chapters
    .map((c) => ({ ...c, ...chapterStats(state, c.id), marks: chapterMarks(c) }))
    .filter((c) => c.attempts >= 3 && c.accuracy !== null && c.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy || b.marks - a.marks)
    .slice(0, limit);
}

export function strongestChapters(state, limit = 5) {
  return D.chapters
    .map((c) => ({ ...c, ...chapterStats(state, c.id), marks: chapterMarks(c) }))
    .filter((c) => c.attempts >= 3 && c.accuracy !== null)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, limit);
}

export function revisionDue(state, limit = 8) {
  const now = Date.now();
  return D.chapters
    .map((c) => {
      const s = chapterStats(state, c.id);
      const days = s.lastStudied ? Math.floor((now - new Date(s.lastStudied)) / 86400000) : null;
      return { ...c, ...s, daysSince: days, marks: chapterMarks(c) };
    })
    .filter((c) => c.status !== "not-started" && (c.daysSince === null || c.daysSince >= 7))
    .sort((a, b) => (b.daysSince ?? 999) - (a.daysSince ?? 999) || b.marks - a.marks)
    .slice(0, limit);
}

export function learningScore(state) {
  const perf = D.performance || {};
  const targets = perf.dailyLog?.targets || { studyHours: 3.5, revisionMinutes: 30 };
  const last7 = lastNDays(7);
  const weekHours = (state.log || []).filter((l) => last7.includes(l.date)).reduce((a, l) => a + (Number(l.studyHours) || 0), 0);
  const studyHoursScore = Math.min(100, (weekHours / (targets.studyHours * 7)) * 100);

  const acc = rollingAccuracy(state, 7);
  const accuracyScore = acc.attempts >= 20 ? acc.accuracy : acc.attempts > 0 ? Math.round((acc.accuracy || 0) * 0.6) : 0;

  const mock = mockAverage(state, 3);
  const mockScore = mock.average ?? 0;

  const revisionDays = new Set((state.log || []).filter((l) => last7.includes(l.date) && Number(l.revisionMinutes) >= 20).map((l) => l.date));
  const revisionScore = Math.round((revisionDays.size / 7) * 100);

  const weak = weakChapters(state, 50);
  const improved = weak.filter((c) => (state.chapters?.[c.id]?.correct || 0) / (state.chapters?.[c.id]?.attempts || 1) > 0.7).length;
  const weaknessScore = weak.length ? Math.min(100, Math.round((improved / weak.length) * 100)) : 0;

  const artefacts = Object.values(state.portfolio || {}).filter((p) => p.status === "complete").length;
  const artefactScore = Math.min(100, (artefacts / 5) * 100);

  const score = Math.round(
    studyHoursScore * 0.1 + accuracyScore * 0.25 + mockScore * 0.25 + revisionScore * 0.15 + weaknessScore * 0.15 + artefactScore * 0.1
  );

  const band = score >= 75 ? "On track" : score >= 55 ? "At risk" : "Intervention";
  return { score, band, components: { studyHoursScore, accuracyScore, mockScore, revisionScore, weaknessScore, artefactScore }, weekHours, acc, mock };
}

/* ---------------- search ---------------- */

export function searchAll(query, limit = 40) {
  const q = String(query || "").toLowerCase().trim();
  if (q.length < 2) return [];
  const out = [];

  D.chapters.forEach((c) => {
    const content = D.content[c.id];
    const hay = `${c.title} ${c.id} ${(c.topics || []).join(" ")} ${content?.summary || ""}`.toLowerCase();
    if (hay.includes(q)) out.push({ type: "Chapter", title: c.title, sub: `${c.paper.short} · Chapter ${c.no}`, href: `#/chapter/${c.id}`, score: 3 });
  });

  D.formulas.forEach((f) => {
    if (`${f.name} ${f.expression} ${f.note || ""}`.toLowerCase().includes(q))
      out.push({ type: "Formula", title: f.name, sub: f.expression, href: `#/formulas?q=${encodeURIComponent(q)}`, score: 2 });
  });

  D.concepts.forEach((c) => {
    if (`${c.label} ${c.id}`.toLowerCase().includes(q))
      out.push({ type: "Concept", title: c.label, sub: `Level ${c.level} · ${c.papers.join(", ")}`, href: `#/concepts?focus=${c.id}`, score: 2 });
  });

  D.subjects.forEach((s) => {
    if (`${s.name} ${s.description}`.toLowerCase().includes(q)) out.push({ type: "Subject", title: s.name, sub: s.category, href: `#/subjects?q=${encodeURIComponent(q)}`, score: 1 });
  });

  (D.software.skills || []).forEach((s) => {
    if (`${s.name} ${s.why}`.toLowerCase().includes(q)) out.push({ type: "Skill", title: s.name, sub: s.track, href: `#/skill/${s.id}`, score: 2 });
  });

  Object.entries(D.content).forEach(([id, c]) => {
    (c.keyTerms || []).forEach((t) => {
      if (`${t.term} ${t.definition}`.toLowerCase().includes(q))
        out.push({ type: "Definition", title: t.term, sub: c.title, href: `#/chapter/${id}`, score: 1 });
    });
  });

  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function dataErrors() {
  return cache.errors;
}
