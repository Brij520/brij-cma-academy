/* Academic knowledge system — papers, chapters, subjects, concept graph. */

import { D, sectionWeight, chapterMarks, paperChapters, contentFor, contentDepth, paperProgress, paperStats, chapterStats, questionsForChapter, questionsForPaper } from "../data.js";
import * as store from "../store.js";
import { esc, num, pct, dateFmt, badge, progress, stat, table, callout, accordion, empty, bars, toast, refresh } from "../ui.js";

const LEVELS = [
  { id: "all", name: "All" },
  { id: "foundation", name: "Foundation" },
  { id: "intermediate", name: "Intermediate" },
  { id: "final", name: "Final" },
];

const STATUSES = ["not-started", "studying", "revising", "confident"];

/* ---------------- papers index ---------------- */

export function renderPapers({ query }) {
  const state = store.get();
  const level = query.level || "intermediate";
  const papers = D.papers.filter((p) => (level === "all" ? true : p.level === level));
  const active = D.papers.filter((p) => p.status === "active");
  const totalCh = active.reduce((a, p) => a + p.chapters.length, 0);
  const covered = active.reduce(
    (a, p) => a + p.chapters.filter((c) => (state.chapters?.[c.id]?.status || "not-started") !== "not-started").length,
    0
  );

  return `
  <div class="card">
    <div class="card-head">
      <div><h2 style="margin:0">Academic library</h2>
      <p class="card-sub">ICMAI Syllabus 2022 · 20 papers · ${D.chapters.length} chapters mapped · ${D.questions.length} seeded questions with worked answers</p></div>
      <span class="spacer"></span>
      <span class="chip accent">${covered}/${totalCh} active chapters touched</span>
    </div>
    <div class="tabs">
      ${LEVELS.map((l) => `<a class="tab${level === l.id ? " active" : ""}" href="#/papers?level=${l.id}">${esc(l.name)}</a>`).join("")}
      <a class="tab" href="#/subjects">Subject index</a>
      <a class="tab" href="#/concepts">Concept map</a>
      <a class="tab" href="#/formulas">Formulas</a>
    </div>
  </div>

  ${callout(`<strong>How to read coverage.</strong> A chapter's indicative marks come from splitting its syllabus section weight across that section's chapters — it is an allocation aid, not an ICMAI prediction. Paper-level marks and structure are confirmed; per-chapter splits are an estimate.`, "")}

  <div class="grid two" style="margin-top:1rem">
    ${papers
      .map((p) => {
        const s = paperStats(state, p.id);
        const marks = paperChapters(p.id).reduce((a, c) => a + chapterMarks(c), 0);
        return `<div class="card">
          <div class="card-head">
            <div>
              <div class="row" style="gap:.4rem">
                <span class="chip accent">Paper ${p.code}</span>
                <span class="chip">${esc(p.group || p.level)}</span>
                ${p.status === "active" ? `<span class="chip green">active target</span>` : ""}
              </div>
              <h3 style="margin:.45rem 0 .2rem">${esc(p.name)}</h3>
              <p class="card-sub">${esc(p.summary || "")}</p>
            </div>
          </div>
          <div class="row tiny muted" style="gap:.8rem;margin-bottom:.5rem">
            <span>${p.chapters.length} chapters</span><span>${num(marks, 0)} indicative marks mapped</span>
            <span>Target ${esc(p.target || "—")}</span>
          </div>
          ${progress(s.progress)}
          <div class="row" style="justify-content:space-between;margin-top:.45rem">
            <span class="tiny muted">${s.progress}% covered · ${s.attempted} chapters practised</span>
            <span class="row">
              ${s.accuracy === null ? `<span class="tiny faint">no data</span>` : `<span class="tiny">${s.accuracy}% accuracy</span>`}
              <a class="btn small ghost" href="#/paper/${p.id}">Open</a>
            </span>
          </div>
        </div>`;
      })
      .join("")}
  </div>`;
}

export function mountPapers() {}

/* ---------------- paper detail ---------------- */

export function renderPaper({ params }) {
  const id = params[0];
  const p = D.papersById[id];
  if (!p) return empty("Paper not found", "Check the academic library.");
  const state = store.get();
  const s = paperStats(state, id);
  const qs = questionsForPaper(id);

  const chaptersBySection = (p.sections || []).map((sec) => ({
    sec,
    chapters: paperChapters(id).filter((c) => c.section === sec.id),
  }));

  return `
  <div class="row tiny muted" style="margin-bottom:.6rem"><a href="#/papers">Academic library</a> / Paper ${p.code}</div>
  <div class="card">
    <div class="card-head">
      <div>
        <div class="row" style="gap:.4rem">
          <span class="chip accent">Paper ${p.code}</span><span class="chip">${esc(p.level)}</span>
          <span class="chip">${esc(p.group || "")}</span>${p.target ? `<span class="chip amber">Target ${esc(p.target)}</span>` : ""}
        </div>
        <h2 style="margin:.5rem 0 .2rem">${esc(p.name)}</h2>
        <p class="card-sub">${esc(p.summary || "")}</p>
      </div>
      <span class="spacer"></span>
      <a class="btn small" href="#/practice?paper=${p.id}">Practise this paper</a>
    </div>
    <div class="grid four" style="margin-top:.9rem">
      ${stat("Coverage", pct(s.progress), `${s.attempted}/${s.chapters} chapters practised`)}
      ${stat("Questions seeded", num(qs.length), `${num(qs.reduce((a, q) => a + (q.marks || 0), 0))} marks of practice`)}
      ${stat("Accuracy", s.accuracy === null ? "—" : pct(s.accuracy), `${s.attempts} attempts recorded`)}
      ${stat("Sections", String((p.sections || []).length), (p.sections || []).map((x) => `${x.id}:${x.weight}`).join(" · "))}
    </div>
  </div>

  ${(p.sections || [])
    .map(
      (sec) => `<div class="card" style="margin-top:1rem">
      <div class="card-head"><h3>Section ${esc(sec.id)} — ${esc(sec.name)}</h3><span class="spacer"></span>
        <span class="chip">${sec.weight} marks</span></div>
      ${table(
        [
          { key: "no", label: "#", num: true },
          { key: "title", label: "Chapter", render: (v, r) => `<a href="#/chapter/${r.id}">${esc(v)}</a>` },
          { key: "marks", label: "Indicative marks", num: true, render: (v) => num(v, 1) },
          { key: "status", label: "Status", render: (v) => badge(v) },
          { key: "attempts", label: "Attempts", num: true },
          { key: "acc", label: "Accuracy", num: true, render: (v) => (v === null ? `<span class="faint">—</span>` : pct(v)) },
          { key: "content", label: "Content", render: (v) => `<span class="chip ${v === "full" ? "green" : v === "outline" ? "amber" : ""}">${esc(v)}</span>` },
          {
            key: "id",
            label: "",
            render: (v) => `<a class="btn small ghost" href="#/chapter/${v}">Study</a>`,
          },
        ],
        paperChapters(id).map((c) => {
          const st = chapterStats(state, c.id);
          return { ...c, marks: chapterMarks(c), status: st.status, attempts: st.attempts, acc: st.accuracy, content: contentDepth(c.id) };
        }),
        { empty: "No chapters mapped for this paper yet." }
      )}
    </div>`
    )
    .join("")}

  ${p.status !== "active" ? callout(`<strong>Not the current target.</strong> This paper belongs to a later window. Under the priority hierarchy it stays parked until Group I is cleared — reading it now is a distraction, not progress.`, "warn") : ""}
  <p class="tiny muted">Weighting basis: ${esc(D.papersDoc?.meta?.weightBasis || "ICMAI Syllabus 2022 paper structure")}. ${esc(D.papersDoc?.meta?.note || "")}</p>`;
}

export function mountPaper() {}

/* ---------------- chapter ---------------- */

export function renderChapter({ params, query }) {
  const id = params[0];
  const c = D.chapters.find((x) => x.id === id);
  if (!c) return empty("Chapter not found", "Return to the academic library.");
  const content = contentFor(id);
  const st = chapterStats(store.get(), id);
  const qs = questionsForChapter(id);
  const marks = chapterMarks(c);
  const tab = query.tab || "overview";

  const tabs = [
    ["overview", "Overview"],
    ["terms", `Definitions${content?.keyTerms?.length ? ` (${content.keyTerms.length})` : ""}`],
    ["formulas", `Formulas${content?.formulas?.length ? ` (${content.formulas.length})` : ""}`],
    ["examples", `Worked examples${content?.examples?.length ? ` (${content.examples.length})` : ""}`],
    ["questions", `Question bank${qs.length ? ` (${qs.length})` : ""}`],
    ["revision", "Revision notes"],
    ["map", "Concept links"],
  ];

  let body = "";
  if (tab === "overview") {
    body = `
      ${content?.summary ? `<p>${esc(content.summary)}</p>` : callout(`No authored summary for this chapter yet. The syllabus topics below come from the official curriculum mapping; authoring depth is being added paper by paper.`, "warn")}
      <div class="grid two" style="margin-top:.8rem">
        <div><h4 class="mini-head">Syllabus topics</h4>
          <ul class="tight-list">${(c.topics || []).map((t) => `<li>${esc(t)}</li>`).join("") || `<li class="faint">Not mapped</li>`}</ul></div>
        <div><h4 class="mini-head">What to be able to do</h4>
          <ul class="tight-list">
            <li>State the rule or formula from memory, then apply it to a worked figure.</li>
            <li>Answer a ${Math.round(marks)}-mark question in the paper's expected format.</li>
            <li>Identify the two most likely traps and the amendment position (where relevant).</li>
          </ul>
          ${st.attempts ? `<p class="tiny muted">Current accuracy on this chapter: <b>${pct(st.accuracy)}</b> from ${st.attempts} attempts.</p>` : `<p class="tiny muted">No attempts recorded for this chapter yet.</p>`}
        </div>
      </div>
      ${content?.pitfalls?.length ? `<h4 class="mini-head" style="margin-top:1rem">Common pitfalls</h4>
        <ul class="tight-list">${content.pitfalls.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
      ${content?.amendmentWatch?.length ? callout(`<strong>Amendment watch.</strong> ${content.amendmentWatch.map((a) => esc(a)).join(" ")}`, "warn") : ""}`;
  } else if (tab === "terms") {
    body = (content?.keyTerms || []).length
      ? table([{ key: "term", label: "Term" }, { key: "definition", label: "Definition" }], content.keyTerms)
      : empty("No definitions authored", "This chapter is mapped but its definition set has not been written yet.");
  } else if (tab === "formulas") {
    body = (content?.formulas || []).length
      ? content.formulas
          .map((f) => `<div class="formula"><div class="fx">${esc(f.name)} — ${esc(f.expression)}</div>
            ${f.note ? `<div class="fm">${esc(f.note)}</div>` : ""}
            ${f.example ? `<div class="fe">${esc(f.example)}</div>` : ""}</div>`)
          .join("")
      : empty("No formulas in this chapter", "Formulas for the paper live in the formula database.");
  } else if (tab === "examples") {
    body = (content?.examples || []).length
      ? content.examples
          .map((ex, i) =>
            accordion(ex.title || `Example ${i + 1}`, `<p class="small">${esc(ex.problem)}</p>
              <p class="small"><strong>Solution.</strong> ${esc(ex.solution)}</p>
              ${ex.lesson ? `<p class="tiny muted">${esc(ex.lesson)}</p>` : ""}`, i === 0)
          )
          .join("")
      : empty("No worked examples yet", "Use the question bank until examples are authored.");
  } else if (tab === "questions") {
    body = qs.length ? qs.map((q, i) => questionCard(q, i)).join("") : empty("No questions seeded", "This chapter is outline-only.");
  } else if (tab === "revision") {
    body = `
      ${(content?.revisionNotes || []).length ? `<ul class="tight-list">${content.revisionNotes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : `<p class="muted small">No revision notes authored yet. Write your own after the first pass — that is the point of the knowledge base.</p>`}
      ${callout(`<strong>Revision protocol.</strong> Close the chapter. Write the structure and three formulas from memory. Check. Then attempt two questions without the answer key. Anything you cannot retrieve goes into <a href="#/knowledge">Knowledge base → mistakes</a>.`, "")}`;
  } else if (tab === "map") {
    const linked = (content?.linkedConcepts || []).map((cid) => D.conceptById[cid]).filter(Boolean);
    body = linked.length
      ? `<div class="grid two">${linked
          .map(
            (cn) => `<div class="card tight"><div class="row" style="justify-content:space-between">
              <strong>${esc(cn.label)}</strong><span class="chip">L${cn.level}</span></div>
              <p class="tiny muted" style="margin:.3rem 0">Domain: ${esc(cn.domain)} · Papers ${cn.papers.map((x) => esc(x)).join(", ")}</p>
              <p class="tiny" style="margin:0">Builds on: ${(cn.before || []).map((b) => esc(D.conceptById[b]?.label || b)).join(", ") || "—"}<br>
              Leads to: ${(cn.after || []).map((b) => esc(D.conceptById[b]?.label || b)).join(", ") || "—"}</p></div>`
          )
          .join("")}</div>`
      : empty("No concept links", "This chapter has no concept tags in the graph yet.");
  }

  return `
  <div class="row tiny muted" style="margin-bottom:.6rem">
    <a href="#/papers">Library</a> / <a href="#/paper/${c.paperId}">${esc(c.paper.short)}</a> / Chapter ${c.no}
  </div>
  <div class="card">
    <div class="card-head">
      <div>
        <div class="row" style="gap:.4rem">
          <span class="chip accent">${esc(c.paper.short)}</span>
          <span class="chip">Section ${esc(c.section)}</span>
          <span class="chip">${num(marks, 1)} indicative marks</span>
          ${content?.status === "outline" ? `<span class="chip amber">outline content</span>` : ""}
        </div>
        <h2 style="margin:.5rem 0 .15rem">${esc(c.title)}</h2>
        <p class="card-sub">${esc(c.paper.name)} · Paper ${c.paper.code} · target ${esc(c.paper.target || "later")}</p>
      </div>
      <span class="spacer"></span>
      <a class="btn small" href="#/practice?chapter=${c.id}">Practise (${qs.length})</a>
    </div>

    <div class="grid two" style="margin-top:.8rem">
      <div>
        <div class="tiny muted" style="margin-bottom:.3rem">Study status</div>
        <div class="row" id="statusRow">
          ${STATUSES.map((s) => `<button class="btn small ${st.status === s ? "" : "ghost"}" data-status="${s}">${s.replace("-", " ")}</button>`).join("")}
        </div>
      </div>
      <div>
        <div class="tiny muted" style="margin-bottom:.3rem">Confidence (0–3)</div>
        <div class="row" id="confRow">
          ${[0, 1, 2, 3].map((n) => `<button class="btn small ${st.confidence === n ? "" : "ghost"}" data-conf="${n}" title="${["can't start", "need notes", "with effort", "exam-ready"][n]}">${n}</button>`).join("")}
          <span class="tiny faint">${["can't start", "need notes", "with effort", "exam-ready"][st.confidence] || ""}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:1rem">
    <div class="tabs" style="margin:-.2rem 0 .9rem">
      ${tabs.map(([k, label]) => `<a class="tab${tab === k ? " active" : ""}" href="#/chapter/${id}?tab=${k}">${esc(label)}</a>`).join("")}
    </div>
    ${body}
  </div>`;
}

function questionCard(q, i) {
  return `<div class="question" data-qid="${esc(q.id)}">
    <div class="q-head">
      <span class="chip">Q${i + 1}</span>
      <span class="chip">${esc(q.type || "question")}</span>
      <span class="chip">${num(q.marks || 0)} marks</span>
      <span class="chip ${q.difficulty === "hard" ? "rose" : q.difficulty === "easy" ? "green" : "amber"}">${esc(q.difficulty || "medium")}</span>
      <span class="spacer"></span>
      <button class="btn small ghost" data-reveal>Show answer</button>
    </div>
    <div class="q-text">${esc(q.q)}</div>
    <div class="q-answer" hidden><strong>Answer.</strong> ${esc(q.answer || "Answer not authored.")}</div>
    <div class="row" style="margin-top:.5rem">
      <button class="btn small ghost" data-attempt="right">Got it right</button>
      <button class="btn small ghost" data-attempt="wrong">Got it wrong</button>
      <span class="tiny faint" data-feedback></span>
    </div>
  </div>`;
}

export function mountChapter({ params }) {
  const id = params[0];
  const root = document.getElementById("main");
  root.querySelectorAll("[data-status]").forEach((btn) => {
    btn.onclick = () => {
      store.setChapterStatus(id, btn.dataset.status);
      toast(`Status → ${btn.dataset.status.replace("-", " ")}`);
      refresh();
    };
  });
  root.querySelectorAll("[data-conf]").forEach((btn) => {
    btn.onclick = () => {
      store.setChapterConfidence(id, Number(btn.dataset.conf));
      toast(`Confidence → ${btn.dataset.conf}/3`);
      refresh();
    };
  });
  root.querySelectorAll(".question").forEach((box) => {
    const qid = box.dataset.qid;
    const q = D.questionById[qid];
    box.querySelector("[data-reveal]").onclick = (e) => {
      const ans = box.querySelector(".q-answer");
      ans.hidden = !ans.hidden;
      e.target.textContent = ans.hidden ? "Show answer" : "Hide answer";
    };
    box.querySelectorAll("[data-attempt]").forEach((b) => {
      b.onclick = () => {
        const correct = b.dataset.attempt === "right";
        store.recordAttempt({ qid, paperId: q?.paperId, chapterId: id, correct, marks: correct ? q?.marks || 0 : 0 });
        box.querySelector("[data-feedback]").textContent = correct ? "Recorded — counts toward accuracy." : "Recorded — add it to your mistake log.";
        box.querySelectorAll("[data-attempt]").forEach((x) => (x.disabled = true));
      };
    });
  });
}

/* ---------------- subjects ---------------- */

export function renderSubjects({ query }) {
  const q = (query.q || "").toLowerCase();
  const cat = query.cat || "all";
  const cats = [{ id: "all", name: "All" }, ...(D.subjectsDoc?.categories || [])];
  const rows = D.subjects
    .filter((s) => (cat === "all" || s.category === cat) && (!q || `${s.name} ${s.description}`.toLowerCase().includes(q)))
    .map((s) => ({
      ...s,
      chapters: (s.chapters || []).length,
      available: (s.chapters || []).filter((cid) => contentFor(cid)).length,
      papersList: (s.papers || []).map((p) => D.papersById[p]?.short || p).join(", "),
    }));

  return `
  <div class="row tiny muted" style="margin-bottom:.6rem"><a href="#/papers">Academic library</a> / Subject index</div>
  <div class="card">
    <div class="card-head"><div><h2 style="margin:0">Subject index</h2>
      <p class="card-sub">Subjects are cross-paper lenses, not papers. A subject such as “Accounting Fundamentals” threads through Foundation, Intermediate and Final.</p></div>
      <span class="spacer"></span><span class="chip">${D.subjects.length} subjects</span></div>
    <div class="tabs">${cats.map((c) => `<a class="tab${cat === c.id ? " active" : ""}" href="#/subjects?cat=${c.id}">${esc(c.name)}</a>`).join("")}</div>
    <form class="row" style="margin-top:.7rem" id="subjectSearch">
      <input name="q" value="${esc(query.q || "")}" placeholder="Filter subjects…" style="flex:1;max-width:340px" />
      <button class="btn small ghost">Filter</button>
    </form>
  </div>
  <div class="card" style="margin-top:1rem">
    ${table(
      [
        { key: "name", label: "Subject" },
        { key: "categoryName", label: "Category" },
        { key: "papersList", label: "Papers" },
        { key: "chapters", label: "Chapters", num: true },
        { key: "available", label: "Authored", num: true, render: (v, r) => `${v}/${r.chapters}` },
        { key: "status", label: "Data depth", render: (v) => badge(v) },
      ],
      rows.map((r) => ({ ...r, categoryName: (cats.find((c) => c.id === r.category) || {}).name || r.category })),
      { empty: "No subjects match." }
    )}
  </div>
  ${callout(`<strong>Why this layer exists.</strong> ICMAI asks for the same idea in several papers under different names — standard costing in Paper 8 and Paper 12, consolidation in Paper 10 and Paper 18. The subject index is how you revise sideways instead of relearning.`, "")}`;
}

export function mountSubjects() {
  document.getElementById("subjectSearch").onsubmit = (e) => {
    e.preventDefault();
    const q = new FormData(e.target).get("q");
    const cat = new URLSearchParams(location.hash.split("?")[1] || "").get("cat") || "all";
    location.hash = `#/subjects?cat=${cat}&q=${encodeURIComponent(q)}`;
  };
}

/* ---------------- concepts ---------------- */

export function renderConcepts({ query }) {
  const focus = query.focus;
  const concepts = D.concepts;
  const levelColors = ["", "green", "amber", "rose"];
  const paths = D.conceptPaths || [];
  const focusConcept = focus ? D.conceptById[focus] : null;

  return `
  <div class="row tiny muted" style="margin-bottom:.6rem"><a href="#/papers">Academic library</a> / Concept map</div>
  <div class="card">
    <div class="card-head"><div><h2 style="margin:0">Concept dependency map</h2>
      <p class="card-sub">${concepts.length} concepts, ${paths.length} named chains. Arrows run from prerequisite to dependent idea, across paper boundaries.</p></div></div>
    ${paths.map((p) => `<div class="chain">
      <div class="row" style="justify-content:space-between"><strong>${esc(p.name)}</strong><span class="chip">${p.sequence.length} steps</span></div>
      <p class="tiny muted" style="margin:.2rem 0 .45rem">${esc(p.purpose || "")}</p>
      <div class="row" style="gap:.25rem">
        ${p.sequence.map((cid, i) => `${i ? `<span class="arrow">→</span>` : ""}
          <a class="chip accent" href="#/concepts?focus=${cid}" style="text-decoration:none">${esc(D.conceptById[cid]?.label || cid)}</a>`).join("")}
      </div>
    </div>`).join("")}
  </div>

  ${focusConcept ? `<div class="card" style="margin-top:1rem">
    <div class="card-head"><h3>${esc(focusConcept.label)}</h3><span class="spacer"></span>
      <span class="chip ${levelColors[focusConcept.level] || ""}">Level ${focusConcept.level}</span></div>
    <p class="small">Domain: <b>${esc(focusConcept.domain)}</b> · Papers: ${focusConcept.papers.map((p) => esc(D.papersById[p]?.short || p)).join(", ")}</p>
    <div class="grid two">
      <div><h4 class="mini-head">Prerequisites</h4>
        <div class="row">${(focusConcept.before || []).map((b) => `<a class="chip" href="#/concepts?focus=${b}">${esc(D.conceptById[b]?.label || b)}</a>`).join("") || `<span class="tiny muted">None — this is a root concept.</span>`}</div></div>
      <div><h4 class="mini-head">Unlocks</h4>
        <div class="row">${(focusConcept.after || []).map((b) => `<a class="chip" href="#/concepts?focus=${b}">${esc(D.conceptById[b]?.label || b)}</a>`).join("") || `<span class="tiny muted">Terminal concept.</span>`}</div></div>
    </div>
  </div>` : ""}

  <div class="card" style="margin-top:1rem">
    <div class="card-head"><h3>All concepts</h3><span class="spacer"></span>
      <span class="tiny muted">Level 1 = foundation · 2 = intermediate · 3 = final</span></div>
    <div class="table-wrap"><table class="table"><thead><tr>
      <th>Concept</th><th>Domain</th><th>Papers</th><th class="num">Level</th><th>Prerequisite of</th></tr></thead><tbody>
      ${concepts
        .map(
          (c) => `<tr><td><a href="#/concepts?focus=${c.id}">${esc(c.label)}</a></td>
          <td class="tiny muted">${esc(c.domain)}</td>
          <td class="tiny">${c.papers.map((p) => esc(D.papersById[p]?.short || p)).join(", ")}</td>
          <td class="num">${c.level}</td>
          <td class="tiny muted">${(c.after || []).slice(0, 3).map((a) => esc(D.conceptById[a]?.label || a)).join(" · ")}</td></tr>`
        )
        .join("")}
    </tbody></table></div>
  </div>`;
}

export function mountConcepts() {}
