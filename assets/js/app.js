/* PROJECT CMA — application shell, router and global interactions. */

import { loadData, D, dataErrors, overallProgress, streak, learningScore, searchAll } from "./data.js";
import * as store from "./store.js";
import { esc, toast, todayISO, daysBetween, num } from "./ui.js";

const MAIN = document.getElementById("main");
const NAV = document.getElementById("nav");

const NAV_GROUPS = [
  {
    label: "Study",
    items: [
      { href: "#/", label: "Dashboard", ico: "◈" },
      { href: "#/priority", label: "Priority plan", ico: "◎" },
      { href: "#/papers", label: "Academic library", ico: "▤" },
      { href: "#/practice", label: "Practice engine", ico: "✎" },
      { href: "#/formulas", label: "Formulas", ico: "ƒ" },
      { href: "#/concepts", label: "Concept map", ico: "⌗" },
    ],
  },
  {
    label: "Progress",
    items: [
      { href: "#/performance", label: "Performance", ico: "▥" },
      { href: "#/exam", label: "Exam intelligence", ico: "◇" },
      { href: "#/knowledge", label: "Knowledge base", ico: "❏" },
    ],
  },
  {
    label: "Professional",
    items: [
      { href: "#/academies", label: "Skill academies", ico: "⬡" },
      { href: "#/cases", label: "Case laboratory", ico: "⚖" },
      { href: "#/portfolio", label: "Portfolio", ico: "▣" },
      { href: "#/certifications", label: "Certifications", ico: "✦" },
      { href: "#/careers", label: "Career paths", ico: "➤" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "#/search", label: "Search", ico: "⌕" },
      { href: "#/settings", label: "Settings & data", ico: "⚙" },
    ],
  },
];

const ROUTES = [
  { re: /^\/?$/, view: "dashboard", title: "Dashboard" },
  { re: /^\/priority$/, view: "priority", title: "Priority plan" },
  { re: /^\/papers$/, view: "papers", title: "Academic library" },
  { re: /^\/paper\/([\w-]+)$/, view: "paper", title: "Paper" },
  { re: /^\/chapter\/([\w-]+)$/, view: "chapter", title: "Chapter" },
  { re: /^\/subjects$/, view: "subjects", title: "Subject index" },
  { re: /^\/concepts$/, view: "concepts", title: "Concept map" },
  { re: /^\/formulas$/, view: "formulas", title: "Formula database" },
  { re: /^\/practice$/, view: "practice", title: "Practice engine" },
  { re: /^\/performance$/, view: "performance", title: "Performance" },
  { re: /^\/exam$/, view: "exam", title: "Examination intelligence" },
  { re: /^\/knowledge$/, view: "knowledge", title: "Knowledge base" },
  { re: /^\/academies$/, view: "academies", title: "Skill academies" },
  { re: /^\/academy\/([\w-]+)$/, view: "academy", title: "Academy" },
  { re: /^\/skill\/([\w-]+)$/, view: "skill", title: "Skill" },
  { re: /^\/cases$/, view: "cases", title: "Case laboratory" },
  { re: /^\/case\/([\w-]+)$/, view: "caseLab", title: "Case" },
  { re: /^\/portfolio$/, view: "portfolio", title: "Portfolio builder" },
  { re: /^\/certifications$/, view: "certifications", title: "Certifications" },
  { re: /^\/careers$/, view: "careers", title: "Career paths" },
  { re: /^\/careers\/([\w-]+)$/, view: "careers", title: "Career path" },
  { re: /^\/career\/([\w-]+)$/, view: "careers", title: "Career path" },
  { re: /^\/settings$/, view: "settings", title: "Settings & data" },
  { re: /^\/search$/, view: "search", title: "Search" },
];

const TITLES = Object.fromEntries(ROUTES.map((r) => [r.view, r.title]));

/* ---------------- boot ---------------- */

async function boot() {
  try {
    await loadData();
  } catch (err) {
    MAIN.innerHTML = `<div class="card"><h2>The knowledge base could not load</h2>
      <p class="muted">${esc(err.message)}</p>
      <p class="tiny muted">This application fetches JSON files, which browsers block on <code>file://</code>.
      Start it with <code>python3 serve.py</code> (or <code>python3 -m http.server 8000</code>) and open the printed address.</p></div>`;
    return;
  }

  const state = store.load();
  document.documentElement.dataset.theme = state.settings.theme || "dark";

  renderNav();
  renderChrome();
  store.subscribe(() => renderChrome());
  document.addEventListener("pcm:refresh", () => route());

  window.addEventListener("hashchange", route);
  if (!location.hash) location.hash = "#/";
  route();

  const errs = dataErrors();
  if (errs.length) {
    console.warn("Dataset problems:", errs);
    document.getElementById("miniStatus").insertAdjacentHTML(
      "beforeend",
      `<div class="tiny" style="color:var(--amber)">${errs.length} dataset warning(s) — see Settings.</div>`
    );
  }
}

/* ---------------- nav + chrome ---------------- */

function renderNav() {
  const cur = currentPath();
  NAV.innerHTML = NAV_GROUPS.map(
    (g) => `<div class="nav-group"><div class="nav-group-label">${esc(g.label)}</div>
      ${g.items
        .map((it) => {
          const active = it.href === "#/" ? cur === "/" : cur.startsWith(it.href.slice(1));
          const count =
            it.href === "#/papers" ? D.chapters.length : "";
          return `<a class="nav-item${active ? " active" : ""}" href="${it.href}">
            <span class="ico">${it.ico}</span><span>${esc(it.label)}</span>
            ${count ? `<span class="count">${count}</span>` : ""}</a>`;
        })
        .join("")}</div>`
  ).join("");
}

function renderChrome() {
  const state = store.get();
  const stage = state.profile.stage || D.profile?.defaults?.stage || "Intermediate";
  const progress = overallProgress(state);
  const st = streak(state);
  const score = learningScore(state);
  const foot = document.getElementById("miniStatus");
  if (foot) {
    foot.innerHTML = `<b>${esc(stage)}</b> · Group I ${progress}% · ${score.score}/100<br>
      ${st > 0 ? `${st}-day study streak` : "No study logged yet"} · <a href="#/performance">log today</a>`;
  }
  const examChip = document.getElementById("examChip");
  if (examChip) {
    const target = D.priority?.priorities?.find((p) => p.rank === 1)?.target || "2026-12-10";
    const days = daysBetween(new Date(), target);
    examChip.textContent = days >= 0 ? `Inter G1 · ${days}d` : "Inter G1 · passed";
    examChip.className = days <= 45 ? "chip rose" : "chip amber";
  }
  const name = state.profile.name || "";
  const initialsEl = document.getElementById("pageTitle");
  const title = TITLES[currentView()] || "Dashboard";
  if (initialsEl) initialsEl.textContent = name ? `${title} · ${name.split(" ")[0]}` : title;
}

/* ---------------- routing ---------------- */

function currentPath() {
  const raw = location.hash.replace(/^#/, "") || "/";
  return raw.split("?")[0];
}
function currentQuery() {
  const q = location.hash.split("?")[1] || "";
  return Object.fromEntries(new URLSearchParams(q));
}
function currentView() {
  const path = currentPath();
  const hit = ROUTES.find((r) => r.re.test(path));
  return hit ? hit.view : "notfound";
}

const viewCache = new Map();
async function getView(name) {
  if (viewCache.has(name)) return viewCache.get(name);
  const loaders = {
    dashboard: () => import("./views/dashboard.js"),
    priority: () => import("./views/priority.js"),
    papers: () => import("./views/academic.js").then((m) => ({ render: m.renderPapers, mount: m.mountPapers, title: "Academic library" })),
    paper: () => import("./views/academic.js").then((m) => ({ render: m.renderPaper, mount: m.mountPaper })),
    chapter: () => import("./views/academic.js").then((m) => ({ render: m.renderChapter, mount: m.mountChapter })),
    subjects: () => import("./views/academic.js").then((m) => ({ render: m.renderSubjects, mount: m.mountSubjects })),
    concepts: () => import("./views/academic.js").then((m) => ({ render: m.renderConcepts, mount: m.mountConcepts })),
    formulas: () => import("./views/formulas.js"),
    practice: () => import("./views/practice.js"),
    performance: () => import("./views/performance.js"),
    exam: () => import("./views/exam.js"),
    knowledge: () => import("./views/knowledge.js"),
    academies: () => import("./views/skills.js").then((m) => ({ render: m.renderAcademies, mount: m.mountAcademies })),
    academy: () => import("./views/skills.js").then((m) => ({ render: m.renderAcademy, mount: m.mountAcademy })),
    skill: () => import("./views/skills.js").then((m) => ({ render: m.renderSkill, mount: m.mountSkill })),
    cases: () => import("./views/cases.js").then((m) => ({ render: m.renderCases, mount: m.mountCases })),
    caseLab: () => import("./views/cases.js").then((m) => ({ render: m.renderCase, mount: m.mountCase })),
    portfolio: () => import("./views/portfolio.js"),
    certifications: () => import("./views/certifications.js"),
    careers: () => import("./views/careers.js"),
    settings: () => import("./views/settings.js"),
    search: () => import("./views/dashboard.js").then((m) => ({ render: m.renderSearch, mount: m.mountSearch })),
    notfound: () => ({ render: () => `<div class="card"><h2>Page not found</h2><p class="muted">That address does not exist. <a href="#/">Go to the dashboard</a>.</p></div>` }),
  };
  const mod = await loaders[name]();
  viewCache.set(name, mod);
  return mod;
}

let currentRoute = { path: "/", view: "dashboard", params: [], query: {} };
let renderToken = 0;

async function route() {
  const path = currentPath();
  const query = currentQuery();
  const hit = ROUTES.find((r) => r.re.test(path));
  const view = hit ? hit.view : "notfound";
  const m = hit ? path.match(hit.re) : null;
  const params = m ? m.slice(1) : [];
  currentRoute = { path, view, params, query };

  renderNav();
  renderChrome();

  const token = ++renderToken;
  MAIN.innerHTML = `<div class="loading"><div class="spinner"></div><p class="tiny muted">Loading…</p></div>`;
  let mod;
  try {
    mod = await getView(view);
  } catch (err) {
    console.error(err);
    MAIN.innerHTML = `<div class="card"><h2>This page failed to load</h2><p class="muted">${esc(err.message)}</p></div>`;
    return;
  }
  if (token !== renderToken) return;
  try {
    MAIN.innerHTML = mod.render({ params, query, path, view }) || "";
    mod.mount?.({ params, query, path, view });
  } catch (err) {
    console.error(err);
    MAIN.innerHTML = `<div class="card"><h2>This page could not be rendered</h2>
      <p class="muted">${esc(err.message)}</p>
      <p class="tiny muted">The dataset behind it may be missing. Check Settings → dataset health.</p></div>`;
  }
  window.scrollTo({ top: 0, behavior: "instant" });
  closeDrawer();
}

/* ---------------- drawer ---------------- */

const drawer = document.getElementById("drawer");
const drawerBody = document.getElementById("drawerBody");
const drawerTitle = document.getElementById("drawerTitle");

export function openDrawer(title, html, after) {
  drawerTitle.textContent = title;
  drawerBody.innerHTML = html;
  drawer.hidden = false;
  document.body.style.overflow = "hidden";
  drawerBody.querySelector("input,select,textarea,button")?.focus();
  after?.(drawerBody);
}
export function closeDrawer() {
  drawer.hidden = true;
  document.body.style.overflow = "";
}
document.getElementById("drawerClose").onclick = closeDrawer;
drawer.addEventListener("click", (e) => {
  if (e.target === drawer) closeDrawer();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDrawer();
  if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName))) {
    e.preventDefault();
    openSearch();
  }
});

/* ---------------- topbar ---------------- */

document.getElementById("themeToggle").onclick = () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  store.setTheme(next);
};

const sidebar = document.getElementById("sidebar");
const closeSidebar = () => sidebar.classList.remove("open");
document.getElementById("sidebarOpen").onclick = () => sidebar.classList.add("open");
document.getElementById("sidebarClose").onclick = closeSidebar;
NAV.addEventListener("click", (e) => {
  if (e.target.closest("a")) closeSidebar();
});

document.getElementById("quickAdd").onclick = () => openLogDrawer();

export function openLogDrawer() {
  const fields = D.performance?.dailyLog?.fields || [];
  const papers = D.papers.filter((p) => ["p05", "p06", "p07", "p08", "p09", "p10", "p11", "p12"].includes(p.id));
  const controls = fields
    .filter((f) => ["studyHours", "paperId", "questionsAttempted", "questionsCorrect", "revisionMinutes", "topics", "notes"].includes(f.id))
    .map((f) => {
      if (f.id === "paperId")
        return `<label class="field"><span>${esc(f.label)}</span>
          <select name="paperId">${papers.map((p) => `<option value="${p.id}">${esc(p.short)} — ${esc(p.name)}</option>`).join("")}</select></label>`;
      if (f.id === "notes")
        return `<label class="field"><span>${esc(f.label)}</span><textarea name="notes" rows="2" placeholder="What did you actually do?"></textarea></label>`;
      if (f.id === "topics")
        return `<label class="field"><span>${esc(f.label)}</span><input name="topics" placeholder="e.g. standard costing variances" /></label>`;
      return `<label class="field"><span>${esc(f.label)}${f.unit ? ` (${esc(f.unit)})` : ""}</span>
        <input name="${f.id}" type="${f.type === "number" ? "number" : "text"}" step="any" min="0" ${f.id === "date" ? "" : ""} /></label>`;
    })
    .join("");

  openDrawer(
    "Log today's study",
    `<form id="logForm" class="stack">
      <label class="field"><span>Date</span><input name="date" type="date" value="${todayISO()}" required /></label>
      ${controls}
      <p class="tiny muted">Only log active study: problems attempted, retrieval practice, timed mocks. Passive reading does not count.</p>
      <div class="row"><button class="btn" type="submit">Save entry</button>
      <button class="btn ghost" type="button" id="cancelLog">Cancel</button></div>
    </form>`,
    (body) => {
      body.querySelector("#cancelLog").onclick = closeDrawer;
      body.querySelector("#logForm").onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const entry = Object.fromEntries(fd.entries());
        ["studyHours", "questionsAttempted", "questionsCorrect", "revisionMinutes"].forEach((k) => {
          entry[k] = Number(entry[k]) || 0;
        });
        store.addLog(entry);
        toast("Study entry saved");
        closeDrawer();
        const Ctor = document.defaultView?.CustomEvent || CustomEvent;
        document.dispatchEvent(new Ctor("pcm:refresh"));
      };
    }
  );
}

/* ---------------- global search ---------------- */

export function openSearch(initial = "") {
  openDrawer(
    "Search the system",
    `<form id="searchForm" class="row" style="margin-bottom:.8rem">
      <input name="q" value="${esc(initial)}" placeholder="Chapters, formulas, concepts, skills…" style="flex:1" autocomplete="off" />
      <button class="btn small" type="submit">Search</button>
    </form>
    <div id="searchResults"><p class="tiny muted">Type at least two characters. Press Enter for the full results page.</p></div>`,
    (body) => {
      const input = body.querySelector("input[name=q]");
      const box = body.querySelector("#searchResults");
      const draw = () => {
        const res = searchAll(input.value, 12);
        box.innerHTML = res.length
          ? res
              .map(
                (r) => `<a class="result" href="${r.href}"><span class="chip">${esc(r.type)}</span>
                <div><strong>${esc(r.title)}</strong><div class="tiny muted">${esc(r.sub || "")}</div></div></a>`
              )
              .join("")
          : `<p class="tiny muted">Nothing matched.</p>`;
        box.querySelectorAll("a").forEach((a) => (a.onclick = closeDrawer));
      };
      input.oninput = draw;
      body.querySelector("#searchForm").onsubmit = (e) => {
        e.preventDefault();
        if (!input.value.trim()) return;
        closeDrawer();
        location.hash = `#/search?q=${encodeURIComponent(input.value.trim())}`;
      };
      input.focus();
    }
  );
}

/* ---------------- start ---------------- */

boot();
