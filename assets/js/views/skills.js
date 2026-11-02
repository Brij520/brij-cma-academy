/* Professional academies — software, accounting/finance, FP&A, markets, data & AI, communication. */

import { D } from "../data.js";
import * as store from "../store.js";
import { esc, num, pct, table, callout, empty, accordion, toast, badge, progress, stat, refresh } from "../ui.js";

const ACADEMIES = [
  {
    id: "software",
    name: "Professional Software Academy",
    ico: "⬡",
    blurb: "16 tools, three levels each, with exercises, projects and portfolio artefacts. Free tools flagged wherever a paid licence is not essential.",
    hours: () => (D.software.skills || []).reduce((a, s) => a + (s.totalHours || 0), 0),
    count: () => `${(D.software.skills || []).length} skills · ${(D.software.tracks || []).length} tracks`,
    rank: 4,
  },
  {
    id: "finance",
    name: "Advanced Accounting & Finance Academy",
    ico: "▤",
    blurb: "Three tracks — accounting, corporate finance, cost and management accounting — built on the ICMAI syllabus but aimed at practice, not marks alone.",
    hours: () => (D.finance.tracks || []).reduce((a, t) => a + (t.hours || 0), 0),
    count: () => `${(D.finance.tracks || []).length} tracks · ${(D.finance.tracks || []).reduce((a, t) => a + (t.modules || []).length, 0)} modules`,
    rank: 4,
  },
  {
    id: "fpa",
    name: "FP&A and CFO Academy",
    ico: "◫",
    blurb: "15 topics across the planning cycle, two business simulations and the eight named projects a finance business partner is actually asked to deliver.",
    hours: () => (D.fpa.topics || []).reduce((a, t) => a + (t.hours || 0), 0) + (D.fpa.projects || []).reduce((a, p) => a + (p.hours || 0), 0),
    count: () => `${(D.fpa.topics || []).length} topics · ${(D.fpa.projects || []).length} projects`,
    rank: 5,
  },
  {
    id: "markets",
    name: "Financial Markets and Investment",
    ico: "◇",
    blurb: "Structure, instruments, valuation and risk — with simulated portfolios. Educational analysis only, never investment advice.",
    hours: () => (D.markets.modules || []).reduce((a, m) => a + (m.hours || 0), 0),
    count: () => `${(D.markets.modules || []).length} modules · ${(D.markets.projects || []).length} simulated projects`,
    rank: 6,
  },
  {
    id: "data-ai",
    name: "Data Science and AI for Finance",
    ico: "⌘",
    blurb: "Python, SQL, analytics and applied AI — then eight automation projects that remove real finance drudgery, each with a guardrail.",
    hours: () => (D.dataAi.pathway || []).reduce((a, p) => a + (p.hours || 0), 0) + (D.dataAi.automationProjects || []).reduce((a, p) => a + (p.hours || 0), 0),
    count: () => `${(D.dataAi.pathway || []).length} pathways · ${(D.dataAi.automationProjects || []).length} automation projects`,
    rank: 5,
  },
  {
    id: "communication",
    name: "Professional Communication Academy",
    ico: "❝",
    blurb: "Finance-specific speaking and writing: explaining a variance, defending a number, presenting to management. Daily drills, not generic grammar lessons.",
    hours: () => (D.communication.areas || []).reduce((a, x) => a + (x.hours || 0), 0),
    count: () => `${(D.communication.areas || []).length} areas · daily rotation`,
    rank: 4,
  },
];

/* ---------------- academy index ---------------- */

export function renderAcademies() {
  const state = store.get();
  return `
  <div class="card">
    <div class="card-head"><div><h2 style="margin:0">Skill academies</h2>
      <p class="card-sub">The professional layer. Each academy ends in an inspectable artefact, not a certificate of attendance.</p></div>
      <span class="spacer"></span><span class="chip amber">ranks 4–6</span></div>
    ${callout(`<strong>Subordinate by design.</strong> These sit beneath the CMA exams in the priority hierarchy: about 4 hours a week for professional skills and 1.5 for technology, dropping to zero in the 12 weeks before an exam window. Communication practice is the exception — it continues.`, "warn")}
    <div class="grid two" style="margin-top:.9rem">
      ${ACADEMIES.map((a) => {
        const done = (D.portfolio.projects || []).filter((p) => p.skill && state.portfolio?.[p.id]?.status === "complete").length;
        return `<a class="card tight" href="#/academy/${a.id}" style="text-decoration:none;color:inherit">
          <div class="row" style="justify-content:space-between">
            <div class="row" style="gap:.5rem"><span style="font-size:1.2rem;color:var(--accent)">${a.ico}</span>
              <strong>${esc(a.name)}</strong></div>
            <span class="chip">R${a.rank}</span>
          </div>
          <p class="tiny muted" style="margin:.4rem 0">${esc(a.blurb)}</p>
          <div class="row tiny muted" style="gap:.8rem"><span>${esc(a.count())}</span><span>~${num(a.hours())} h</span></div>
        </a>`;
      }).join("")}
    </div>
  </div>

  <div class="card" style="margin-top:1rem">
    <div class="card-head"><h3>How to sequence the professional layer</h3></div>
    <ol class="tight-list">
      <li><strong>Excel and one reporting tool first.</strong> Every finance role assumes them; nothing else compensates.</li>
      <li><strong>Then the accounting/finance track that mirrors your current paper</strong> — study and skill reinforce each other instead of competing.</li>
      <li><strong>Then FP&amp;A projects with synthetic data.</strong> These become your portfolio and your interview material.</li>
      <li><strong>Then SQL and Python,</strong> in that order. Automation is worth more after you can specify the process precisely.</li>
      <li><strong>AI tooling last and carefully,</strong> with the guardrails in the data-and-AI academy: no confidential client data, human review on every output.</li>
    </ol>
    <p class="tiny muted" style="margin-bottom:0">No academy promises a job, and a certificate is not a qualification. What you can show — a model, a reconciliation, a written recommendation — is the only durable evidence.</p>
  </div>`;
}

export function mountAcademies() {}

/* ---------------- academy detail ---------------- */

export function renderAcademy({ params }) {
  const id = params[0];
  if (id === "software") return softwareAcademy();
  if (id === "finance") return financeAcademy();
  if (id === "fpa") return fpaAcademy();
  if (id === "markets") return marketsAcademy();
  if (id === "data-ai") return dataAiAcademy();
  if (id === "communication") return communicationAcademy();
  return empty("Academy not found", "Return to the academy index.");
}

export function mountAcademy() {}

function academyHeader(title, sub, chips = "") {
  return `<div class="row tiny muted" style="margin-bottom:.6rem"><a href="#/academies">Academies</a> / ${esc(title)}</div>
  <div class="card"><div class="card-head"><div><h2 style="margin:0">${esc(title)}</h2>
    <p class="card-sub">${esc(sub)}</p></div><span class="spacer"></span><div class="row">${chips}</div></div></div>`;
}

function softwareAcademy() {
  const state = store.get();
  const skills = D.software.skills || [];
  const totalHours = skills.reduce((a, s) => a + (s.totalHours || 0), 0);
  return `${academyHeader(
    "Professional Software Academy",
    D.software.meta?.purpose || "Tool fluency with exercises, projects and portfolio deliverables.",
    `<span class="chip">${skills.length} skills</span><span class="chip">~${num(totalHours)} h</span>`
  )}
  ${callout(`<strong>Cost rule.</strong> ${esc(D.software.meta?.costNote || "Prefer free tools and free learning paths; pay for a certificate only when an employer or a specific role requires it.")}`, "")}
  ${(D.software.tracks || [])
    .map(
      (t) => `<div class="card" style="margin-top:1rem">
      <div class="card-head"><h3>${esc(t.name)}</h3><span class="spacer"></span><span class="chip">${(t.skills || []).length}</span></div>
      <div class="grid two">
        ${(t.skills || [])
          .map((sid) => {
            const s = skills.find((x) => x.id === sid);
            if (!s) return "";
            const rec = state.skills?.[s.id]?.levels || {};
            const doneH = (s.levels || []).filter((l) => rec[l.level]?.status === "done").reduce((a, l) => a + (l.hours || 0), 0);
            const startedH = (s.levels || []).filter((l) => ["learning", "done"].includes(rec[l.level]?.status)).reduce((a, l) => a + (l.hours || 0), 0);
            return `<a class="card tight" href="#/skill/${s.id}" style="text-decoration:none;color:inherit">
              <div class="row" style="justify-content:space-between"><strong>${esc(s.name)}</strong>
                <span class="chip ${doneH === s.totalHours ? "green" : ""}">${num(doneH)}/${s.totalHours} h</span></div>
              <p class="tiny muted" style="margin:.3rem 0">${esc(s.why || "")}</p>
              ${progress((startedH / (s.totalHours || 1)) * 100)}
              <div class="row tiny muted" style="margin-top:.3rem"><span>Priority ${s.priority}</span><span>·</span>
                <span>${esc(s.freeTool || "")}</span></div>
            </a>`;
          })
          .join("")}
      </div></div>`
    )
    .join("")}`;
}

function financeAcademy() {
  return `${academyHeader(
    "Advanced Accounting & Finance Academy",
    D.finance.meta?.purpose || "Accounting, corporate finance and management accounting, taught for practice.",
    `<span class="chip">${(D.finance.tracks || []).length} tracks</span>`
  )}
  ${callout(`<strong>Principle.</strong> ${esc(D.finance.meta?.principle || "Do the work, not just the reading.")}`, "")}
  ${(D.finance.tracks || [])
    .map(
      (t) => `<div class="card" style="margin-top:1rem">
      <div class="card-head"><div><h3>${esc(t.name)}</h3>
        <p class="card-sub">${esc(t.outcome || "")}</p></div><span class="spacer"></span>
        <span class="chip">${t.hours} h</span><span class="chip">${esc(t.level)}</span></div>
      ${(t.modules || [])
        .map((m) =>
          accordion(
            `${m.id ? m.id.toUpperCase() + " · " : ""}${m.name}`,
            `<div class="grid two">
              <div>
                <p class="small">${esc(m.outcome || "")}</p>
                <p class="tiny muted" style="margin:.2rem 0 .3rem"><b>Topics</b></p>
                <ul class="tight-list">${(m.topics || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
              </div>
              <div>
                <p class="tiny muted" style="margin:0 0 .3rem"><b>Practice</b></p>
                <p class="small">${esc(m.practice || "")}</p>
                <p class="tiny muted" style="margin:.4rem 0 .2rem"><b>Deliverable</b></p>
                <p class="small">${esc(m.deliverable || "")}</p>
                <div class="row" style="margin-top:.4rem">
                  ${(m.papers || []).map((p) => `<a class="chip" href="#/paper/${p}">${esc(D.papersById[p]?.short || p)}</a>`).join("")}
                  ${(m.concepts || []).map((c) => `<a class="chip" href="#/concepts?focus=${c}">${esc(D.conceptById[c]?.label || c)}</a>`).join("")}
                </div>
              </div>
            </div>`,
            false,
            `${m.hours} h`
          )
        )
        .join("")}
    </div>`
    )
    .join("")}`;
}

function fpaAcademy() {
  const f = D.fpa;
  return `${academyHeader(
    "FP&A and CFO Academy",
    f.meta?.purpose || "The planning, reporting and decision cycle of a finance function.",
    `<span class="chip">${(f.topics || []).length} topics</span><span class="chip">${(f.projects || []).length} projects</span>`
  )}
  ${callout(`<strong>Standard.</strong> ${esc(f.meta?.standard || "Every topic ends in a deliverable a manager could review.")}`, "")}

  <div class="card" style="margin-top:1rem"><div class="card-head"><h3>The planning cycle</h3></div>
    <div class="grid three">
      ${Object.entries(f.cycle || {}).map(([k, v]) => `<div class="stat"><div class="label">${esc(k)}</div>
        <div class="small">${esc(Array.isArray(v) ? v.join(" · ") : String(v))}</div></div>`).join("")}
    </div>
  </div>

  <div class="card" style="margin-top:1rem"><div class="card-head"><h3>15 topics</h3></div>
    ${table(
      [
        { key: "name", label: "Topic" },
        { key: "outcome", label: "Outcome" },
        { key: "hours", label: "Hours", num: true },
        { key: "deliverable", label: "Deliverable" },
      ],
      f.topics || []
    )}
  </div>

  <div class="card" style="margin-top:1rem"><div class="card-head"><h3>The eight projects</h3>
    <span class="spacer"></span><span class="chip">portfolio-grade</span></div>
    ${(f.projects || [])
      .map((p) =>
        accordion(
          `${p.no ? p.no + ". " : ""}${p.title}`,
          `<p class="small">${esc(p.brief || "")}</p>
          <div class="grid two">
            <div><p class="tiny muted" style="margin:0 0 .2rem"><b>Dataset</b></p><p class="small">${esc(p.dataset || "")}</p>
              <p class="tiny muted" style="margin:.4rem 0 .2rem"><b>Steps</b></p>
              <ul class="tight-list">${(p.steps || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>
            <div><p class="tiny muted" style="margin:0 0 .2rem"><b>Deliverables</b></p>
              <ul class="tight-list">${(p.deliverables || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
              <p class="tiny muted" style="margin:.4rem 0 .2rem"><b>Rubric</b></p>
              <ul class="tight-list">${(p.rubric || []).map((s) => `<li>${esc(typeof s === "string" ? s : `${s.criterion} — ${s.weight}%`)}</li>`).join("")}</ul></div>
          </div>
          <div class="row" style="margin-top:.4rem">${(p.skills || []).map((s) => `<a class="chip" href="#/skill/${s}">${esc(D.software.skills?.find((x) => x.id === s)?.name || s)}</a>`).join("")}
            ${p.portfolio ? `<span class="chip accent">portfolio: ${esc(p.portfolio)}</span>` : ""}</div>`,
          false,
          `${p.hours} h`
        )
      )
      .join("")}
  </div>

  <div class="grid two" style="margin-top:1rem">
    ${(f.simulations || []).map((s) => `<div class="card"><div class="card-head"><h3>${esc(s.name)}</h3><span class="spacer"></span><span class="chip">${s.hours} h</span></div>
      <p class="small">${esc(s.scenario || "")}</p>
      <p class="tiny muted" style="margin:.3rem 0 .2rem"><b>Decisions</b></p>
      <ul class="tight-list">${(s.decisions || []).map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
      <p class="tiny" style="margin:.4rem 0 0"><b>Deliverable:</b> ${esc(s.deliverable || "")}</p></div>`).join("")}
  </div>`;
}

function marketsAcademy() {
  const m = D.markets;
  const d = m.meta?.disclaimer || {};
  return `${academyHeader(
    "Financial Markets and Investment",
    m.meta?.purpose || "How markets work, how instruments are valued, and how risk is managed.",
    `<span class="chip">${(m.modules || []).length} modules</span>`
  )}
  ${callout(`<strong style="color:var(--rose)">${esc(d.headline || "Education, not investment advice.")}</strong><br>
    ${esc(d.body || "")}
    <ul class="tight-list" style="margin-top:.5rem">${(d.rules || []).map((r) => `<li>${esc(r)}</li>`).join("")}</ul>`, "danger")}

  <div class="card" style="margin-top:1rem"><div class="card-head"><h3>Modules</h3></div>
    ${(m.modules || [])
      .map((mod) =>
        accordion(
          mod.name,
          `<p class="small">${esc(mod.outcome || "")}</p>
          <p class="tiny muted" style="margin:.3rem 0 .2rem"><b>Topics</b></p>
          <div class="row" style="gap:.25rem">${(mod.topics || []).map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>
          <p class="small" style="margin-top:.5rem"><b>Practice.</b> ${esc(mod.practice || "")}</p>
          <p class="tiny muted" style="margin:.2rem 0 0"><b>Deliverable:</b> ${esc(mod.deliverable || "")}</p>`,
          false,
          `${mod.level} · ${mod.hours} h`
        )
      )
      .join("")}
  </div>

  <div class="card" style="margin-top:1rem"><div class="card-head"><h3>Simulated portfolio projects</h3></div>
    <div class="grid two">
      ${(m.projects || []).map((p) => `<div class="card tight"><strong class="small">${esc(p.title)}</strong>
        <p class="tiny muted" style="margin:.3rem 0">${esc(p.brief || "")}</p>
        <p class="tiny"><b>Deliverable:</b> ${esc(p.deliverable || "")}</p>
        <p class="tiny faint">${esc(p.hours)} h · simulated money only</p></div>`).join("")}
    </div>
  </div>

  <div class="card" style="margin-top:1rem"><div class="card-head"><h3>Research workflow</h3>
    <span class="spacer"></span><span class="chip">6 steps</span></div>
    <ol class="tight-list">${(m.researchWorkflow || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
  </div>`;
}

function dataAiAcademy() {
  const da = D.dataAi;
  return `${academyHeader(
    "Data Science and AI for Finance",
    da.meta?.purpose || "Python, SQL and applied AI, aimed at finance work rather than general data science.",
    `<span class="chip">${(da.pathway || []).length} pathways</span><span class="chip">${(da.automationProjects || []).length} projects</span>`
  )}
  ${callout(`<strong>Data policy.</strong> ${esc(da.meta?.dataPolicy || "Use synthetic or anonymised data only.")}<br>
    <span class="tiny">${esc(da.meta?.principle || "")}</span>`, "warn")}

  <div class="card" style="margin-top:1rem"><div class="card-head"><h3>Learning pathway</h3></div>
    ${(da.pathway || [])
      .map((p) =>
        accordion(
          p.name,
          `<p class="tiny muted" style="margin:0 0 .4rem">${esc(p.level)} · ${p.hours} h</p>
          ${(p.modules || [])
            .map(
              (mod) => `<div style="margin-bottom:.5rem"><strong class="small">${esc(mod.name)}</strong>
              <div class="row" style="gap:.25rem;margin:.2rem 0">${(mod.topics || []).map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>
              ${mod.exercise ? `<p class="tiny muted" style="margin:0">Exercise: ${esc(mod.exercise)}</p>` : ""}</div>`
            )
            .join("")}
          ${(p.projects || []).length ? `<p class="tiny muted" style="margin:.3rem 0 0"><b>Projects:</b> ${p.projects.map((x) => esc(typeof x === "string" ? x : x.title)).join(" · ")}</p>` : ""}`,
          false,
          `${p.hours} h`
        )
      )
      .join("")}
  </div>

  <div class="card" style="margin-top:1rem"><div class="card-head"><h3>Eight automation projects</h3>
    <span class="spacer"></span><span class="chip rose">guardrail on each</span></div>
    ${(da.automationProjects || [])
      .map((p) =>
        accordion(
          `${p.no}. ${p.title}`,
          `<p class="small">${esc(p.problem || "")}</p>
          <div class="grid two">
            <div><p class="tiny muted" style="margin:0 0 .2rem"><b>Inputs</b></p>
              <ul class="tight-list">${(p.inputs || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
              <p class="tiny muted" style="margin:.4rem 0 .2rem"><b>Approach</b></p>
              <ol class="tight-list">${(p.approach || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ol></div>
            <div><p class="tiny muted" style="margin:0 0 .2rem"><b>Tools</b></p>
              <div class="row" style="gap:.25rem">${(p.tools || []).map((x) => `<span class="chip">${esc(x)}</span>`).join("")}</div>
              <p class="tiny muted" style="margin:.4rem 0 .2rem"><b>Evaluation</b></p>
              <p class="small">${esc(p.evaluation || "")}</p>
              <p class="tiny muted" style="margin:.4rem 0 .2rem"><b>Deliverable</b></p>
              <p class="small">${esc(p.deliverable || "")}</p></div>
          </div>
          ${callout(`<strong>Guardrail.</strong> ${esc(p.guardrail || "")}`, "warn")}`,
          false,
          `${p.difficulty} · ${p.hours} h`
        )
      )
      .join("")}
  </div>

  ${da.capstone ? `<div class="card" style="margin-top:1rem"><div class="card-head"><h3>Capstone — ${esc(da.capstone.name)}</h3></div>
    <p class="small">${esc(da.capstone.brief)}</p>
    <p class="tiny"><b>Deliverable:</b> ${esc(da.capstone.deliverable || "")}</p>
    <p class="tiny muted"><b>Evaluation:</b> ${esc(da.capstone.evaluation || "")}</p></div>` : ""}`;
}

function communicationAcademy() {
  const c = D.communication;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const rotation = c.dailyPractice?.rotation || [];
  const todayRot = rotation.find((r) => r.day === today) || rotation[0];
  return `${academyHeader(
    "Professional Communication Academy",
    c.meta?.purpose || "Finance-specific speaking and writing.",
    `<span class="chip">${(c.areas || []).length} areas</span>`
  )}
  ${callout(`<strong>Method.</strong> ${esc(c.meta?.method || "")} <br><span class="tiny">${esc(c.meta?.rule || "")}</span>`, "")}

  ${todayRot ? `<div class="card" style="margin-top:1rem"><div class="card-head"><h3>Today — ${esc(todayRot.day)}</h3>
    <span class="spacer"></span><span class="chip accent">15 minutes</span></div>
    <div class="grid two">
      <div><h4 class="mini-head">Speaking</h4><p class="small">${esc(todayRot.speaking)}</p></div>
      <div><h4 class="mini-head">Writing</h4><p class="small">${esc(todayRot.writing)}</p></div>
    </div></div>` : ""}

  <div class="card" style="margin-top:1rem"><div class="card-head"><h3>Levels</h3></div>
    ${(c.levels || []).map((l) => `<div class="timeline-item"><div class="t">${esc(l.name)}</div>
      <div class="m">${esc(l.outcome)}</div>
      <div class="row" style="gap:.25rem;margin-top:.2rem">${(l.areas || []).map((a) => `<span class="chip">${esc(a)}</span>`).join("")}</div></div>`).join("")}
  </div>

  <div class="card" style="margin-top:1rem"><div class="card-head"><h3>Areas and drills</h3></div>
    ${(c.areas || [])
      .map((a) =>
        accordion(
          a.name,
          `<p class="small">${esc(a.outcome || "")}</p>
          <p class="tiny muted" style="margin:.3rem 0 .2rem"><b>Focus</b></p>
          <div class="row" style="gap:.25rem">${(a.focus || []).map((f) => `<span class="chip">${esc(f)}</span>`).join("")}</div>
          <p class="tiny muted" style="margin:.45rem 0 .2rem"><b>Drills</b></p>
          <ul class="tight-list">${(a.drills || []).map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
          <p class="tiny"><b>Success test:</b> ${esc(a.successTest || "")}</p>`,
          false,
          `${a.hours} h`
        )
      )
      .join("")}
  </div>

  <div class="grid two" style="margin-top:1rem">
    <div class="card"><div class="card-head"><h3>Weekly rotation</h3></div>
      ${table([{ key: "day", label: "Day" }, { key: "speaking", label: "Speaking" }, { key: "writing", label: "Writing" }], rotation)}
    </div>
    <div class="card"><div class="card-head"><h3>Assessment rubric</h3></div>
      ${table(
        [
          { key: "criterion", label: "Criterion" },
          { key: "weight", label: "Weight", num: true, render: (v) => `${v}%` },
          { key: "detail", label: "What good looks like" },
        ],
        c.assessment?.rubric || []
      )}
      ${(c.assessment?.selfCheck || []).length ? `<p class="tiny muted" style="margin-top:.5rem"><b>Self-check:</b> ${c.assessment.selfCheck.map((x) => esc(x)).join(" · ")}</p>` : ""}
    </div>
  </div>

  <div class="card" style="margin-top:1rem"><div class="card-head"><h3>Prompt bank</h3></div>
    <div class="grid two">
      <div><h4 class="mini-head">Speaking prompts</h4>
        <ul class="tight-list">${(c.dailyPractice?.speakingPrompts || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
      <div><h4 class="mini-head">Writing prompts</h4>
        <ul class="tight-list">${(c.dailyPractice?.writingPrompts || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
    </div>
  </div>`;
}

/* ---------------- software skill detail ---------------- */

export function renderSkill({ params }) {
  const id = params[0];
  const s = (D.software.skills || []).find((x) => x.id === id);
  if (!s) return empty("Skill not found", "Return to the software academy.");
  const state = store.get();
  const rec = state.skills?.[s.id]?.levels || {};
  const doneH = (s.levels || []).filter((l) => rec[l.level]?.status === "done").reduce((a, l) => a + (l.hours || 0), 0);
  const track = (D.software.tracks || []).find((t) => t.id === s.track);

  return `
  <div class="row tiny muted" style="margin-bottom:.6rem"><a href="#/academies">Academies</a> /
    <a href="#/academy/software">Software</a> / ${esc(s.name)}</div>
  <div class="card">
    <div class="card-head"><div>
      <div class="row" style="gap:.4rem"><span class="chip accent">${esc(track?.name || s.track)}</span>
        <span class="chip">Priority ${s.priority}</span><span class="chip">${s.totalHours} h</span></div>
      <h2 style="margin:.45rem 0 .2rem">${esc(s.name)}</h2>
      <p class="card-sub">${esc(s.why || "")}</p></div>
      <span class="spacer"></span>
      <div class="score-ring" style="--v:${Math.round((doneH / (s.totalHours || 1)) * 100)};width:78px;height:78px">
        <b style="font-size:1.1rem">${Math.round((doneH / (s.totalHours || 1)) * 100)}%</b></div>
    </div>
    <div class="row tiny muted" style="gap:.9rem;margin-top:.5rem">
      <span><b>Free option:</b> ${esc(s.freeTool || "—")}</span>
      ${(s.prerequisites || []).length ? `<span><b>Prerequisites:</b> ${s.prerequisites.map((p) => `<a href="#/skill/${esc(p)}">${esc(D.software.skills?.find((x) => x.id === p)?.name || p)}</a>`).join(", ")}</span>` : `<span><b>Prerequisites:</b> none</span>`}
    </div>
    ${progress((doneH / (s.totalHours || 1)) * 100)}
    <p class="tiny muted" style="margin:.35rem 0 0">${num(doneH)} of ${s.totalHours} hours marked complete. Hours are your own honest estimate — the exercise and assessment decide whether a level is done.</p>
  </div>

  ${(s.levels || [])
    .map((l, i) => {
      const status = rec[l.level]?.status || "not-started";
      return `<div class="card" style="margin-top:1rem">
      <div class="card-head"><div><h3>${esc(l.level)}</h3>
        <p class="card-sub">${l.hours} h · ${(l.modules || []).length} modules</p></div>
        <span class="spacer"></span>
        <div class="row" id="levelRow-${i}">
          ${["not-started", "learning", "done"].map((st) => `<button class="btn small ${status === st ? "" : "ghost"}" data-skill="${esc(s.id)}" data-level="${esc(l.level)}" data-st="${st}">${st.replace("-", " ")}</button>`).join("")}
        </div></div>
      <div class="grid two">
        <div><h4 class="mini-head">You should be able to</h4>
          <ul class="tight-list">${(l.outcomes || []).map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
          <h4 class="mini-head" style="margin-top:.6rem">Exercise</h4>
          <p class="small">${esc(l.exercise || "")}</p></div>
        <div><h4 class="mini-head">Modules</h4>
          ${(l.modules || []).map((m) => `<div style="margin-bottom:.45rem"><strong class="small">${esc(m.name)}</strong>
            <div class="row" style="gap:.2rem;margin-top:.15rem">${(m.topics || []).map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div></div>`).join("")}</div>
      </div>
      ${l.assessment ? `<div class="card tight flat" style="margin-top:.6rem;background:var(--panel-2)">
        <div class="row" style="justify-content:space-between"><strong class="small">Assessment — ${esc(l.assessment.type)}</strong>
          <span class="chip">${esc(l.assessment.duration || "")} · pass ${l.assessment.pass ?? 70}%</span></div>
        <ul class="tight-list" style="margin-top:.3rem">${(l.assessment.items || []).map((x) => `<li class="small">${esc(x)}</li>`).join("")}</ul>
      </div>` : ""}
    </div>`;
    })
    .join("")}

  <div class="grid two" style="margin-top:1rem">
    <div class="card"><div class="card-head"><h3>Projects</h3></div>
      ${(s.projects || []).length
        ? (s.projects || []).map((p) => `<div class="note"><strong class="small">${esc(p.title)}</strong>
            <p class="tiny muted" style="margin:.2rem 0">${esc(p.brief)}</p>
            <p class="tiny"><b>Deliverable:</b> ${esc(p.deliverable)} · ${p.hours} h</p></div>`).join("")
        : `<p class="muted small">No projects authored.</p>`}
    </div>
    <div class="card"><div class="card-head"><h3>Industry use and evidence</h3></div>
      <h4 class="mini-head">Where it is used</h4>
      <ul class="tight-list">${(s.industryUseCases || []).map((u) => `<li>${esc(u)}</li>`).join("")}</ul>
      <h4 class="mini-head" style="margin-top:.6rem">Portfolio artefacts</h4>
      <ul class="tight-list">${(s.portfolioDeliverables || []).map((u) => `<li>${esc(u)}</li>`).join("")}</ul>
      ${s.certification ? `<h4 class="mini-head" style="margin-top:.6rem">Certification</h4>
        <p class="small">${esc(s.certification.name)} · ${esc(s.certification.provider)}<br>
        <span class="tiny muted">${esc(s.certification.cost)} · <a href="${esc(s.certification.link)}" target="_blank" rel="noopener">official page</a></span></p>` : ""}
      <p class="tiny muted">Verify cost and availability before paying. A certificate is evidence of study, never a guarantee of a role.</p>
    </div>
  </div>`;
}

export function mountSkill() {
  document.querySelectorAll("[data-skill]").forEach((btn) => {
    btn.onclick = () => {
      store.setSkillLevel(btn.dataset.skill, btn.dataset.level, { status: btn.dataset.st });
      toast(`${btn.dataset.level} → ${btn.dataset.st.replace("-", " ")}`);
      refresh();
    };
  });
}
