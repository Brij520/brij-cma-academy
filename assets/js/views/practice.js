/* Practice engine — adaptive question sessions with recorded attempts. */

import { D, paperChapters, chapterStats, questionsForPaper, questionsForChapter, chapterMarks } from "../data.js";
import * as store from "../store.js";
import { esc, num, pct, todayISO, badge, progress, stat, callout, empty, toast, barChart } from "../ui.js";

const PAPERS = ["p05", "p06", "p07", "p08", "p09", "p10", "p11", "p12"];

function poolFor({ paper, chapter, difficulty }) {
  let pool = chapter ? questionsForChapter(chapter) : paper ? questionsForPaper(paper) : D.questions;
  if (difficulty && difficulty !== "all") pool = pool.filter((q) => (q.difficulty || "medium") === difficulty);
  return pool;
}

/** Weight unattempted and weak chapters more heavily, then shuffle. */
function weightedPick(pool, count) {
  const state = store.get();
  const scored = pool.map((q) => {
    const st = state.chapters?.[q.chapterId] || {};
    const acc = st.attempts ? st.correct / st.attempts : null;
    let w = 1;
    if (!st.attempts) w += 1.5;
    if (acc !== null && acc < 0.6) w += 1.5;
    if (acc !== null && acc > 0.85) w -= 0.5;
    const marks = chapterMarks({ ...D.chapterById[q.chapterId], paperId: q.paperId });
    w += Math.min(1, (marks || 0) / 15);
    return { q, w: Math.max(0.2, w), r: Math.random() };
  });
  scored.sort((a, b) => b.w * b.r - a.w * a.r);
  return scored.slice(0, count).map((s) => s.q);
}

export function render({ query }) {
  const paper = query.paper || "p05";
  const chapter = query.chapter || "";
  const chapters = paperChapters(paper);

  return `
  <div class="card">
    <div class="card-head"><div><h2 style="margin:0">Practice engine</h2>
      <p class="card-sub">${D.questions.length} questions with worked answers. Every answer you record feeds chapter accuracy, the learning score and the revision queue.</p></div>
      <span class="spacer"></span><span class="chip accent">${D.questions.filter((q) => q.answer).length} answered</span></div>
  </div>

  <div class="grid two" style="margin-top:1rem">
    <div class="card">
      <h3>New session</h3>
      <form id="sessionForm" class="stack" style="margin-top:.6rem">
        <label class="field"><span>Paper</span>
          <select name="paper">${PAPERS.map((id) => {
            const p = D.papersById[id];
            return `<option value="${id}"${id === paper ? " selected" : ""}>Paper ${p.code} — ${esc(p.name)}</option>`;
          }).join("")}</select></label>
        <label class="field"><span>Chapter (optional)</span>
          <select name="chapter">
            <option value="">Whole paper</option>
            ${chapters.map((c) => `<option value="${c.id}"${c.id === chapter ? " selected" : ""}>${c.no}. ${esc(c.title)} (${chapterStats(store.get(), c.id).attempts} attempts)</option>`).join("")}
          </select></label>
        <div class="grid two">
          <label class="field"><span>Questions</span>
            <select name="count"><option>5</option><option selected>10</option><option>15</option><option>20</option></select></label>
          <label class="field"><span>Difficulty</span>
            <select name="difficulty"><option value="all">Mixed</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
        </div>
        <p class="tiny muted" style="margin:0">Selection is weighted toward chapters you have not attempted and chapters below 60% accuracy. Answers are revealed only when you ask.</p>
        <button class="btn" type="submit">Build session</button>
      </form>
    </div>

    <div class="card">
      <h3>Weakest chapters</h3>
      ${weakList()}
    </div>
  </div>

  <div id="practiceStage" style="margin-top:1rem"></div>`;
}

function weakList() {
  const state = store.get();
  const rows = D.chapters
    .map((c) => ({ ...c, ...chapterStats(state, c.id) }))
    .filter((c) => c.attempts >= 3)
    .sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100))
    .slice(0, 6);
  if (!rows.length) return `<p class="muted small">No chapter has three recorded attempts yet, so there is no accuracy signal. Build a session to start.</p>`;
  return `<div class="table-wrap"><table class="table"><thead><tr><th>Chapter</th><th class="num">Acc</th><th class="num">n</th><th></th></tr></thead><tbody>
    ${rows.map((r) => `<tr><td class="tiny">${esc(r.paper.short)} · ${esc(r.title)}</td>
      <td class="num">${r.accuracy === null ? "—" : pct(r.accuracy)}</td><td class="num">${r.attempts}</td>
      <td><a class="btn small ghost" href="#/practice?paper=${r.paperId}&chapter=${r.id}">Drill</a></td></tr>`).join("")}
  </tbody></table></div>`;
}

export function mount({ query }) {
  const form = document.getElementById("sessionForm");
  if (!form) return;
  form.onsubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    startSession(data);
  };
  if (query.chapter && query.start === "1") startSession({ paper: query.paper, chapter: query.chapter, count: "10", difficulty: "all" });
}

function startSession({ paper, chapter, count, difficulty }) {
  const pool = poolFor({ paper, chapter, difficulty });
  if (!pool.length) {
    document.getElementById("practiceStage").innerHTML = callout("<strong>No questions in that filter.</strong> Try the whole paper or mixed difficulty.", "warn");
    return;
  }
  const picks = weightedPick(pool, Math.min(Number(count) || 10, pool.length));
  const state = { picks, idx: 0, answers: [] };

  const stage = document.getElementById("practiceStage");
  stage.innerHTML = `<div class="card">
    <div class="card-head"><h3>Session · ${picks.length} questions</h3><span class="spacer"></span>
      <span class="chip" id="sessionProgress">1 / ${picks.length}</span></div>
    ${progress(0, "session-bar")}
    <div id="questionHost" style="margin-top:.9rem"></div>
    <div id="sessionSummary"></div>
  </div>`;
  stage.scrollIntoView({ behavior: "smooth", block: "start" });
  renderQuestion(stage, state);

  function renderQuestion(stage, state) {
    const q = state.picks[state.idx];
    const host = stage.querySelector("#questionHost");
    if (!q) return finish(stage, state);
    const c = D.chapterById[q.chapterId];
    stage.querySelector("#sessionProgress").textContent = `${state.idx + 1} / ${state.picks.length}`;
    stage.querySelector(".session-bar i").style.width = `${(state.idx / state.picks.length) * 100}%`;

    host.innerHTML = `<div class="question">
      <div class="q-head">
        <span class="chip accent">${esc(c?.paper.short || q.paperId)}</span>
        <span class="chip">${esc(q.type || "question")}</span>
        <span class="chip">${num(q.marks || 0)} marks</span>
        <span class="chip ${q.difficulty === "hard" ? "rose" : q.difficulty === "easy" ? "green" : "amber"}">${esc(q.difficulty || "medium")}</span>
      </div>
      <div class="tiny muted" style="margin-bottom:.4rem">${esc(c?.title || "")}${c ? ` · chapter ${c.no}` : ""}</div>
      <div class="q-text">${esc(q.q)}</div>
      <div class="q-answer" hidden><strong>Answer.</strong> ${esc(q.answer || "No answer authored.")}</div>
      <div class="row" style="margin-top:.7rem">
        <button class="btn small ghost" id="revealBtn">Reveal answer</button>
        <button class="btn small ghost" id="rightBtn">I got it right</button>
        <button class="btn small ghost" id="wrongBtn">I got it wrong</button>
        <button class="btn small ghost" id="skipBtn">Skip</button>
      </div>
    </div>`;

    let revealed = false;
    host.querySelector("#revealBtn").onclick = (e) => {
      revealed = !revealed;
      host.querySelector(".q-answer").hidden = !revealed;
      e.target.textContent = revealed ? "Hide answer" : "Reveal answer";
    };

    const record = (correct) => {
      store.recordAttempt({ qid: q.id, paperId: q.paperId, chapterId: q.chapterId, correct, marks: correct ? q.marks || 0 : 0 });
      state.answers.push({ q, correct });
      state.idx += 1;
      renderQuestion(stage, state);
    };
    host.querySelector("#rightBtn").onclick = () => record(true);
    host.querySelector("#wrongBtn").onclick = () => record(false);
    host.querySelector("#skipBtn").onclick = () => {
      state.answers.push({ q, correct: null });
      state.idx += 1;
      renderQuestion(stage, state);
    };
  }

  function finish(stage, state) {
    const correct = state.answers.filter((a) => a.correct === true).length;
    const wrong = state.answers.filter((a) => a.correct === false).length;
    const skipped = state.answers.length - correct - wrong;
    const accuracy = correct + wrong ? Math.round((correct / (correct + wrong)) * 100) : 0;
    const byChapter = {};
    state.answers.forEach((a) => {
      const k = a.q.chapterId;
      byChapter[k] = byChapter[k] || { c: D.chapterById[k], right: 0, total: 0 };
      if (a.correct !== null) {
        byChapter[k].total += 1;
        if (a.correct) byChapter[k].right += 1;
      }
    });

    stage.querySelector(".session-bar i").style.width = "100%";
    stage.querySelector("#sessionProgress").textContent = `${state.picks.length} / ${state.picks.length}`;
    stage.querySelector("#questionHost").innerHTML = `
      <div class="grid three" style="margin-bottom:.9rem">
        ${stat("Correct", `${correct}/${correct + wrong}`, skipped ? `${skipped} skipped` : "no skips")}
        ${stat("Session accuracy", pct(accuracy), accuracy >= 60 ? "above threshold" : "below 60% threshold")}
        ${stat("Marks earned", num(state.answers.reduce((a, x) => a + (x.correct ? x.q.marks || 0 : 0), 0)), "of attempted marks")}
      </div>
      ${accuracy < 60 ? callout("<strong>Below threshold.</strong> Do not move to a new chapter. Re-read the definitions, then re-drill these chapters in two days. Record the specific error type in the knowledge base.", "warn") : callout("<strong>Above threshold.</strong> Note the two questions you were slowest on and put the chapter into the revision queue for next week.", "")}
      <h4 class="mini-head">By chapter</h4>
      ${Object.values(byChapter)
        .filter((x) => x.total)
        .map((x) => `<div class="bar-row"><div class="lbl">${esc(x.c?.title || "")}</div>
          <div class="track"><i style="width:${(x.right / x.total) * 100}%"></i></div>
          <div class="num">${x.right}/${x.total}</div></div>`)
        .join("")}
      <div class="row" style="margin-top:.9rem">
        <button class="btn" id="logSession">Log this session</button>
        <a class="btn ghost" href="#/performance">Open performance</a>
        <a class="btn ghost" href="#/knowledge">Log a mistake</a>
      </div>`;

    stage.querySelector("#logSession").onclick = (e) => {
      store.addLog({
        date: todayISO(),
        studyHours: Math.round(((correct + wrong) * 4) / 60 * 10) / 10 || 0.5,
        paperId: state.picks[0]?.paperId,
        questionsAttempted: correct + wrong,
        questionsCorrect: correct,
        revisionMinutes: 0,
        notes: `Practice session · ${state.picks.length} questions · ${accuracy}% accuracy`,
        topics: [...new Set(state.answers.map((a) => D.chapterById[a.q.chapterId]?.title).filter(Boolean))].slice(0, 3).join("; "),
      });
      e.target.disabled = true;
      e.target.textContent = "Logged";
      toast("Session logged · hours estimated at 4 min/question");
    };
  }
}
