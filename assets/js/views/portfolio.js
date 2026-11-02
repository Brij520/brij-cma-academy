/* Portfolio builder — artefacts with evidence, not a list of intentions. */

import { D } from "../data.js";
import * as store from "../store.js";
import { esc, num, todayISO, table, callout, empty, badge, progress, toast, accordion, refresh } from "../ui.js";

const STATUSES = ["not-started", "in-progress", "complete"];

export function render({ query }) {
  const state = store.get();
  const status = query.status || "all";
  const projects = (D.portfolio.projects || []).filter((p) => status === "all" || (state.portfolio?.[p.id]?.status || p.status || "not-started") === status);
  const all = D.portfolio.projects || [];
  const complete = all.filter((p) => (state.portfolio?.[p.id]?.status || p.status) === "complete");
  const started = all.filter((p) => ["in-progress", "complete"].includes(state.portfolio?.[p.id]?.status || p.status));
  const hours = complete.reduce((a, p) => a + (p.hours || 0), 0);
  const template = D.portfolio.documentationTemplate || [];

  return `
  <div class="card">
    <div class="card-head"><div><h2 style="margin:0">Portfolio builder</h2>
      <p class="card-sub">${esc(D.portfolio.meta?.purpose || "Documented finance work using synthetic or anonymised data.")}</p></div>
      <span class="spacer"></span><span class="chip">${complete.length}/${all.length} complete</span></div>
    <div class="grid four" style="margin-top:.8rem">
      <div class="stat"><div class="label">Artefacts complete</div><div class="value">${complete.length}</div><div class="foot">of ${all.length} candidates</div></div>
      <div class="stat"><div class="label">In progress</div><div class="value">${started.length - complete.length}</div><div class="foot">started but undocumented</div></div>
      <div class="stat"><div class="label">Documented hours</div><div class="value">${num(hours)}</div><div class="foot">only completed artefacts count</div></div>
      <div class="stat"><div class="label">Standard</div><div class="value" style="font-size:.95rem;line-height:1.3">${esc(D.portfolio.meta?.standard || "Inspectable work")}</div><div class="foot">${esc(D.portfolio.meta?.organisation || "")}</div></div>
    </div>
    <div class="tabs" style="margin-top:.8rem">
      ${["all", ...STATUSES].map((s) => `<a class="tab${status === s ? " active" : ""}" href="#/portfolio?status=${s}">${esc(s.replace("-", " "))}</a>`).join("")}
    </div>
  </div>

  ${callout(`<strong>Data ethics.</strong> ${esc(D.portfolio.meta?.dataEthics || "Use synthetic or appropriately anonymised data. Never publish employer or client data.")}`, "warn")}

  <div class="card" style="margin-top:1rem">
    <div class="card-head"><h3>Documentation template</h3><span class="spacer"></span><span class="chip">${template.length} sections</span></div>
    <div class="grid two">
      ${template.map((t, i) => `<div class="note"><strong class="small">${i + 1}. ${esc(t.section)}</strong>
        <p class="tiny muted" style="margin:.15rem 0 0">${esc(t.prompt)}</p></div>`).join("")}
    </div>
  </div>

  <div class="grid two" style="margin-top:1rem">
    ${projects.length
      ? projects
          .map((p) => {
            const rec = state.portfolio?.[p.id] || {};
            const st = rec.status || p.status || "not-started";
            const filled = template.filter((t) => rec.docs?.[t.section]?.trim()).length;
            return `<div class="card" data-pf="${esc(p.id)}">
              <div class="card-head"><div>
                <div class="row" style="gap:.3rem"><span class="chip">${esc(p.evidence || "artefact")}</span>
                  <span class="chip">Complexity ${p.complexity}</span>${badge(st)}</div>
                <h3 style="margin:.4rem 0 .15rem">${esc(p.title)}</h3>
                <p class="card-sub">${esc(p.problem)}</p></div></div>
              <div class="row tiny muted" style="gap:.8rem">
                <span>${p.hours} h</span>
                <span>${p.skill ? esc(D.software.skills?.find((s) => s.id === p.skill)?.name || p.skill) : "no tool"}</span>
                <span>${(p.papers || []).map((x) => esc(D.papersById[x]?.short || x)).join(" · ") || "no paper link"}</span>
              </div>
              <div style="margin:.5rem 0">${progress((filled / (template.length || 1)) * 100)}</div>
              <div class="row" style="justify-content:space-between">
                <span class="tiny muted">${filled}/${template.length} documentation sections</span>
                <span class="row" style="gap:.3rem">
                  <select data-pf-status="${esc(p.id)}" style="font-size:.74rem;background:var(--panel-2);color:var(--text);border:1px solid var(--line);border-radius:6px;padding:.25rem">
                    ${STATUSES.map((s) => `<option value="${s}"${st === s ? " selected" : ""}>${s.replace("-", " ")}</option>`).join("")}
                  </select>
                  <button class="btn small ghost" data-pf-doc="${esc(p.id)}">Document</button>
                </span>
              </div>
              <div class="pf-docs" data-pf-docs="${esc(p.id)}" hidden style="margin-top:.7rem">
                <form data-pf-form="${esc(p.id)}" class="stack">
                  ${template
                    .map(
                      (t) => `<label class="field"><span>${esc(t.section)}</span>
                        <span class="hint">${esc(t.prompt)}</span>
                        <textarea name="${esc(t.section)}" rows="2">${esc(rec.docs?.[t.section] || "")}</textarea></label>`
                    )
                    .join("")}
                  <div class="row"><button class="btn small" type="submit">Save documentation</button>
                    <span class="tiny muted">Deliverables: ${esc((p.deliverables || []).join("; "))}</span></div>
                </form>
              </div>
            </div>`;
          })
          .join("")
      : empty("Nothing in this filter", "Switch the filter or start a project.")}
  </div>

  <div class="card" style="margin-top:1rem">
    <div class="card-head"><h3>Complexity ladder</h3></div>
    <div class="grid three">
      ${(D.portfolio.complexityLevels || []).map((l) => `<div class="stat"><div class="label">Level ${l.level}</div>
        <div class="small"><b>${esc(l.name)}</b></div><div class="tiny muted">${esc(l.description)}</div></div>`).join("")}
    </div>
  </div>`;
}

export function mount() {
  document.querySelectorAll("[data-pf-status]").forEach((sel) => {
    sel.onchange = () => {
      store.setPortfolio(sel.dataset.pfStatus, { status: sel.value });
      toast(`Marked ${sel.value.replace("-", " ")}`);
      refresh();
    };
  });
  document.querySelectorAll("[data-pf-doc]").forEach((b) => {
    b.onclick = () => {
      const panel = document.querySelector(`[data-pf-docs="${b.dataset.pfDoc}"]`);
      panel.hidden = !panel.hidden;
      b.textContent = panel.hidden ? "Document" : "Hide";
    };
  });
  document.querySelectorAll("[data-pf-form]").forEach((form) => {
    form.onsubmit = (e) => {
      e.preventDefault();
      const docs = {};
      new FormData(form).forEach((v, k) => (docs[k] = v));
      store.setPortfolio(form.dataset.pfForm, { docs });
      toast("Documentation saved");
    };
  });
}
