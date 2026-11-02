/* Priority plan — the hierarchy that governs every other module. */

import { D, paperProgress, paperStats, studyHours, lastNDays } from "../data.js";
import * as store from "../store.js";
import { esc, num, pct, dateFmt, todayISO, daysBetween, stat, progress, table, callout, badge, bars } from "../ui.js";

export function render() {
  const state = store.get();
  const priorities = D.priority?.priorities || [];
  const budget = D.priority?.timeBudget || {};
  const windows = D.priority?.examWindows || [];
  const triggers = D.priority?.escalationTriggers || [];
  const top = priorities.find((p) => p.rank === 1);
  const days = top ? daysBetween(new Date(), top.target) : null;
  const hours7 = studyHours(state, { from: lastNDays(7)[0] });
  const academicHours7 = ["p05", "p06", "p07", "p08"].reduce(
    (a, id) => a + studyHours(state, { from: lastNDays(7)[0], paperId: id }),
    0
  );

  return `
  <div class="card">
    <div class="card-head"><div>
      <div class="eyebrow" style="color:var(--accent);font-size:.7rem;letter-spacing:.13em;text-transform:uppercase;font-weight:700">Governing constraint</div>
      <h2 style="margin:.35rem 0 .3rem">${esc(D.priority?.meta?.purpose || "Priority hierarchy")}</h2>
      <p class="card-sub">${esc(D.priority?.meta?.governingRule || "")}</p>
    </div></div>
    <div class="grid four" style="margin-top:.9rem">
      ${stat("Days to Paper 5", days === null ? "—" : String(days), top ? esc(top.name) : "")}
      ${stat("Hours, last 7 days", num(hours7, 1), `of ${num(budget.weeklyAvailableHours || 40)} planned`)}
      ${stat("Academic share", hours7 ? pct(Math.round((academicHours7 / hours7) * 100)) : "—", "target 62% of study time")}
      ${stat("Ranks", String(priorities.length), "1 is non-negotiable")}
    </div>
  </div>

  ${priorities
    .map((p) => {
      const papers = (p.papers || []).map((id) => D.papersById[id]).filter(Boolean);
      const avg = papers.length ? Math.round(papers.reduce((a, x) => a + paperProgress(state, x.id), 0) / papers.length) : null;
      const isTop = p.rank === 1;
      return `<div class="card" style="margin-top:1rem;${isTop ? "border-color:color-mix(in srgb, var(--accent) 40%, var(--line))" : ""}">
        <div class="card-head">
          <div class="rank-badge">${p.rank}</div>
          <div>
            <div class="row" style="gap:.4rem">
              <h3 style="margin:0">${esc(p.name)}</h3>
              ${isTop ? `<span class="chip accent">active</span>` : `<span class="chip">${p.rank <= 3 ? "queued" : "subordinate"}</span>`}
            </div>
            <p class="card-sub">${esc(p.why || "")}</p>
          </div>
          <span class="spacer"></span>
          <div style="text-align:right">
            <div class="tiny muted">target</div>
            <div class="tiny"><b>${esc(p.target || "—")}</b>${p.endDate ? ` → ${esc(p.endDate)}` : ""}</div>
          </div>
        </div>

        <div class="grid three" style="margin:.5rem 0 .8rem">
          ${stat("Weekly hours", `${p.weeklyHours} h`, `${Math.round((p.allocationShare || 0) * 100)}% of the ${budget.weeklyAvailableHours || 40} h week`)}
          ${stat("Success measure", `<span style="font-size:.95rem;line-height:1.35">${esc(p.successMeasure || "—")}</span>`, "")}
          ${stat("Syllabus coverage", avg === null ? "—" : pct(avg), papers.length ? papers.map((x) => esc(x.short)).join(" · ") : "no paper mapping")}
        </div>

        ${papers.length ? `<div class="row tiny" style="gap:.35rem;margin-bottom:.7rem">${papers
          .map((x) => {
            const s = paperStats(state, x.id);
            return `<a class="chip" href="#/paper/${x.id}" style="text-decoration:none">${esc(x.short)} · ${s.progress}%</a>`;
          })
          .join("")}</div>` : ""}

        <div class="grid two">
          <div>
            <h4 class="mini-head">Gates</h4>
            <div class="timeline">
              ${(p.gates || []).map((g) => {
                const date = g.by || g.from;
                const passed = date && date < todayISO();
                return `<div class="timeline-item ${passed ? "done" : ""}">
                  <div class="t">${esc(g.gate)}</div>
                  <div class="m">${g.by ? `by ${dateFmt(g.by)}` : `${dateFmt(g.from)} → ${dateFmt(g.to)}`}${passed ? " · date passed — self-assess honestly" : ""}</div>
                </div>`;
              }).join("") || `<p class="tiny muted">No gates defined.</p>`}
            </div>
          </div>
          <div>
            <h4 class="mini-head">Non-negotiable</h4>
            <ul class="tight-list">${(p.nonNegotiable || []).map((n) => `<li>${esc(n)}</li>`).join("") || `<li class="faint">None stated</li>`}</ul>
          </div>
        </div>
      </div>`;
    })
    .join("")}

  <div class="grid two" style="margin-top:1rem">
    <div class="card">
      <div class="card-head"><h3>Weekly time budget</h3><span class="spacer"></span><span class="chip">${num(budget.weeklyAvailableHours || 40)} h</span></div>
      ${bars((budget.split || []).map((s) => ({ label: s.activity, value: s.hours, display: `${s.hours} h` })))}
      <p class="tiny muted" style="margin-bottom:0">${esc(budget.note || "")}</p>
    </div>
    <div class="card">
      <div class="card-head"><h3>Exam windows</h3></div>
      ${table(
        [
          { key: "session", label: "Session" },
          { key: "papers", label: "Papers" },
          { key: "dates", label: "Dates" },
          { key: "verified", label: "Source status", render: (v) => `<span class="chip ${v ? "green" : "amber"}">${v ? "confirmed" : "unconfirmed"}</span>` },
        ],
        windows.map((w) => ({
          session: w.session,
          papers: w.papers,
          dates: w.from ? `${dateFmt(w.from)} – ${dateFmt(w.to)}` : "not published",
          verified: w.verified,
        })),
        { empty: "No windows defined." }
      )}
    </div>
  </div>

  <div class="card" style="margin-top:1rem">
    <div class="card-head"><h3>Escalation triggers</h3><span class="spacer"></span><span class="chip amber">pauses the lower ranks</span></div>
    ${table(
      [{ key: "trigger", label: "If this happens" }, { key: "action", label: "Then this is the response" }],
      triggers,
      { empty: "No triggers defined." }
    )}
  </div>

  ${callout(`<strong>How the system enforces this.</strong> Papers 9–12 are visible in the library but marked as later-window work. The skill academies are capped at 4 hours a week,
    and technology at 1.5, so the professional layer cannot quietly consume exam time. If a lower rank starts beating the exam rank for two consecutive weeks, the weekly review is the place to say so — not the place to hide it.`, "warn")}`;
}

export function mount() {}
