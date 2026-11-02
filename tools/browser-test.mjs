/* End-to-end test in jsdom: boot the real app, walk every route, run a practice session.
   Usage: npm run test:e2e   (requires jsdom, a dev dependency) */

import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";

const ROOT = path.resolve(import.meta.dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

const dom = new JSDOM(html, { url: "http://localhost:8000/", pretendToBeVisual: true });
const { window } = dom;

globalThis.window = window;
globalThis.document = window.document;
Object.defineProperty(globalThis, "navigator", { value: window.navigator, configurable: true });
globalThis.HTMLElement = window.HTMLElement;
globalThis.Element = window.Element;
globalThis.Event = window.Event;
globalThis.FormData = window.FormData;
globalThis.URLSearchParams = window.URLSearchParams;
globalThis.localStorage = window.localStorage;
Object.defineProperty(globalThis, "location", { value: window.location, configurable: true });
Object.defineProperty(globalThis, "history", { value: window.history, configurable: true });
/* Node 22 provides crypto.randomUUID natively */
window.scrollTo = () => {};
window.Element.prototype.scrollIntoView = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};
window.print = () => {};

const fileFetch = async (url) => {
  const file = path.join(ROOT, String(url).replace(/^\.?\//, ""));
  if (!fs.existsSync(file)) {
    console.log("  missing file fetch:", url);
    return { ok: false, status: 404, json: async () => ({}) };
  }
  return { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(file, "utf8")) };
};
window.fetch = fileFetch;
globalThis.fetch = fileFetch;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, label, timeout = 6000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      if (fn()) return true;
    } catch {}
    await sleep(60);
  }
  throw new Error(`timeout waiting for ${label}`);
}

const results = [];
const check = (label, cond, detail = "") => {
  results.push({ label, cond, detail });
  if (!cond) console.log(`FAIL ${label}${detail ? ` — ${detail}` : ""}`);
};

/* boot the real application */
await import("../assets/js/app.js");
await waitFor(() => document.getElementById("main").textContent.length > 500, "boot render");
check("app boots", !document.getElementById("main").textContent.includes("could not load"));
check("nav rendered", document.querySelectorAll("#nav .nav-item").length >= 15, `${document.querySelectorAll("#nav .nav-item").length} items`);
check("exam countdown chip", /Inter G1/.test(document.getElementById("examChip").textContent), document.getElementById("examChip").textContent);
check("mini status filled", document.getElementById("miniStatus").textContent.includes("Group I"), document.getElementById("miniStatus").textContent);

/* walk every route */
const routes = [
  "#/", "#/priority", "#/papers", "#/papers?level=final", "#/paper/p05", "#/chapter/p06-c01",
  "#/chapter/p06-c01?tab=questions", "#/chapter/p07-c03?tab=formulas", "#/subjects", "#/concepts",
  "#/concepts?focus=c-break-even", "#/formulas", "#/formulas?q=variance", "#/practice",
  "#/performance", "#/exam", "#/exam?paper=p07", "#/knowledge", "#/academies",
  "#/academy/software", "#/academy/finance", "#/academy/fpa", "#/academy/markets",
  "#/academy/data-ai", "#/academy/communication", "#/skill/skill-excel", "#/cases",
  "#/case/case-01", "#/case/case-01?tab=exhibits", "#/case/case-01?tab=work",
  "#/portfolio", "#/certifications", "#/careers", "#/careers/role-management-accountant",
  "#/settings", "#/search?q=variance", "#/nope",
];

for (const route of routes) {
  window.location.hash = route;
  await sleep(120);
  await waitFor(() => {
    const main = document.getElementById("main");
    return main.querySelector(".loading") === null && main.textContent.length > (route === "#/nope" ? 30 : 120);
  }, route);
  const main = document.getElementById("main");
  const txt = main.textContent;
  const bad = /could not be rendered|failed to load|undefined|NaN|\[object Object\]/.test(txt);
  check(`route ${route}`, !bad, bad ? txt.slice(0, 300).replace(/\s+/g, " ") : `${txt.length} chars`);
}

/* quick-log drawer */
document.getElementById("quickAdd").click();
await sleep(50);
check("drawer opens", !document.getElementById("drawer").hidden);
const logForm = document.querySelector("#logForm");
check("log form present", !!logForm);
if (logForm) {
  const set = (name, value) => {
    const el = logForm.querySelector(`[name="${name}"]`);
    if (el) el.value = value;
    else console.log("  missing log field:", name);
  };
  set("date", new Date().toISOString().slice(0, 10));
  set("studyHours", "4");
  set("questionsAttempted", "15");
  set("questionsCorrect", "11");
  set("revisionMinutes", "25");
  logForm.querySelector("button[type=submit]").click();
  await sleep(100);
  const saved = JSON.parse(localStorage.getItem("project-cma-v2") || "{}");
  check("log persisted", (saved.log || []).length === 1, JSON.stringify(saved.log));
  check("drawer closes", document.getElementById("drawer").hidden);
}

/* practice session */
window.location.hash = "#/practice?paper=p06";
await sleep(150);
await waitFor(() => document.getElementById("sessionForm"), "practice form");
const form = document.getElementById("sessionForm");
const cnt = form.querySelector('[name="count"]'); if (cnt) cnt.value = "5";
form.querySelector("button[type=submit]").click();
await waitFor(() => document.getElementById("questionHost")?.textContent.length > 80, "session question");
check("session rendered", !!document.querySelector("#questionHost .question"));
const firstQ = document.querySelector("#questionHost .q-text").textContent.trim();
check("question text non-trivial", firstQ.length > 30, firstQ.slice(0, 60));
document.getElementById("revealBtn").click();
check("answer reveals", !document.querySelector("#questionHost .q-answer").hidden);

let guard = 0;
while (document.getElementById("questionHost")?.querySelector("#rightBtn") && guard < 12) {
  document.getElementById("rightBtn").click();
  guard++;
  await sleep(40);
}
check("session completes", guard >= 1 && document.querySelector("#sessionSummary") !== null, `${guard} answers`);
const summaryText = document.getElementById("main").textContent;
check("session summary shows accuracy", /Session accuracy/.test(summaryText), summaryText.slice(-300).replace(/\s+/g, " "));
document.getElementById("logSession")?.click();
await sleep(80);
const saved2 = JSON.parse(localStorage.getItem("project-cma-v2") || "{}");
check("session log merged into today", (saved2.log || []).length === 1 && (saved2.log[0].questionsAttempted || 0) >= 5, JSON.stringify(saved2.log));
check("attempts recorded", (saved2.attempts || []).length >= 5, `${(saved2.attempts || []).length} attempts`);

/* theme toggle + persistence */
window.location.hash = "#/settings";
await sleep(150);
document.getElementById("themeToggle").click();
await sleep(60);
check("theme switches", document.documentElement.dataset.theme === "light", document.documentElement.dataset.theme);
check("theme persisted", JSON.parse(localStorage.getItem("project-cma-v2")).settings.theme === "light");

/* chapter status interaction */
window.location.hash = "#/chapter/p08-c01";
await sleep(200);
await waitFor(() => document.querySelector("[data-status]"), "chapter status buttons");
document.querySelector('[data-status="confident"]').click();
await sleep(60);
check("chapter status saved", JSON.parse(localStorage.getItem("project-cma-v2")).chapters["p08-c01"].status === "confident");

/* review form */
window.location.hash = "#/performance";
await sleep(200);
await waitFor(() => document.getElementById("reviewForm"), "review form");
const rf = document.getElementById("reviewForm");
rf.querySelector('[name="wq1"]').value = "Chapters 1-2 with self-test; 20 questions";
rf.querySelector('[name="wq2"]').value = "Chapter 3; two questions incomplete";
rf.querySelector('[name="wq3"]').value = "Overhead absorption";
rf.querySelector('[name="wq4"]').value = "Depreciation arithmetic";
rf.querySelector('[name="wq5"]').value = "Variance computation";
rf.querySelector('[name="wq6"]').value = "Finish process costing";
rf.querySelector("button[type=submit]").click();
await sleep(100);
check("review saved", (JSON.parse(localStorage.getItem("project-cma-v2")).reviews || []).length === 1);

/* reload persistence is covered by store.load() on boot; simulate a second boot */
const passed = results.filter((r) => r.cond).length;
console.log(`\n${passed}/${results.length} browser checks passed`);
const failures = results.filter((r) => !r.cond);
if (failures.length) {
  failures.forEach((f) => console.log(" -", f.label, f.detail));
  process.exit(1);
}
