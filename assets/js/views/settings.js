/* Settings — profile, backup, dataset health and the honest caveats. */

import { D, dataErrors } from "../data.js";
import * as store from "../store.js";
import { esc, num, table, callout, toast, confirmAction, badge, refresh } from "../ui.js";

export function render() {
  const state = store.get();
  const defaults = D.profile?.defaults || {};
  const p = { ...defaults, ...(state.profile || {}) };
  const errors = dataErrors();
  const storage = store.storageFootprint();
  const datasets = D.manifest?.datasets || [];
  const missing = datasets.filter((d) => !D.loadedIds.includes(d.id));

  return `
  <div class="card">
    <div class="card-head"><div><h2 style="margin:0">Settings and data</h2>
      <p class="card-sub">Everything personal lives in this browser. No account, no server, no analytics.</p></div></div>
  </div>

  <div class="grid two" style="margin-top:1rem">
    <div class="card">
      <div class="card-head"><h3>Student profile</h3></div>
      <form id="profileForm" class="stack">
        <label class="field"><span>Name</span><input name="name" value="${esc(p.name || "")}" placeholder="How the dashboard addresses you" /></label>
        <div class="grid two">
          <label class="field"><span>Stage</span>
            <select name="stage">${["Foundation", "Intermediate", "Final", "Qualified"].map((s) => `<option${p.stage === s ? " selected" : ""}>${s}</option>`).join("")}</select></label>
          <label class="field"><span>Weekly capacity (hours)</span>
            <input type="number" name="weeklyCapacityHours" min="5" max="100" value="${esc(p.weeklyCapacityHours || 40)}" /></label>
        </div>
        <div class="grid two">
          <label class="field"><span>Target session</span><input name="targetSession" value="${esc(p.targetSession || "")}" /></label>
          <label class="field"><span>Second session</span><input name="secondSession" value="${esc(p.secondSession || "")}" /></label>
        </div>
        <label class="field"><span>Preferred study window</span>
          <select name="preferredStudyWindow">${["Morning", "Afternoon", "Evening", "Late night"].map((s) => `<option${p.preferredStudyWindow === s ? " selected" : ""}>${s}</option>`).join("")}</select></label>
        <div class="row"><button class="btn" type="submit">Save profile</button>
          <span class="tiny muted">Changing the stage does not change the priority hierarchy — that is deliberate.</span></div>
      </form>
    </div>

    <div class="card">
      <div class="card-head"><h3>Appearance and mobility</h3></div>
      <p class="small muted">Theme is stored with your profile.</p>
      <div class="row">
        <button class="btn ${state.settings.theme === "dark" ? "" : "ghost"}" id="darkBtn">Dark</button>
        <button class="btn ${state.settings.theme === "light" ? "" : "ghost"}" id="lightBtn">Light</button>
      </div>

      <h4 class="mini-head" style="margin-top:1rem">Your unlock path</h4>
      <div class="timeline">
        ${(D.profile?.unlockPath || []).map((u) => `<div class="timeline-item">
          <div class="t">${esc(u.stage)}</div><div class="m">${esc(u.evidence)}</div></div>`).join("")}
      </div>
    </div>
  </div>

  <div class="grid two" style="margin-top:1rem">
    <div class="card">
      <div class="card-head"><h3>Backup</h3><span class="spacer"></span><span class="chip">${num(storage, 1)} KB</span></div>
      <p class="small muted">The export contains your profile, chapter records, attempts, study log, mocks, reviews, notes, case work, portfolio and certification status.</p>
      <div class="row">
        <button class="btn" id="exportBtn">Export JSON</button>
        <button class="btn ghost" id="importBtn">Import backup</button>
        <input type="file" id="importFile" accept="application/json" hidden />
      </div>
      <p class="tiny muted">Importing replaces all current data. Export first if you are unsure.</p>
      <div class="row" style="margin-top:1rem">
        <button class="btn danger" id="resetBtn">Reset everything</button>
      </div>
      <p class="tiny muted">A reset clears this browser only. It cannot be undone without a backup.</p>
    </div>

    <div class="card">
      <div class="card-head"><h3>Dataset health</h3><span class="spacer"></span>
        <span class="chip ${missing.length || errors.length ? "rose" : "green"}">${missing.length || errors.length ? "issues" : "all loaded"}</span></div>
      ${table(
        [
          { key: "label", label: "Dataset" },
          { key: "path", label: "File", render: (v) => `<code class="tiny">${esc(v)}</code>` },
          { key: "state", label: "State", render: (v) => `<span class="chip ${v === "loaded" ? "green" : "rose"}">${esc(v)}</span>` },
        ],
        datasets.map((d) => ({ ...d, state: D.loadedIds.includes(d.id) ? "loaded" : "missing" }))
      )}
      ${errors.length ? callout(`<strong>Load errors.</strong><br>${errors.map((e) => esc(e)).join("<br>")}`, "danger") : ""}
      <p class="tiny muted">Manifest v${esc(D.manifest?.version || "")} · ${datasets.length} datasets · updated ${esc(D.manifest?.lastUpdated || "")}.</p>
    </div>
  </div>

  <div class="card" style="margin-top:1rem">
    <div class="card-head"><h3>Boundaries and limitations</h3></div>
    <ul class="tight-list">
      <li><strong>Educational use only.</strong> Nothing here is investment, tax, legal or audit advice.</li>
      <li><strong>No employment promise.</strong> Certifications and projects are evidence of study, not a qualification for a role.</li>
      <li><strong>Predictions are predictions.</strong> Exam themes are labelled estimates and never substitute for full-syllabus preparation.</li>
      <li><strong>Law changes.</strong> Tax and company-law content states the position as at the review date and flags amendment areas — verify the current figure before relying on it.</li>
      <li><strong>Chapter marks are indicative.</strong> Derived from published section weights, not from ICMAI chapter-level guidance.</li>
      <li><strong>Synthetic data.</strong> Case companies and datasets are invented. Do not use employer or client data in the portfolio.</li>
      <li><strong>No ICMAI question papers are reproduced.</strong> Practice questions are written for this system.</li>
      <li><strong>Local storage only.</strong> Clearing site data deletes your progress; export a backup regularly.</li>
    </ul>
    ${callout(`<strong>Privacy.</strong> ${esc(D.profile?.privacy?.network || "")} ${esc(D.profile?.privacy?.storage || "")}`, "")}
    <p class="tiny muted">PROJECT CMA v${esc(D.manifest?.version || "2.0.0")} · syllabus data reviewed ${esc(D.papersDoc?.meta?.lastVerified || "")} · built as a static application with no build step.</p>
  </div>`;
}

export function mount() {
  document.getElementById("profileForm").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    store.setProfile(Object.fromEntries(fd.entries()));
    toast("Profile saved");
    refresh();
  };
  document.getElementById("darkBtn").onclick = () => {
    document.documentElement.dataset.theme = "dark";
    store.setTheme("dark");
  };
  document.getElementById("lightBtn").onclick = () => {
    document.documentElement.dataset.theme = "light";
    store.setTheme("light");
  };

  document.getElementById("exportBtn").onclick = () => {
    const blob = new Blob([store.exportData()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `project-cma-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Backup downloaded");
  };

  const fileInput = document.getElementById("importFile");
  document.getElementById("importBtn").onclick = () => fileInput.click();
  fileInput.onchange = async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      if (!confirmAction("Importing replaces all current local data. Continue?")) return;
      store.importData(text);
      toast("Backup imported");
      refresh();
    } catch (err) {
      toast(`Import failed: ${err.message}`);
    }
  };

  document.getElementById("resetBtn").onclick = () => {
    if (!confirmAction("Delete every local record — log, attempts, notes, portfolio, reviews? This cannot be undone.")) return;
    store.resetAll();
    toast("All local data cleared");
    refresh();
  };
}
