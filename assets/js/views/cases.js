/* Business Case Study Laboratory — technical accuracy and business judgement. */

import { D } from "../data.js";
import * as store from "../store.js";
import { esc, num, pct, table, callout, empty, accordion, badge, toast, progress } from "../ui.js";

export function renderCases({ query }) {
  const state = store.get();
  const sector = query.sector || "all";
  const sectors = ["all", ...new Set((D.cases.cases || []).map((c) => c.sector))];
  const cases = (D.cases.cases || []).filter((c) => sector === "all" || c.sector === sector);
  const completed = Object.values(state.cases || {}).filter((c) => c.status === "complete").length;

  return `
  <div class="card">
    <div class="card-head"><div><h2 style="margin:0">Business Case Study Laboratory</h2>
      <p class="card-sub">${esc(D.cases.meta?.purpose || "Six fictional companies, real finance problems.")}
      Every company is invented and every figure is synthetic. Work the numbers before reading the model approach.</p></div>
      <span class="spacer"></span><span class="chip">${completed}/${(D.cases.cases || []).length} completed</span></div>
    <div class="tabs">${sectors.map((s) => `<a class="tab${sector === s ? " active" : ""}" href="#/cases?sector=${encodeURIComponent(s)}">${esc(s === "all" ? "All sectors" : s)}</a>`).join("")}</div>
  </div>

  <div class="grid two" style="margin-top:1rem">
    ${cases
      .map((c) => {
        const rec = state.cases?.[c.id] || {};
        return `<div class="card">
          <div class="card-head"><div>
            <div class="row" style="gap:.35rem"><span class="chip accent">Case ${c.no}</span>
              <span class="chip">${esc(c.sector)}</span><span class="chip">${esc(c.difficulty)}</span>
              ${rec.status ? badge(rec.status) : ""}</div>
            <h3 style="margin:.4rem 0 .1rem">${esc(c.company)}</h3>
            <p class="card-sub">${esc(c.problem)}</p></div></div>
          <div class="row tiny muted" style="gap:.9rem;margin-bottom:.5rem">
            <span>${c.hours} h</span><span>${(c.questions || []).length} questions</span>
            <span>${(c.questions || []).reduce((a, q) => a + (q.marks || 0), 0)} marks</span>
            <span>${(c.exhibits || []).length} exhibits</span></div>
          <div class="row" style="justify-content:space-between">
            <span class="tiny muted">${(c.links?.papers || []).map((p) => esc(D.papersById[p]?.short || p)).join(" · ")}</span>
            <a class="btn small" href="#/case/${c.id}">Open case</a>
          </div>
        </div>`;
      })
      .join("")}
  </div>

  <div class="card" style="margin-top:1rem">
    <div class="card-head"><h3>Marking rubric</h3><span class="spacer"></span><span class="chip">used in every case</span></div>
    ${table(
      [
        { key: "criterion", label: "Criterion" },
        { key: "weight", label: "Weight", num: true, render: (v) => `${v}%` },
        { key: "detail", label: "What earns marks" },
      ],
      D.cases.rubric?.criteria || []
    )}
    <div class="row" style="gap:.4rem;margin-top:.6rem">
      ${(D.cases.rubric?.gradeBands || []).map((b) => `<span class="chip">${esc(b.band || b.grade)}: ${esc(b.meaning || b.description || "")}</span>`).join("")}
    </div>
  </div>

  ${callout(`<strong>How to use the lab.</strong> Read the exhibits and answer with a calculator before opening the model approach. A case is not a reading exercise:
    if you cannot state the driver in one sentence with a number attached, you have not solved it. The model approach shows one defensible route, not the only one.`, "")}`;
}

export function mountCases() {}

/* ---------------- single case ---------------- */

export function renderCase({ params, query }) {
  const id = params[0];
  const c = (D.cases.cases || []).find((x) => x.id === id);
  if (!c) return empty("Case not found", "Return to the laboratory.");
  const state = store.get();
  const rec = state.cases?.[id] || {};
  const tab = query.tab || "brief";
  const tabs = [
    ["brief", "Scenario"],
    ["exhibits", `Exhibits (${(c.exhibits || []).length})`],
    ["questions", `Questions (${(c.questions || []).length})`],
    ["work", "Your answer"],
    ["approach", "Model approach"],
    ["judgement", "Judgement points"],
  ];

  let body = "";
  if (tab === "brief") {
    body = `<p class="small">${esc(c.scenario)}</p>
      <div class="grid three" style="margin-top:.8rem">
        ${(c.links?.papers || []).map((p) => `<a class="stat" href="#/paper/${p}" style="text-decoration:none;color:inherit">
          <div class="label">Paper ${esc(D.papersById[p]?.code || "")}</div>
          <div class="small"><b>${esc(D.papersById[p]?.name || p)}</b></div></a>`).join("")}
        ${(c.links?.skills || []).map((s) => `<a class="stat" href="#/skill/${s}" style="text-decoration:none;color:inherit">
          <div class="label">Skill</div><div class="small"><b>${esc(D.software.skills?.find((x) => x.id === s)?.name || s)}</b></div></a>`).join("")}
      </div>
      <p class="tiny muted" style="margin-top:.7rem">Fictional company. Synthetic figures. Any resemblance to a real entity is coincidental.</p>`;
  } else if (tab === "exhibits") {
    body = (c.exhibits || [])
      .map((ex) =>
        `<div style="margin-bottom:1rem"><div class="card-head"><h4 class="mini-head" style="margin:0">${esc(ex.title)}</h4></div>
        ${table(
          ex.columns.map((col, i) => ({
            key: String(i),
            label: col,
            num: i > 0,
            render: (v) => (v === "" || v === null || v === undefined ? `<span class="faint">—</span>` : esc(v)),
          })),
          ex.rows
        )}</div>`
      )
      .join("") || empty("No exhibits", "This case is narrative only.");
    body += `<p class="tiny muted">All figures synthetic. Units are stated in each exhibit title; do not mix ₹ crore and ₹ lakh in one calculation.</p>`;
  } else if (tab === "questions") {
    body = (c.questions || [])
      .map(
        (q, i) => `<div class="question"><div class="q-head"><span class="chip">Q${i + 1}</span>
          <span class="chip">${q.marks} marks</span></div>
          <div class="q-text">${esc(q.q)}</div>
          <div class="tiny muted" style="margin-top:.3rem">Suggested time: ${Math.max(3, Math.round((q.marks || 5) * 1.6))} minutes</div></div>`
      )
      .join("");
    body += callout(`Total ${(c.questions || []).reduce((a, q) => a + (q.marks || 0), 0)} marks in ${c.hours} hours. Write the conclusion first, then the numbers that support it.`, "");
  } else if (tab === "work") {
    body = `<form id="caseForm" class="stack">
      <label class="field"><span>Status</span>
        <select name="status">${["not-started", "in-progress", "complete"].map((s) => `<option value="${s}"${(rec.status || "not-started") === s ? " selected" : ""}>${s.replace("-", " ")}</option>`).join("")}</select></label>
      <label class="field"><span>Your working — answer each question with figures</span>
        <textarea name="answer" rows="10" placeholder="Q1: Decomposition…&#10;Q2: Recommendation with numbers…&#10;Conclusion first.">${esc(rec.answer || "")}</textarea></label>
      <label class="field"><span>Self-assessment against the rubric</span><span class="hint">0 = absent, 5 = professional standard. Be unkind; the score is only useful if it is honest.</span></label>
      <div class="grid two">
        ${(D.cases.rubric?.criteria || []).map((cr) => `<label class="field"><span>${esc(cr.criterion)} (${cr.weight}%)</span>
          <input type="number" name="score-${esc(cr.criterion)}" min="0" max="5" step="1" value="${rec.scores?.[cr.criterion] ?? ""}" placeholder="0–5" /></label>`).join("")}
      </div>
      <button class="btn" type="submit">Save working</button>
    </form>
    ${rec.updatedAt ? `<p class="tiny muted">Last saved ${esc(new Date(rec.updatedAt).toLocaleString("en-IN"))}</p>` : ""}`;
  } else if (tab === "approach") {
    body = `<p class="small muted">One defensible route through the numbers. Yours may differ if the arithmetic holds and the assumptions are stated.</p>
      <ol class="tight-list">${(c.modelApproach || []).map((a) => `<li style="margin-bottom:.4rem">${esc(a)}</li>`).join("")}</ol>`;
  } else if (tab === "judgement") {
    body = `<p class="small muted">Technical accuracy is necessary but not sufficient. These are the business-judgement points a reviewer would press on.</p>
      <ul class="tight-list">${(c.judgementPoints || []).map((a) => `<li style="margin-bottom:.4rem">${esc(a)}</li>`).join("")}</ul>
      ${callout(`<strong>Test yourself.</strong> For each point, write one sentence starting “The number alone does not decide this because…”. If you cannot, you have memorised the case rather than learned it.`, "")}`;
  }

  return `
  <div class="row tiny muted" style="margin-bottom:.6rem"><a href="#/cases">Case laboratory</a> / Case ${c.no}</div>
  <div class="card">
    <div class="card-head"><div>
      <div class="row" style="gap:.35rem"><span class="chip accent">Case ${c.no}</span><span class="chip">${esc(c.sector)}</span>
        <span class="chip">${esc(c.difficulty)}</span>${rec.status ? badge(rec.status) : ""}</div>
      <h2 style="margin:.5rem 0 .1rem">${esc(c.company)}</h2>
      <p class="card-sub">${esc(c.problem)}</p></div>
      <span class="spacer"></span><span class="chip">${c.hours} h</span></div>
    <div class="tabs" style="margin-top:.6rem">
      ${tabs.map(([k, l]) => `<a class="tab${tab === k ? " active" : ""}" href="#/case/${id}?tab=${k}">${esc(l)}</a>`).join("")}
    </div>
  </div>
  <div class="card" style="margin-top:1rem">${body}</div>`;
}

export function mountCase({ params, query }) {
  if (query.tab !== "work") return;
  const form = document.getElementById("caseForm");
  if (!form) return;
  form.onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const scores = {};
    (D.cases.rubric?.criteria || []).forEach((cr) => {
      const v = fd.get(`score-${cr.criterion}`);
      if (v !== null && v !== "") scores[cr.criterion] = Number(v);
    });
    store.setCase(params[0], { status: fd.get("status"), answer: fd.get("answer"), scores });
    toast("Case working saved");
  };
}
