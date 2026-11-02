/* Career paths — eleven finance roles, ten elements each. No promises. */

import { D } from "../data.js";
import { esc, table, callout, empty, accordion, badge } from "../ui.js";

const ELEMENTS = [
  ["qualifications", "Qualifications"],
  ["technicalKnowledge", "Technical knowledge"],
  ["software", "Software"],
  ["experienceExpectations", "Experience expectations"],
  ["technicalAssessments", "Technical assessments"],
  ["interviewQuestions", "Interview questions"],
  ["caseStudies", "Case studies"],
  ["resumeRequirements", "Resume requirements"],
  ["portfolioProjects", "Portfolio projects"],
  ["progression", "Progression"],
];

export function render({ params = [], query = {} } = {}) {
  const roleId = params[0] || query.role;
  const roles = D.careers.roles || [];
  if (roleId) {
    const r = roles.find((x) => x.id === roleId);
    if (!r) return empty("Role not found", `<a href="#/careers">Back to career paths</a>`);
    return roleDetail(r);
  }
  const families = [...new Set(roles.map((r) => r.family))];

  return `
  <div class="card">
    <div class="card-head"><div><h2 style="margin:0">Career paths</h2>
      <p class="card-sub">Eleven finance roles with the knowledge, tools, assessments and evidence each one actually asks for.</p></div>
      <span class="spacer"></span><span class="chip">${roles.length} roles</span></div>
    ${callout(`<strong>${esc(typeof D.careers.meta?.disclaimer === "object" ? D.careers.meta.disclaimer.headline : "What this is not")}.</strong>
      ${esc(
        typeof D.careers.meta?.disclaimer === "object"
          ? D.careers.meta.disclaimer.body
          : D.careers.meta?.disclaimer || "No module here promises employment. A qualification or certificate is one input to a hiring decision, not a guarantee."
      )}`, "warn")}
    <div class="grid two" style="margin-top:.8rem">
      ${roles
        .map(
          (r) => `<a class="card tight" href="#/careers/${r.id}" style="text-decoration:none;color:inherit">
          <div class="row" style="justify-content:space-between"><strong>${esc(r.name)}</strong><span class="chip">${esc(r.entryLevel)}</span></div>
          <p class="tiny muted" style="margin:.25rem 0 .3rem">${esc(r.family)}</p>
          <p class="tiny muted" style="margin:0">${(r.typicalTitles || []).slice(0, 3).map((t) => esc(t)).join(" · ")}</p>
        </a>`
        )
        .join("")}
    </div>
    <p class="tiny muted" style="margin-top:.8rem">Families: ${families.map((f) => esc(f)).join(" · ")}. The same evidence base — a documented model, a reconciliation, a written recommendation — supports several roles; you do not need eleven portfolios.</p>
  </div>

  <div class="card" style="margin-top:1rem">
    <div class="card-head"><h3>Company preparation</h3><span class="spacer"></span><span class="chip">Big Four · consulting · banking</span></div>
    ${(D.careers.companyPreparation || [])
      .map((c) =>
        accordion(
          c.name,
          `<div class="grid two">
            <div><h4 class="mini-head">What they look for</h4>
              <ul class="tight-list">${(c.whatTheyLookFor || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
              <h4 class="mini-head" style="margin-top:.5rem">Process</h4>
              <ol class="tight-list">${(c.process || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ol></div>
            <div><h4 class="mini-head">Preparation</h4>
              <ul class="tight-list">${(c.preparation || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
              <h4 class="mini-head" style="margin-top:.5rem">Watch-outs</h4>
              <ul class="tight-list">${(c.watchOuts || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
          </div>`
        )
      )
      .join("")}
  </div>

  ${D.careers.portfolioGuidance ? `<div class="card" style="margin-top:1rem"><div class="card-head"><h3>Portfolio guidance</h3></div>
    <p class="small">${esc(D.careers.portfolioGuidance.principle || "")}</p>
    <div class="grid two">
      <div><h4 class="mini-head">Starter set</h4>
        <ul class="tight-list">${(D.careers.portfolioGuidance.starterSet || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
      <div><h4 class="mini-head">Presentation</h4>
        <p class="small">${esc(D.careers.portfolioGuidance.presentation || "")}</p></div>
    </div></div>` : ""}`;
}

function roleDetail(r) {
  return `
  <div class="row tiny muted" style="margin-bottom:.6rem"><a href="#/careers">Career paths</a> / ${esc(r.name)}</div>
  <div class="card">
    <div class="card-head"><div>
      <div class="row" style="gap:.35rem"><span class="chip accent">${esc(r.family)}</span><span class="chip">${esc(r.entryLevel)}</span></div>
      <h2 style="margin:.45rem 0 .15rem">${esc(r.name)}</h2>
      <p class="card-sub">Typical titles: ${(r.typicalTitles || []).map((t) => esc(t)).join(" · ")}</p></div></div>
    <div class="grid two">
      ${ELEMENTS.map(([key, label]) => {
        const v = r[key];
        if (!v || (Array.isArray(v) && !v.length)) return "";
        return `<div class="card tight flat" style="background:var(--panel-2)">
          <h4 class="mini-head" style="margin-top:0">${esc(label)}</h4>
          ${Array.isArray(v) ? `<ul class="tight-list">${v.map((x) => `<li class="small">${esc(x)}</li>`).join("")}</ul>` : `<p class="small">${esc(v)}</p>`}
        </div>`;
      }).join("")}
    </div>
    ${(r.nextSkills || []).length ? `<div style="margin-top:.8rem"><h4 class="mini-head">Next skills</h4>
      <div class="row" style="gap:.3rem">${r.nextSkills.map((s) => `<a class="chip" href="#/skill/${esc(s)}">${esc(D.software.skills?.find((x) => x.id === s)?.name || s)}</a>`).join("")}</div></div>` : ""}
  </div>
  ${callout(`<strong>Reality check.</strong> Entry expectations above are typical ranges, not rules. Hiring depends on the market, the employer and evidence of work —
    not on a checklist you complete. Use this page to prepare, not to assume an outcome.`, "warn")}
  <div class="row" style="margin-top:.8rem"><a class="btn ghost small" href="#/portfolio">Build the evidence</a>
    <a class="btn ghost small" href="#/cases">Practise a case</a>
    <a class="btn ghost small" href="#/certifications">Check certifications</a></div>`;
}

export function mount() {}
