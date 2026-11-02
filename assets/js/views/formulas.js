/* Formula database — searchable, filterable, printable. */

import { D } from "../data.js";
import { esc, num, toast, callout, empty, table } from "../ui.js";

export function render({ query }) {
  const q = (query.q || "").toLowerCase().trim();
  const cat = query.cat || "all";
  const paper = query.paper || "all";

  const cats = [{ id: "all", name: "All categories" }, ...(D.formulasDoc?.categories || [])];
  const papers = [...new Set(D.formulas.map((f) => (f.source || "").split("-")[0]))].filter((p) => D.papersById[p]);

  const rows = D.formulas.filter((f) => {
    if (cat !== "all" && f.category !== cat) return false;
    if (paper !== "all" && !(f.source || "").startsWith(paper)) return false;
    if (q && !`${f.name} ${f.expression} ${f.note || ""}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const grouped = {};
  rows.forEach((f) => {
    const key = f.category || "other";
    (grouped[key] = grouped[key] || []).push(f);
  });

  return `
  <div class="card no-print">
    <div class="card-head"><div><h2 style="margin:0">Formula database</h2>
      <p class="card-sub">${D.formulas.length} formulas across ${(D.formulasDoc?.categories || []).length} categories, each linked to the chapter that uses it.</p></div>
      <span class="spacer"></span>
      <button class="btn small ghost" id="printFormulas">Print sheet</button></div>
    <form class="row" id="formulaSearch">
      <input name="q" value="${esc(query.q || "")}" placeholder="Search formulas — e.g. variance, EPS, break-even" style="flex:1;min-width:220px" />
      <select name="cat">${cats.map((c) => `<option value="${c.id}"${cat === c.id ? " selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
      <select name="paper"><option value="all">All papers</option>
        ${papers.map((p) => `<option value="${p}"${paper === p ? " selected" : ""}>Paper ${D.papersById[p].code} — ${esc(D.papersById[p].short)}</option>`).join("")}</select>
      <button class="btn small">Filter</button>
      <a class="btn small ghost" href="#/formulas">Reset</a>
    </form>
    <p class="tiny muted" style="margin:.5rem 0 0">Showing <b>${rows.length}</b> formulas. Expressions are teaching forms, not statutory text — check the current standard or Act before applying them in an exam answer or at work.</p>
  </div>

  ${paper !== "all" ? callout(`<strong>Paper filter active.</strong> Showing formulas whose source chapter belongs to Paper ${D.papersById[paper]?.code}.`, "") : ""}

  ${rows.length === 0 ? empty("No formulas matched", "Try a different category or clear the search.") : ""}

  ${Object.entries(grouped)
    .map(([key, list]) => {
      const name = (cats.find((c) => c.id === key) || {}).name || key;
      return `<div class="card" style="margin-top:1rem">
        <div class="card-head"><h3>${esc(name)}</h3><span class="spacer"></span><span class="chip">${list.length}</span></div>
        <div class="grid two">
          ${list.map((f) => `<div class="formula">
            <div class="fx"><strong>${esc(f.name)}</strong><br>${esc(f.expression)}</div>
            ${f.note ? `<div class="fm">${esc(f.note)}</div>` : ""}
            <div class="row" style="margin-top:.35rem">
              <a class="tiny" href="#/chapter/${esc(f.source)}">Source chapter</a>
              <button class="btn small ghost no-print" data-copy="${esc(f.expression)}">Copy</button>
            </div>
          </div>`).join("")}
        </div>
      </div>`;
    })
    .join("")}

  <p class="tiny muted">Formula sheet built from <code>data/formulas.json</code>. ${esc(D.formulasDoc?.meta?.purpose || "")}</p>`;
}

export function mount() {
  document.getElementById("formulaSearch").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const params = new URLSearchParams();
    ["q", "cat", "paper"].forEach((k) => {
      const v = fd.get(k);
      if (v && v !== "all") params.set(k, v);
    });
    location.hash = `#/formulas${params.toString() ? "?" + params.toString() : ""}`;
  };
  document.getElementById("printFormulas").onclick = () => window.print();
  document.querySelectorAll("[data-copy]").forEach((b) => {
    b.onclick = async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.copy);
        toast("Formula copied");
      } catch {
        toast("Copy blocked by the browser");
      }
    };
  });
}
