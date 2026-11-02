/* Performance and discipline — measures learning, not activity. */

import { D, learningScore, dailySeries, rollingAccuracy, mockAverage, studyHours, streak, lastNDays, weakChapters, paperStats } from "../data.js";
import * as store from "../store.js";
import { esc, num, pct, dateFmt, todayISO, daysBetween, stat, progress, table, callout, accordion, empty, lineChart, bars, toast, confirmAction, refresh } from "../ui.js";

const G1 = ["p05", "p06", "p07", "p08"];

export function render() {
  const state = store.get();
  const perf = D.performance || {};
  const score = learningScore(state);
  const acc = rollingAccuracy(state, 7);
  const mock = mockAverage(state, 3);
  const series = dailySeries(state, 28);
  const hours7 = studyHours(state, { from: lastNDays(7)[0] });
  const target = perf.dailyLog?.targets || {};
  const questions = perf.weeklyReview?.questions || [];

  const components = [
    ["Study hours", score.components.studyHoursScore, 10],
    ["Accuracy", score.components.accuracyScore, 25],
    ["Mocks", score.components.mockScore, 25],
    ["Revision consistency", score.components.revisionScore, 15],
    ["Weakness improvement", score.components.weaknessScore, 15],
    ["Artefacts", score.components.artefactScore, 10],
  ];

  const logRows = [...(state.log || [])].reverse().slice(0, 14);

  return `
  <div class="card">
    <div class="card-head">
      <div><h2 style="margin:0">Performance and discipline</h2>
        <p class="card-sub">${esc(perf.meta?.purpose || "Track what you can evidence.")} The score deliberately under-weights hours.</p></div>
      <span class="spacer"></span>
      <div class="score-ring" style="--v:${score.score}"><b>${score.score}</b><span>${esc(score.band)}</span></div>
    </div>
    <div class="grid four" style="margin-top:.6rem">
      ${stat("Hours, 7 days", num(hours7, 1), `target ${num((target.studyHours || 3.5) * 7, 0)} h`)}
      ${stat("Accuracy, 7 days", acc.accuracy === null ? "—" : pct(acc.accuracy), `${acc.attempts} attempts`)}
      ${stat("Mock average", mock.average === null ? "—" : pct(mock.average), mock.count ? `last ${mock.count}` : "no mocks")}
      ${stat("Streak", `${streak(state)} d`, "consecutive days with study hours")}
    </div>
  </div>

  <div class="grid two" style="margin-top:1rem">
    <div class="card">
      <div class="card-head"><h3>Learning score components</h3></div>
      ${components.map(([label, value, weight]) => `<div class="bar-row">
        <div class="lbl">${esc(label)} <span class="faint">${weight}%</span></div>
        <div class="track"><i style="width:${Math.max(0, Math.min(100, value))}%"></i></div>
        <div class="num">${Math.round(value)}</div></div>`).join("")}
      <p class="tiny muted" style="margin-bottom:0">${esc(perf.learningScore?.formula || "")}</p>
    </div>
    <div class="card">
      <div class="card-head"><h3>Hours and questions</h3></div>
      ${lineChart(
        [
          { name: "Hours", points: series.map((d) => d.hours) },
          { name: "Questions", points: series.map((d) => d.questions) },
        ],
        { labels: series.map((d, i) => (i % 7 === 0 ? d.date.slice(5) : "")), height: 170, aria: "Hours and questions over 28 days" }
      )}
      <div class="row tiny muted" style="gap:1rem;margin-top:.3rem">
        <span><i style="display:inline-block;width:9px;height:9px;background:var(--accent);border-radius:2px"></i> Hours</span>
        <span><i style="display:inline-block;width:9px;height:9px;background:var(--blue);border-radius:2px"></i> Questions</span>
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:1rem">
    <div class="card-head"><h3>Daily study log</h3><span class="spacer"></span>
      <button class="btn small" id="addLogBtn">Add entry</button></div>
    ${logRows.length
      ? table(
          [
            { key: "date", label: "Date", render: (v) => dateFmt(v) },
            { key: "paperId", label: "Paper", render: (v) => esc(D.papersById[v]?.short || v || "—") },
            { key: "studyHours", label: "Hours", num: true, render: (v) => num(v, 1) },
            { key: "questionsAttempted", label: "Qs", num: true },
            { key: "questionsCorrect", label: "Correct", num: true },
            { key: "revisionMinutes", label: "Revision", num: true, render: (v) => `${num(v || 0)} m` },
            { key: "topics", label: "Focus", render: (v) => `<span class="small muted">${esc(v || "")}</span>` },
            { key: "id", label: "", render: (v) => `<button class="btn small ghost" data-del="${esc(v)}">✕</button>` },
          ],
          logRows
        )
      : empty("No entries yet", "Use “Add entry” or the ＋ Log button in the top bar. Log active work only.")}
    <p class="tiny muted" style="margin-bottom:0">Hours are capped at ${target.studyHours || 3.5} h/day of credit in the score. Over-logging does not buy points.</p>
  </div>

  <div class="card" style="margin-top:1rem">
    <div class="card-head"><h3>Mock exams</h3><span class="spacer"></span>
      <button class="btn small" id="addMockBtn">Record a mock</button></div>
    ${(state.mocks || []).length
      ? table(
          [
            { key: "date", label: "Date", render: (v) => dateFmt(v) },
            { key: "paperId", label: "Paper", render: (v) => esc(D.papersById[v]?.short || v) },
            { key: "score", label: "Score", num: true },
            { key: "max", label: "Out of", num: true },
            { key: "pct", label: "%", num: true, render: (v) => `<b>${pct(v)}</b>` },
            { key: "notes", label: "What went wrong", render: (v) => `<span class="tiny muted">${esc(v || "—")}</span>` },
            { key: "id", label: "", render: (v) => `<button class="btn small ghost" data-delmock="${esc(v)}">✕</button>` },
          ],
          [...state.mocks].reverse().map((m) => ({ ...m, pct: (Number(m.score) / Number(m.max || 100)) * 100 }))
        )
      : empty("No mocks recorded", "A mock is the only honest readiness signal you have. Schedule one.")}
    ${mock.average !== null && mock.average < 60 ? callout("<strong>Below the 60% gate.</strong> Per the priority plan, suspend professional-development hours and rebuild the two weakest papers until the average recovers.", "warn") : ""}
  </div>

  <div class="card" style="margin-top:1rem">
    <div class="card-head"><div><h3>The weekly review — six questions</h3>
      <p class="card-sub">${esc(perf.weeklyReview?.when || "Every Sunday.")} Answer with evidence, not intentions.</p></div></div>
    <form id="reviewForm" class="stack">
      <label class="field" style="max-width:240px"><span>Week ending</span>
        <input type="date" name="weekEnding" value="${todayISO()}" required /></label>
      ${questions
        .map(
          (q) => `<label class="field"><span>${q.no}. ${esc(q.question)}${q.required ? " *" : ""}</span>
            <span class="hint">${esc(q.guidance || "")}</span>
            <textarea name="${esc(q.id)}" rows="2" ${q.required ? "required" : ""}></textarea></label>`
        )
        .join("")}
      <div class="row"><button class="btn" type="submit">Save review</button>
        <span class="tiny muted">Saved reviews appear below and feed the next week's priorities.</span></div>
    </form>
  </div>

  ${(state.reviews || []).length
    ? `<div class="card" style="margin-top:1rem"><div class="card-head"><h3>Review history</h3>
        <span class="spacer"></span><span class="chip">${state.reviews.length}</span></div>
        ${[...state.reviews]
          .reverse()
          .map((r) =>
            accordion(
              `Week ending ${dateFmt(r.weekEnding)}`,
              `<dl class="kv">${questions.map((q) => `<dt>${esc(q.question)}</dt><dd>${esc(r.answers?.[q.id] || "—")}</dd>`).join("")}</dl>`,
              false,
              r.score ? `${r.score}/100` : ""
            )
          )
          .join("")}</div>`
    : ""}

  <div class="grid two" style="margin-top:1rem">
    <div class="card">
      <div class="card-head"><h3>Metric definitions</h3></div>
      ${(perf.metrics || []).map((m) => `<div style="padding:.4rem 0;border-bottom:1px solid var(--line-soft)">
        <div class="row" style="justify-content:space-between"><strong class="small">${esc(m.name)}</strong><span class="chip">${m.weight}%</span></div>
        <p class="tiny muted" style="margin:.15rem 0 0">${esc(m.definition)} ${esc(m.note || "")}</p></div>`).join("")}
    </div>
    <div class="card">
      <div class="card-head"><h3>Guardrails</h3></div>
      <ul class="tight-list">${(perf.guardrails || []).map((g) => `<li>${esc(typeof g === "string" ? g : g.rule || JSON.stringify(g))}</li>`).join("")}</ul>
      <p class="tiny muted">${esc(perf.monthlyReview?.purpose || perf.monthlyReview?.note || "")}</p>
    </div>
  </div>

  <div class="card" style="margin-top:1rem">
    <div class="card-head"><h3>Paper-level view</h3></div>
    <div class="grid four">
      ${G1.map((id) => {
        const p = D.papersById[id];
        const s = paperStats(store.get(), id);
        return `<div class="stat"><div class="label">${esc(p.short)}</div>
          <div class="value" style="font-size:1.15rem;line-height:1.25">${esc(p.name)}</div>
          ${progress(s.progress)}
          <div class="tiny muted" style="margin-top:.3rem">${s.progress}% covered · ${s.accuracy === null ? "no attempts" : `${s.accuracy}% acc`}</div></div>`;
      }).join("")}
    </div>
  </div>`;
}

export function mount() {
  const state = store.get();
  document.getElementById("addLogBtn").onclick = () => document.getElementById("quickAdd").click();

  document.querySelectorAll("[data-del]").forEach((b) => {
    b.onclick = () => {
      if (confirmAction("Delete this study entry?")) {
        store.removeLog(b.dataset.del);
        refresh();
      }
    };
  });
  document.querySelectorAll("[data-delmock]").forEach((b) => {
    b.onclick = () => {
      if (confirmAction("Delete this mock record?")) {
        store.removeMock(b.dataset.delmock);
        refresh();
      }
    };
  });

  document.getElementById("addMockBtn").onclick = () => {
    const host = document.getElementById("main");
    host.insertAdjacentHTML(
      "afterbegin",
      `<div class="card" id="mockFormCard" style="margin-bottom:1rem">
        <div class="card-head"><h3>Record a mock</h3></div>
        <form id="mockForm" class="stack">
          <div class="grid three">
            <label class="field"><span>Date</span><input type="date" name="date" value="${todayISO()}" required /></label>
            <label class="field"><span>Paper</span><select name="paperId">
              ${D.papers.filter((p) => p.status === "active").map((p) => `<option value="${p.id}">${p.code} — ${esc(p.name)}</option>`).join("")}
            </select></label>
            <label class="field"><span>Mode</span><select name="mode">
              <option>Full length · 3 hours</option><option>Half length · 90 minutes</option><option>Sectional</option></select></label>
          </div>
          <div class="grid two">
            <label class="field"><span>Marks scored</span><input type="number" name="score" min="0" required /></label>
            <label class="field"><span>Out of</span><input type="number" name="max" value="100" min="1" required /></label>
          </div>
          <label class="field"><span>What went wrong</span><textarea name="notes" rows="2" placeholder="Be specific: which questions, which error type."></textarea></label>
          <div class="row"><button class="btn" type="submit">Save mock</button>
            <button class="btn ghost" type="button" id="cancelMock">Cancel</button></div>
        </form></div>`
    );
    const card = document.getElementById("mockFormCard");
    card.scrollIntoView({ behavior: "smooth" });
    card.querySelector("#cancelMock").onclick = () => card.remove();
    card.querySelector("#mockForm").onsubmit = (e) => {
      e.preventDefault();
      const entry = Object.fromEntries(new FormData(e.target).entries());
      entry.score = Number(entry.score);
      entry.max = Number(entry.max);
      store.addMock(entry);
      toast("Mock recorded");
      card.remove();
      refresh();
    };
  };

  document.getElementById("reviewForm").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const weekEnding = fd.get("weekEnding");
    const answers = {};
    (D.performance?.weeklyReview?.questions || []).forEach((q) => (answers[q.id] = fd.get(q.id)));
    store.addReview({ weekEnding, answers, score: learningScore(store.get()).score });
    toast("Review saved");
    refresh();
  };
}
