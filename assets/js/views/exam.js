/* Advanced examination intelligence — confirmed information separated from prediction. */

import { D, paperChapters, chapterMarks, chapterStats, weakChapters, mockAverage } from "../data.js";
import * as store from "../store.js";
import { esc, num, pct, dateFmt, table, callout, empty, heatmap, bars, badge, stat } from "../ui.js";

const G1 = ["p05", "p06", "p07", "p08"];

export function render({ query }) {
  const e = D.examIntel || {};
  const state = store.get();
  const paper = query.paper || "p05";
  const p = D.papersById[paper];
  const bp = (e.paperBlueprints || []).find((b) => b.paperId === paper) || {};
  const chapters = paperChapters(paper);
  const integrity = e.meta?.integrity || {};
  const themes = (e.recurringThemes?.themes || []).filter((t) => !paper || t.paperId === paper);
  const preds = (e.predictions || []).filter((x) => !paper || x.paperId === paper);
  const schedule = e.examCalendar?.intermediateSchedule || [];
  const weak = weakChapters(state, 6);

  const markCells = chapters.map((c) => ({
    label: c.title,
    short: String(c.no),
    value: chapterMarks(c),
    display: `${num(chapterMarks(c), 1)} marks`,
  }));
  const attemptCells = chapters.map((c) => {
    const s = chapterStats(state, c.id);
    return { label: c.title, short: `${c.no}${s.attempts ? `·${s.attempts}` : ""}`, value: s.attempts, display: `${s.attempts} attempts` };
  });

  return `
  <div class="card">
    <div class="card-head"><div><h2 style="margin:0">Examination intelligence</h2>
      <p class="card-sub">${esc(e.meta?.purpose || "")}</p></div>
      <span class="spacer"></span><span class="chip amber">last verified ${esc(e.meta?.lastReviewed || "")}</span></div>
    <div class="grid four" style="margin-top:.7rem">
      ${stat("Confirmed", "Calendar + weights", "with source and verification date")}
      ${stat("Derived", "Chapter marks", "arithmetic from published weights")}
      ${stat("Predicted", "Themes", "labelled, never mixed with facts")}
      ${stat("Your evidence", `${Object.keys(state.chapters || {}).length} chapters`, `${state.attempts?.length || 0} logged attempts`)}
    </div>
    ${callout(`<strong>${esc(integrity.headline || "Keep facts and predictions separate.")}</strong>
      <ul class="tight-list" style="margin:.4rem 0 0">
        <li><b>Confirmed.</b> ${esc(integrity.confirmed || "")}</li>
        <li><b>Derived.</b> ${esc(integrity.derived || "")}</li>
        <li><b>Prediction.</b> ${esc(integrity.prediction || "")}</li>
        <li><b>Copyright.</b> ${esc(integrity.copyright || "")}</li>
      </ul>`, "warn")}
  </div>

  <div class="grid two" style="margin-top:1rem">
    <div class="card">
      <div class="card-head"><h3>December 2026 calendar</h3><span class="spacer"></span>
        <span class="chip ${e.examCalendar?.status?.startsWith("confirmed") ? "green" : "amber"}">${esc((e.examCalendar?.status || "").split("—")[0])}</span></div>
      ${table(
        [
          { key: "date", label: "Date", render: (v) => dateFmt(v, { day: "2-digit", month: "short", weekday: "short" }) },
          { key: "time", label: "Time" },
          { key: "paper", label: "Paper", render: (v, r) => `<a href="#/paper/${r.paperId}">${esc(v)}</a>` },
        ],
        schedule
      )}
      <p class="tiny muted" style="margin-top:.4rem">Source: ${esc(e.examCalendar?.source || "ICMASI")} · verified ${esc(e.examCalendar?.verifiedOn || "")}.
        Always re-check the official timetable before booking travel or leave.</p>
    </div>

    <div class="card">
      <div class="card-head"><h3>Paper blueprint</h3><span class="spacer"></span>
        <select id="examPaper" style="font-size:.78rem;background:var(--panel-2);color:var(--text);border:1px solid var(--line);border-radius:6px;padding:.3rem">
          ${D.papers.filter((x) => x.status === "active").map((x) => `<option value="${x.id}"${x.id === paper ? " selected" : ""}>Paper ${x.code} — ${esc(x.name)}</option>`).join("")}
        </select></div>
      <p class="small"><b>${esc(p?.name || "")}</b> · ${esc(bp.duration || "3 hours")}</p>
      <p class="small">${esc(bp.strategy || "")}</p>
      <p class="tiny muted">${esc(bp.writingTime || "")}</p>
      <p class="tiny" style="color:var(--amber)">${esc(bp.structureNote || "")}</p>
      ${(p?.sections || []).length ? bars(p.sections.map((s) => ({ label: `${s.id} — ${s.name}`, value: s.weight, display: `${s.weight}%` }))) : ""}
    </div>
  </div>

  <div class="card" style="margin-top:1rem">
    <div class="card-head"><h3>Chapter heatmap — ${esc(p?.short || "")}</h3><span class="spacer"></span>
      <span class="tiny muted">left: indicative marks · right: your attempts</span></div>
    <div class="grid two">
      <div><h4 class="mini-head">Indicative marks by chapter</h4>${markCells.length ? heatmap(markCells, { cols: 4 }) : empty("No chapters", "")}
        <p class="tiny muted" style="margin-top:.4rem">Derived from published section weights, split evenly within a section. Not a prediction of any paper.</p></div>
      <div><h4 class="mini-head">Your logged attempts</h4>${attemptCells.length ? heatmap(attemptCells, { cols: 4 }) : empty("No chapters", "")}
        <p class="tiny muted" style="margin-top:.4rem">Blank cells mean no evidence — not strength. Attempt at least three questions before judging a chapter.</p></div>
    </div>
  </div>

  <div class="grid two" style="margin-top:1rem">
    <div class="card">
      <div class="card-head"><h3>Weakness diagnosis</h3><span class="spacer"></span><span class="chip">threshold 60%</span></div>
      ${weak.length
        ? table(
            [
              { key: "title", label: "Chapter", render: (v, r) => `<a href="#/chapter/${r.id}">${esc(v)}</a>` },
              { key: "paper", label: "Paper", render: (v) => esc(v.short) },
              { key: "accuracy", label: "Accuracy", num: true, render: (v) => `<b style="color:var(--rose)">${pct(v)}</b>` },
              { key: "attempts", label: "n", num: true },
              { key: "marks", label: "Marks at stake", num: true, render: (v) => num(v, 1) },
            ],
            weak
          )
        : empty("Insufficient evidence", "A chapter is only diagnosed as weak with at least three logged attempts. Fewer is “unknown”, not “fine”.")}
      <p class="tiny muted">${esc(e.analyticsSpec?.weaknessAnalysis || "")}</p>
    </div>

    <div class="card">
      <div class="card-head"><h3>Revision priority</h3></div>
      ${(() => {
        const rows = D.chapters
          .filter((c) => G1.includes(c.paperId))
          .map((c) => {
            const s = chapterStats(state, c.id);
            const acc = s.accuracy === null ? 0.5 : s.accuracy / 100;
            const marks = chapterMarks(c);
            const priority = marks * (1 - acc) * (s.lastStudied ? 1 : 1.15);
            return { ...c, marks, priority, acc: s.accuracy, attempts: s.attempts };
          })
          .sort((a, b) => b.priority - a.priority)
          .slice(0, 8);
        return table(
          [
            { key: "title", label: "Chapter", render: (v, r) => `<a href="#/chapter/${r.id}">${esc(v)}</a>` },
            { key: "paper", label: "Paper", render: (v) => esc(v.short) },
            { key: "marks", label: "Marks", num: true, render: (v) => num(v, 1) },
            { key: "acc", label: "Acc", num: true, render: (v) => (v === null ? `<span class="faint">unknown</span>` : pct(v)) },
            { key: "priority", label: "Index", num: true, render: (v) => num(v, 1) },
          ],
          rows
        );
      })()}
      <p class="tiny muted">${esc(e.analyticsSpec?.revisionPriority || "")}</p>
    </div>
  </div>

  <div class="card" style="margin-top:1rem">
    <div class="card-head"><h3>Recurring themes</h3><span class="spacer"></span><span class="chip amber">professional estimate</span></div>
    ${callout(esc(e.recurringThemes?.disclaimer || ""), "warn")}
    ${table(
      [
        { key: "theme", label: "Theme" },
        { key: "likelihood", label: "Likelihood", render: (v) => `<span class="chip ${v === "high" ? "rose" : v === "medium" ? "amber" : ""}">${esc(v)}</span>` },
        { key: "why", label: "Reasoning" },
      ],
      themes,
      { empty: "No themes recorded for this paper." }
    )}
  </div>

  <div class="card" style="margin-top:1rem;border-color:color-mix(in srgb, var(--rose) 35%, var(--line))">
    <div class="card-head"><h3>Predictions — separate by design</h3><span class="spacer"></span>
      <span class="chip rose">not confirmed information</span></div>
    ${table(
      [
        { key: "statement", label: "Statement" },
        { key: "confidence", label: "Confidence", render: (v) => `<span class="chip">${esc(v)}</span>` },
        { key: "basis", label: "Basis" },
      ],
      preds,
      { empty: "No predictions recorded for this paper — which is the honest position." }
    )}
    <p class="tiny muted">${esc(e.meta?.integrity?.prediction || "")} Do not let a prediction shrink your syllabus coverage.</p>
  </div>

  <div class="grid two" style="margin-top:1rem">
    <div class="card">
      <div class="card-head"><h3>Mock plan</h3></div>
      <div class="timeline">
        ${(e.mockPlan || []).map((m) => `<div class="timeline-item">
          <div class="t">${esc(m.stage)} — ${esc(m.scope)}</div>
          <div class="m">${esc(m.timing)} · ${esc(m.purpose)}</div>
          <div class="tiny muted">${esc(m.reviewRequirement || "")}</div></div>`).join("")}
      </div>
      <p class="tiny muted">Your current mock average: <b>${mockAverage(store.get(), 3).average === null ? "not established" : pct(mockAverage(store.get(), 3).average)}</b>.</p>
    </div>

    <div class="card">
      <div class="card-head"><h3>Question log — your last attempts</h3><span class="spacer"></span><span class="chip">${state.attempts?.length || 0}</span></div>
      ${(state.attempts || []).length
        ? table(
            [
              { key: "ts", label: "When", render: (v) => dateFmt(v, { day: "2-digit", month: "short" }) },
              { key: "chapterId", label: "Chapter", render: (v) => esc(D.chapterById[v]?.title || v) },
              { key: "qid", label: "Question", render: (v) => `<span class="tiny">${esc(v)}</span>` },
              { key: "correct", label: "Result", render: (v) => `<span class="chip ${v ? "green" : "rose"}">${v ? "correct" : "wrong"}</span>` },
            ],
            [...state.attempts].reverse().slice(0, 10)
          )
        : empty("No attempts logged", "Attempt questions in the practice engine; the log builds automatically.")}
      <p class="tiny muted">Error types to classify: ${(e.questionLog?.errorTypes || []).map((x) => esc(x)).join(" · ")}.</p>
    </div>
  </div>

  <div class="card" style="margin-top:1rem">
    <div class="card-head"><h3>Seeded question records</h3><span class="spacer"></span><span class="chip">illustrative</span></div>
    ${table(
      [
        { key: "paperId", label: "Paper", render: (v) => esc(D.papersById[v]?.short || v) },
        { key: "chapterId", label: "Chapter", render: (v) => esc(D.chapterById[v]?.title || v) },
        { key: "topic", label: "Topic" },
        { key: "marks", label: "Marks", num: true },
        { key: "difficulty", label: "Difficulty", render: (v) => `<span class="chip">${esc(v)}</span>` },
        { key: "errorType", label: "Typical error", render: (v) => esc(v || "—") },
      ],
      e.questionLog?.seededExamples || []
    )}
  </div>`;
}

export function mount() {
  const sel = document.getElementById("examPaper");
  if (sel)
    sel.onchange = () => {
      location.hash = `#/exam?paper=${sel.value}`;
    };
}
