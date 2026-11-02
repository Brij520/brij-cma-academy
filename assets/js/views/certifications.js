/* Certification tracker — cost-aware, verification-first. */

import { D } from "../data.js";
import * as store from "../store.js";
import { esc, num, table, callout, empty, accordion, badge, toast, refresh } from "../ui.js";

const STATUSES = ["not-started", "planned", "in-progress", "complete"];

export function render({ query }) {
  const state = store.get();
  const cat = query.cat || "all";
  const cost = query.cost || "all";
  const cats = ["all", ...new Set((D.certifications.entries || []).map((e) => e.category))];
  const entries = (D.certifications.entries || []).filter((e) => {
    if (cat !== "all" && e.category !== cat) return false;
    if (cost === "free" && !e.freeOrLowCost) return false;
    return true;
  });
  const done = (D.certifications.entries || []).filter((e) => state.certifications?.[e.id]?.status === "complete").length;
  const free = (D.certifications.entries || []).filter((e) => e.freeOrLowCost).length;

  return `
  <div class="card">
    <div class="card-head"><div><h2 style="margin:0">Certification tracker</h2>
      <p class="card-sub">${esc(D.certifications.meta?.purpose || "Eligibility, cost, duration and practical value — with the official page.")}</p></div>
      <span class="spacer"></span><span class="chip">${done} complete</span></div>
    ${callout(`<strong>Verify before you pay.</strong> ${esc(
      typeof D.certifications.meta?.verification === "object"
        ? D.certifications.meta.verification.rule || ""
        : D.certifications.meta?.verification || "Fees, syllabi and availability change. Confirm on the provider's official page before registering."
    )}
      No certification here guarantees a job or is a substitute for the CMA qualification.`, "warn")}
    <div class="grid four" style="margin-top:.8rem">
      <div class="stat"><div class="label">Tracked</div><div class="value">${(D.certifications.entries || []).length}</div><div class="foot">across ${cats.length - 1} categories</div></div>
      <div class="stat"><div class="label">Free or low cost</div><div class="value">${free}</div><div class="foot">prioritise these</div></div>
      <div class="stat"><div class="label">In progress</div><div class="value">${Object.values(state.certifications || {}).filter((c) => c.status === "in-progress").length}</div><div class="foot">one at a time</div></div>
      <div class="stat"><div class="label">Completed</div><div class="value">${done}</div><div class="foot">evidence in the portfolio</div></div>
    </div>
    <div class="tabs" style="margin-top:.8rem">
      ${cats.map((c) => `<a class="tab${cat === c ? " active" : ""}" href="#/certifications?cat=${encodeURIComponent(c)}${cost !== "all" ? `&cost=${cost}` : ""}">${esc(c === "all" ? "All categories" : c)}</a>`).join("")}
    </div>
    <div class="row" style="margin-top:.6rem">
      <a class="btn small ${cost === "all" ? "" : "ghost"}" href="#/certifications?cat=${encodeURIComponent(cat)}">All costs</a>
      <a class="btn small ${cost === "free" ? "" : "ghost"}" href="#/certifications?cat=${encodeURIComponent(cat)}&cost=free">Free / low cost only</a>
    </div>
  </div>

  <div class="card" style="margin-top:1rem">
    <div class="card-head"><h3>Priority order</h3></div>
    ${table(
      [
        { key: "rank", label: "Rank", num: true },
        {
          key: "items",
          label: "Certifications",
          render: (v) => (Array.isArray(v) ? v : [v]).map((id) => (D.certifications.entries || []).find((e) => e.id === id)?.name || id).join(" · "),
        },
        { key: "reason", label: "Why this order" },
      ],
      D.certifications.priorityOrder || []
    )}
  </div>

  <div class="grid two" style="margin-top:1rem">
    ${entries.length
      ? entries
          .map((e) => {
            const rec = state.certifications?.[e.id] || {};
            return `<div class="card">
              <div class="card-head"><div>
                <div class="row" style="gap:.3rem">
                  <span class="chip accent">Priority ${e.priority}</span>
                  <span class="chip">${esc(e.category)}</span>
                  ${e.freeOrLowCost ? `<span class="chip green">free / low cost</span>` : `<span class="chip amber">paid</span>`}
                  ${rec.status ? badge(rec.status) : ""}
                </div>
                <h3 style="margin:.4rem 0 .1rem">${esc(e.name)}</h3>
                <p class="card-sub">${esc(e.provider)}</p></div></div>
              <dl class="kv">
                <dt>Eligibility</dt><dd>${esc(e.eligibility || "—")}</dd>
                <dt>Prerequisites</dt><dd>${(e.prerequisites || []).map((p) => esc(p)).join("; ") || "None stated"}</dd>
                <dt>Cost</dt><dd><span class="chip">${esc(e.costBand)}</span> ${esc(e.costNote || "")}</dd>
                <dt>Duration</dt><dd>${esc(e.duration || "—")}</dd>
                <dt>Practical value</dt><dd>${esc(e.practicalValue || "—")}</dd>
              </dl>
              <div style="margin-top:.5rem">
                ${accordion("Curriculum", `<ul class="tight-list">${(e.curriculum || []).map((c) => `<li class="small">${esc(c)}</li>`).join("")}</ul>`, false, `${(e.curriculum || []).length} items`)}
              </div>
              ${e.plan ? `<p class="tiny muted" style="margin:.4rem 0 0"><b>Plan:</b> ${esc(e.plan)}</p>` : ""}
              <div class="row" style="margin-top:.6rem;justify-content:space-between">
                <a class="btn small ghost" href="${esc(e.officialPage)}" target="_blank" rel="noopener">Official page ↗</a>
                <select data-cert="${esc(e.id)}" style="font-size:.74rem;background:var(--panel-2);color:var(--text);border:1px solid var(--line);border-radius:6px;padding:.25rem">
                  ${STATUSES.map((s) => `<option value="${s}"${(rec.status || e.status || "not-started") === s ? " selected" : ""}>${s.replace("-", " ")}</option>`).join("")}
                </select>
              </div>
              ${e.verifyBeforeUse ? `<p class="tiny" style="color:var(--amber);margin:.45rem 0 0">⚠ ${esc(e.verifyBeforeUse)}</p>` : ""}
            </div>`;
          })
          .join("")
      : empty("No certifications in this filter", "Clear the category or cost filter.")}
  </div>

  <p class="tiny muted">Cost bands are indicative only: ${esc(
    Object.entries(
      (typeof D.certifications.meta?.verification === "object" && D.certifications.meta.verification.costBands) || {
        free: "No fee", low: "Under about ₹10,000", moderate: "About ₹10,000–₹50,000", high: "Above about ₹50,000",
      }
    )
      .map(([k, v]) => `${k} (${v})`)
      .join(" · ")
  )}. Registration pages are recorded in <code>data/certifications.json</code>;
    the platform never links to resellers or discount codes.</p>`;
}

export function mount() {
  document.querySelectorAll("[data-cert]").forEach((sel) => {
    sel.onchange = () => {
      store.setCertification(sel.dataset.cert, { status: sel.value });
      toast(`Certification → ${sel.value.replace("-", " ")}`);
      refresh();
    };
  });
}
