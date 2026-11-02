/* Dashboard — the single screen that answers "what should I do next?" */

import { D, overallProgress, paperProgress, paperStats, learningScore, streak, dailySeries, rollingAccuracy, mockAverage, weakChapters, revisionDue, studyHours, searchAll, lastNDays, paperChapters } from "../data.js";
import * as store from "../store.js";
import { esc, num, pct, dateFmt, todayISO, daysBetween, stat, progress, bars, table, callout, lineChart, badge, empty } from "../ui.js";

const G1 = ["p05", "p06", "p07", "p08"];

function targetDate() {
  return D.priority?.priorities?.find((p) => p.rank === 1)?.target || "2026-12-10";
}

function focusItems(state) {
  const items = [];
  const due = revisionDue(state, 3);
  due.forEach((c) =>
    items.push({
      kind: "Revision",
      title: c.title,
      sub: `${c.paper.short} · last studied ${c.daysSince ?? "never"}${c.daysSince ? " days ago" : ""}`,
      href: `#/chapter/${c.id}`,
      why: "Spaced retrieval beats re-reading. Close the book and write the structure first.",
    })
  );
  const weak = weakChapters(state, 2);
  weak.forEach((c) =>
    items.push({
      kind: "Weak area",
      title: c.title,
      sub: `${c.paper.short} · ${c.accuracy}% accuracy over ${c.attempts} attempts`,
      href: `#/practice?chapter=${c.id}`,
      why: "Below the 60% threshold. Drill this before it compounds.",
    })
  );
  if (!state.mocks?.length)
    items.push({
      kind: "Baseline",
      title: "Sit one half-length mock this week",
      sub: "No mock on record yet",
      href: "#/performance",
      why: "Without a baseline the learning score is measuring effort, not readiness.",
    });
  const lastReview = (state.reviews || []).at(-1);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  if (!lastReview || lastReview.weekEnding < weekAgo)
    items.push({
      kind: "Review",
      title: "Complete the six-question weekly review",
      sub: lastReview ? `Last review ${dateFmt(lastReview.weekEnding)}` : "No review saved yet",
      href: "#/performance",
      why: "Unreviewed weeks hide repeated mistakes.",
    });

  const untouched = D.chapters.filter((c) => G1.includes(c.paperId) && !store.getChapter(c.id).status.match(/studying|revising|confident/));
  if (untouched.length)
    items.push({
      kind: "Syllabus",
      title: `${untouched.length} Group I chapters not started`,
      sub: untouched.slice(0, 3).map((c) => c.title).join(" · "),
      href: "#/papers",
      why: "Coverage is the gate to revision. Pick the next chapter in paper order.",
    });
  return items.slice(0, 5);
}

export function render() {
  const state = store.get();
  const name = state.profile.name || "CMA student";
  const stage = state.profile.stage || "CMA Intermediate";
  const days = daysBetween(new Date(), targetDate());
  const score = learningScore(state);
  const prog = overallProgress(state);
  const acc = rollingAccuracy(state, 7);
  const mock = mockAverage(state, 3);
  const hours7 = studyHours(state, { from: lastNDays(7)[0] });
  const series = dailySeries(state, 28);
  const focus = focusItems(state);

  return `
  <section class="hero">
    <div class="row" style="justify-content:space-between;align-items:flex-start">
      <div>
        <div class="eyebrow">${esc(stage)} · ${esc(D.priority?.priorities?.[0]?.name || "Group I")}</div>
        <h1>${esc(name.split(" ")[0])}, ${days >= 0 ? `${days} days to Paper 5` : "exam window reached"}.</h1>
        <p class="lede">Everything in this system is subordinate to one gate: CMA Intermediate Group I in December 2026.
        Professional skills, cases and certificates sit beneath it by design.</p>
        <div class="row" style="margin-top:.9rem">
          <a class="btn" href="#/practice">Start a practice set</a>
          <a class="btn ghost" href="#/priority">See the priority plan</a>
          <button class="btn ghost" id="dashLog">Log study</button>
        </div>
      </div>
      <div class="score-ring" style="--v:${score.score}" title="Composite learning score">
        <b>${score.score}</b><span>learning</span>
      </div>
    </div>
    <div class="grid four" style="margin-top:1.2rem">
      ${stat("Group I coverage", pct(prog), `${G1.reduce((a, id) => a + paperStats(state, id).attempted, 0)} of ${G1.reduce((a, id) => a + paperChapters(id).length, 0)} chapters practised`)}
      ${stat("Hours, last 7 days", num(hours7, 1), `Target ${num((D.performance?.dailyLog?.targets?.studyHours || 3.5) * 7, 0)} h`)}
      ${stat("Accuracy, last 7 days", acc.accuracy === null ? "—" : pct(acc.accuracy), `${acc.attempts} attempts`)}
      ${stat("Mock average", mock.average === null ? "—" : pct(mock.average), mock.count ? `last ${mock.count} mocks` : "no mocks yet")}
    </div>
  </section>

  <div class="grid two" style="margin-top:1rem">
    <div class="card">
      <div class="card-head"><h3>Today's focus</h3><span class="chip accent">${focus.length} items</span></div>
      <div class="stack" style="gap:.55rem">
        ${focus.length ? focus.map((f) => `<a class="result" href="${f.href}" style="border:1px solid var(--line-soft)">
          <span class="chip">${esc(f.kind)}</span>
          <div><strong>${esc(f.title)}</strong><div class="tiny muted">${esc(f.sub)}</div>
          <div class="tiny" style="color:var(--faint);margin-top:.15rem">${esc(f.why)}</div></div></a>`).join("") : empty("Nothing queued", "Log some study so the engine has signal.")}
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Study hours, last 28 days</h3>
        <span class="spacer"></span><span class="chip ${streak(state) > 2 ? "green" : ""}">${streak(state)}-day streak</span></div>
      ${lineChart([{ name: "Hours", points: series.map((d) => d.hours) }], {
        labels: series.map((d, i) => (i % 7 === 0 ? d.date.slice(5) : "")),
        aria: "Daily study hours for the last 28 days",
        height: 170,
      })}
      <p class="tiny muted" style="margin:.4rem 0 0">Hours are the weakest-weighted metric on purpose. Volume without accuracy and mocks does not move the score.</p>
    </div>
  </div>

  <div class="card" style="margin-top:1rem">
    <div class="card-head"><h3>Intermediate Group I — paper health</h3><span class="spacer"></span>
      <a class="btn ghost small" href="#/papers">Open library</a></div>
    <div class="grid four">
      ${G1.map((id) => {
        const p = D.papersById[id];
        const s = paperStats(state, id);
        return `<a class="stat" href="#/paper/${id}" style="text-decoration:none;color:inherit">
          <div class="row" style="justify-content:space-between"><span class="chip">${esc(p.short)}</span><span class="tiny muted">${s.chapters} ch</span></div>
          <strong style="font-size:.92rem;line-height:1.3;display:block;margin:.35rem 0">${esc(p.name)}</strong>
          ${progress(s.progress)}
          <div class="row" style="justify-content:space-between;margin-top:.35rem">
            <span class="tiny muted">${s.progress}% covered</span>
            <span class="tiny muted">${s.accuracy === null ? "no attempts" : `${s.accuracy}% acc`}</span>
          </div>
        </a>`;
      }).join("")}
    </div>
    <p class="tiny muted" style="margin-bottom:0">Coverage weights chapters by indicative marks. "Covered" is self-reported status — accuracy comes from actual attempts.</p>
  </div>

  <div class="grid two" style="margin-top:1rem">
    <div class="card">
      <div class="card-head"><h3>Priority ladder</h3><span class="spacer"></span><span class="chip amber">governing</span></div>
      <ol class="ladder">
        ${(D.priority?.priorities || []).map((p) => `<li>
          <div class="row" style="justify-content:space-between"><strong>${esc(p.name)}</strong><span class="chip">R${p.rank}</span></div>
          <div class="tiny muted">${esc(p.target)} · ${p.weeklyHours} h/week · ${Math.round((p.allocationShare || 0) * 100)}% of time</div>
        </li>`).join("")}
      </ol>
      <p class="tiny muted" style="margin-bottom:0">${esc(D.priority?.meta?.governingRule || "")}</p>
    </div>

    <div class="card">
      <div class="card-head"><h3>Metric weights</h3><span class="spacer"></span><span class="chip">learning, not activity</span></div>
      ${(D.performance?.metrics || []).map((m) => `<div class="bar-row">
        <div class="lbl">${esc(m.name)}</div><div class="track"><i style="width:${m.weight * 2.5}%"></i></div>
        <div class="num">${m.weight}%</div></div>`).join("")}
      <p class="tiny muted" style="margin-bottom:0">Full definitions and the weekly review live in <a href="#/performance">Performance</a>.</p>
    </div>
  </div>

  <div class="card" style="margin-top:1rem">
    <div class="card-head"><h3>What this system is</h3></div>
    <p class="small muted" style="margin-top:0">One integrated platform across six layers: the ICMAI Syllabus 2022 knowledge base, a practice and revision engine,
    professional academies (accounting, FP&amp;A, markets, data and AI, communication), a case laboratory, a portfolio builder and a performance tracker.
    Your profile, attempt history, notes, reviews and artefact status are shared across every module.</p>
    ${callout(`<strong>Boundaries.</strong> Educational use only — nothing here is investment, tax or legal advice, and no certification or module promises employment.
      Exam analytics separate confirmed information from prediction. Verify every fee, date and legal figure on the official source before relying on it.`, "warn")}
  </div>`;
}

export function mount() {
  document.getElementById("dashLog")?.addEventListener("click", () => document.getElementById("quickAdd")?.click());
}

/* ---------------- global search results ---------------- */

export function renderSearch({ query }) {
  const q = query.q || "";
  const res = searchAll(q, 60);
  return `<div class="card">
    <div class="card-head"><h2>Search</h2><span class="spacer"></span><span class="chip">${res.length} results</span></div>
    <form class="row" id="pageSearch" style="margin-bottom:.9rem">
      <input name="q" value="${esc(q)}" placeholder="Search chapters, formulas, concepts, skills…" style="flex:1" />
      <button class="btn small">Search</button>
    </form>
    ${res.length ? res.map((r) => `<a class="result" href="${r.href}"><span class="chip">${esc(r.type)}</span>
      <div><strong>${esc(r.title)}</strong><div class="tiny muted">${esc(r.sub || "")}</div></div></a>`).join("")
      : empty("No matches", "Try a concept such as “break-even”, a section such as “GST”, or a skill such as “Power Query”.")}
  </div>`;
}

export function mountSearch() {
  document.getElementById("pageSearch").onsubmit = (e) => {
    e.preventDefault();
    const q = new FormData(e.target).get("q").trim();
    location.hash = `#/search?q=${encodeURIComponent(q)}`;
  };
}
