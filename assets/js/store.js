/* PROJECT CMA — local-first state. Everything stays in this browser. */

const KEY = "project-cma-v2";
const MAX_ATTEMPTS = 3000;
const MAX_LOG = 1200;

const emptyState = () => ({
  version: 2,
  createdAt: new Date().toISOString(),
  profile: {},
  chapters: {},
  attempts: [],
  log: [],
  mocks: [],
  reviews: [],
  cases: {},
  portfolio: {},
  certifications: {},
  skills: {},
  notes: [],
  settings: { theme: "dark" },
});

let state = emptyState();
let listeners = [];

function migrate(raw) {
  if (!raw || typeof raw !== "object") return emptyState();
  return { ...emptyState(), ...raw, settings: { ...emptyState().settings, ...(raw.settings || {}) } };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? migrate(JSON.parse(raw)) : emptyState();
  } catch (err) {
    console.warn("Could not read saved data; starting fresh.", err);
    state = emptyState();
  }
  return state;
}

export function get() {
  return state;
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("Could not save (storage full or blocked).", err);
  }
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.push(fn);
  return () => (listeners = listeners.filter((f) => f !== fn));
}

/* ---------------- profile ---------------- */

export function setProfile(patch) {
  state.profile = { ...state.profile, ...patch };
  persist();
}

export function setTheme(theme) {
  state.settings.theme = theme;
  persist();
}

/* ---------------- chapters ---------------- */

export function getChapter(id) {
  return state.chapters[id] || { status: "not-started", confidence: 0, attempts: 0, correct: 0 };
}

export function setChapterStatus(id, status) {
  const cur = getChapter(id);
  state.chapters[id] = { ...cur, status, lastStudied: new Date().toISOString() };
  persist();
}

export function setChapterConfidence(id, confidence) {
  const cur = getChapter(id);
  state.chapters[id] = { ...cur, confidence: Math.max(0, Math.min(3, Number(confidence) || 0)), lastStudied: new Date().toISOString() };
  persist();
}

export function recordAttempt({ qid, paperId, chapterId, correct, marks = 0, seconds = 0 }) {
  state.attempts.push({
    ts: new Date().toISOString(),
    qid,
    paperId,
    chapterId,
    correct: !!correct,
    marks: Number(marks) || 0,
    seconds: Number(seconds) || 0,
  });
  if (state.attempts.length > MAX_ATTEMPTS) state.attempts = state.attempts.slice(-MAX_ATTEMPTS);

  const cur = getChapter(chapterId);
  state.chapters[chapterId] = {
    ...cur,
    attempts: (cur.attempts || 0) + 1,
    correct: (cur.correct || 0) + (correct ? 1 : 0),
    lastStudied: new Date().toISOString(),
  };
  persist();
}

/* ---------------- daily log ---------------- */

export function addLog(entry) {
  const e = { id: crypto.randomUUID?.() || String(Date.now()), ...entry };
  const idx = state.log.findIndex((l) => l.date === e.date);
  if (idx >= 0) state.log[idx] = { ...state.log[idx], ...e };
  else state.log.push(e);
  state.log.sort((a, b) => (a.date < b.date ? -1 : 1));
  if (state.log.length > MAX_LOG) state.log = state.log.slice(-MAX_LOG);
  persist();
  return e;
}

export function removeLog(id) {
  state.log = state.log.filter((l) => l.id !== id);
  persist();
}

/* ---------------- mocks ---------------- */

export function addMock(mock) {
  state.mocks.push({ id: crypto.randomUUID?.() || String(Date.now()), ...mock });
  state.mocks.sort((a, b) => (a.date < b.date ? -1 : 1));
  persist();
}

export function removeMock(id) {
  state.mocks = state.mocks.filter((m) => m.id !== id);
  persist();
}

/* ---------------- weekly reviews ---------------- */

export function addReview(review) {
  const idx = state.reviews.findIndex((r) => r.weekEnding === review.weekEnding);
  const entry = { id: crypto.randomUUID?.() || String(Date.now()), ...review, savedAt: new Date().toISOString() };
  if (idx >= 0) state.reviews[idx] = { ...state.reviews[idx], ...entry };
  else state.reviews.push(entry);
  state.reviews.sort((a, b) => (a.weekEnding < b.weekEnding ? -1 : 1));
  persist();
  return entry;
}

/* ---------------- cases ---------------- */

export function setCase(id, patch) {
  state.cases[id] = { ...(state.cases[id] || {}), ...patch, updatedAt: new Date().toISOString() };
  persist();
}

/* ---------------- portfolio ---------------- */

export function setPortfolio(id, patch) {
  state.portfolio[id] = { ...(state.portfolio[id] || {}), ...patch, updatedAt: new Date().toISOString() };
  persist();
}

/* ---------------- certifications ---------------- */

export function setCertification(id, patch) {
  state.certifications[id] = { ...(state.certifications[id] || {}), ...patch, updatedAt: new Date().toISOString() };
  persist();
}

/* ---------------- skills ---------------- */

export function setSkillLevel(skillId, level, value) {
  const s = state.skills[skillId] || { levels: {} };
  s.levels = { ...s.levels, [level]: { ...(s.levels[level] || {}), ...value, updatedAt: new Date().toISOString() } };
  state.skills[skillId] = s;
  persist();
}

export function getSkill(skillId) {
  return state.skills[skillId] || { levels: {} };
}

/* ---------------- knowledge notes ---------------- */

export function addNote(note) {
  const entry = { id: `note-${Date.now()}`, createdAt: new Date().toISOString(), ...note };
  state.notes.unshift(entry);
  persist();
  return entry;
}

export function updateNote(id, patch) {
  state.notes = state.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n));
  persist();
}

export function removeNote(id) {
  state.notes = state.notes.filter((n) => n.id !== id);
  persist();
}

export function pinSeedEntry(id, entry) {
  if (state.notes.some((n) => n.sourceId === id)) return false;
  state.notes.unshift({ ...entry, sourceId: id, createdAt: new Date().toISOString() });
  persist();
  return true;
}

/* ---------------- backup ---------------- */

export function exportData() {
  return JSON.stringify({ exportedAt: new Date().toISOString(), app: "PROJECT CMA", state }, null, 2);
}

export function importData(json) {
  const parsed = typeof json === "string" ? JSON.parse(json) : json;
  const incoming = parsed.state || parsed;
  if (!incoming || typeof incoming !== "object") throw new Error("That file does not look like a PROJECT CMA backup.");
  state = migrate(incoming);
  persist();
}

export function resetAll() {
  state = emptyState();
  persist();
}

export function storageFootprint() {
  try {
    const raw = localStorage.getItem(KEY) || "";
    return Math.round((raw.length / 1024) * 10) / 10;
  } catch {
    return 0;
  }
}
