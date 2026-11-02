/* Personal knowledge management — tagged, linked notes across papers. */

import { D } from "../data.js";
import * as store from "../store.js";
import { esc, dateFmt, todayISO, table, callout, empty, toast, confirmAction, accordion, badge, refresh } from "../ui.js";

const TYPES = [
  { id: "all", name: "Everything" },
  ...((D.knowledgeSeed?.types || []).map((t) => ({ id: t.id, name: t.name }))),
];

export function render({ query }) {
  const state = store.get();
  const type = query.type || "all";
  const q = (query.q || "").toLowerCase();
  const seeds = (D.knowledgeSeed?.entries || []).filter((e) => {
    if (type !== "all" && e.type !== type) return false;
    if (q && !`${e.title} ${e.body} ${(e.tags || []).join(" ")}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const notes = (state.notes || []).filter((n) => {
    if (type !== "all" && n.type !== type) return false;
    if (q && !`${n.title} ${n.body} ${(n.tags || []).join(" ")}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const pinned = new Set((state.notes || []).map((n) => n.sourceId).filter(Boolean));

  return `
  <div class="card">
    <div class="card-head"><div><h2 style="margin:0">Personal knowledge base</h2>
      <p class="card-sub">${esc(D.knowledgeSeed?.meta?.purpose || "Your notes, mistakes, formulas and provisions — linked across papers.")}</p></div>
      <span class="spacer"></span>
      <span class="chip">${notes.length} of my notes</span></div>
    <div class="tabs">${TYPES.map((t) => `<a class="tab${type === t.id ? " active" : ""}" href="#/knowledge?type=${t.id}">${esc(t.name)}</a>`).join("")}</div>
    <form class="row" id="kbSearch" style="margin-top:.7rem">
      <input name="q" value="${esc(query.q || "")}" placeholder="Search titles, bodies and tags…" style="flex:1;min-width:200px" />
      <button class="btn small ghost">Search</button>
    </form>
  </div>

  ${callout(`<strong>The linking principle.</strong> ${esc(D.knowledgeSeed?.meta?.linkingPrinciple || "")}<br>
    <span class="tiny">Example: ${esc(D.knowledgeSeed?.meta?.example || "")}</span>`, "")}

  <div class="grid two" style="margin-top:1rem">
    <div class="card">
      <div class="card-head"><h3>Write a note</h3><span class="spacer"></span><span class="chip">local only</span></div>
      <form id="noteForm" class="stack">
        <label class="field"><span>Title</span><input name="title" required placeholder="What is the one thing to remember?" /></label>
        <div class="grid two">
          <label class="field"><span>Type</span><select name="type">${(D.knowledgeSeed?.types || []).map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></label>
          <label class="field"><span>Status</span><select name="status"><option>open</option><option>reviewed</option><option>mastered</option></select></label>
        </div>
        <label class="field"><span>Body</span><textarea name="body" rows="3" required placeholder="Rule, correction, provision or formula — in your own words."></textarea></label>
        <div class="grid two">
          <label class="field"><span>Tags</span><input name="tags" placeholder="comma, separated" /></label>
          <label class="field"><span>Link to chapter id</span><input name="chapter" placeholder="e.g. p08-c11" /></label>
        </div>
        <label class="field"><span>Link to formula id</span><input name="formula" placeholder="e.g. f-bep-units" /></label>
        <button class="btn" type="submit">Save note</button>
      </form>
    </div>

    <div class="card">
      <div class="card-head"><h3>My notes</h3><span class="spacer"></span><span class="chip">${notes.length}</span></div>
      ${notes.length
        ? notes
            .map(
              (n) => `<div class="note">
                <div class="row" style="justify-content:space-between">
                  <strong class="small">${esc(n.title)}</strong>
                  <span class="row" style="gap:.3rem">
                    <span class="chip">${esc(n.type)}</span>
                    <button class="btn small ghost" data-delnote="${esc(n.id)}">✕</button>
                  </span>
                </div>
                <p class="small" style="margin:.25rem 0">${esc(n.body)}</p>
                <div class="row tiny muted" style="gap:.3rem">
                  ${(n.tags || []).map((t) => `<span class="chip">#${esc(t)}</span>`).join("")}
                  ${n.chapter ? `<a class="chip accent" href="#/chapter/${esc(n.chapter)}">${esc(n.chapter)}</a>` : ""}
                  ${n.formula ? `<a class="chip" href="#/formulas?q=${encodeURIComponent(n.formula)}">${esc(n.formula)}</a>` : ""}
                  <span class="spacer"></span><span class="faint">${dateFmt(n.createdAt)}</span>
                </div>
              </div>`
            )
            .join("")
        : empty("No personal notes yet", "Pin a seed entry below or write your own. Notes you never re-read are decoration.")}
    </div>
  </div>

  <div class="card" style="margin-top:1rem">
    <div class="card-head"><h3>Seeded knowledge entries</h3><span class="spacer"></span>
      <span class="chip">${seeds.length} shown</span></div>
    ${seeds.length
      ? seeds
          .map(
            (e) => `<div class="note">
              <div class="row" style="justify-content:space-between">
                <div class="row" style="gap:.4rem;flex:1;min-width:0">
                  <span class="chip ${e.type === "mistake" ? "rose" : e.type === "formula" ? "accent" : "amber"}">${esc(e.type)}</span>
                  <strong class="small">${esc(e.title)}</strong>
                </div>
                <button class="btn small ghost" data-pin="${esc(e.id)}" ${pinned.has(e.id) ? "disabled" : ""}>${pinned.has(e.id) ? "Pinned" : "Add to mine"}</button>
              </div>
              <p class="small" style="margin:.3rem 0">${esc(e.body)}</p>
              <div class="row tiny" style="gap:.3rem">
                ${(e.tags || []).map((t) => `<span class="chip">#${esc(t)}</span>`).join("")}
                ${(e.links?.chapters || []).map((c) => `<a class="chip" href="#/chapter/${esc(c)}">${esc(c)}</a>`).join("")}
                ${(e.links?.concepts || []).map((c) => `<a class="chip" href="#/concepts?focus=${esc(c)}">${esc(D.conceptById[c]?.label || c)}</a>`).join("")}
                <span class="spacer"></span><span class="faint tiny">${esc(e.source || "")}</span>
              </div>
            </div>`
          )
          .join("")
      : empty("Nothing in this filter", "Clear the search or choose a different type.")}
  </div>

  <p class="tiny muted">Cross-paper linking is the point. Break-even in Paper 8, marginal costing decisions in Paper 12 and pricing in Paper 17 are one chain — see <a href="#/concepts">the concept map</a>.</p>`;
}

export function mount({ query }) {
  const state = store.get();
  document.getElementById("kbSearch").onsubmit = (e) => {
    e.preventDefault();
    const q = new FormData(e.target).get("q");
    location.hash = `#/knowledge?type=${query.type || "all"}&q=${encodeURIComponent(q)}`;
  };

  document.querySelectorAll("[data-pin]").forEach((b) => {
    b.onclick = () => {
      const seed = (D.knowledgeSeed?.entries || []).find((e) => e.id === b.dataset.pin);
      if (!seed) return;
      const ok = store.pinSeedEntry(seed.id, {
        title: seed.title,
        type: seed.type,
        body: seed.body,
        tags: seed.tags || [],
        status: seed.status || "open",
        chapter: seed.links?.chapters?.[0],
        formula: seed.links?.formulas?.[0],
      });
      toast(ok ? "Added to your notes" : "Already in your notes");
      if (ok) refresh();
    };
  });

  document.querySelectorAll("[data-delnote]").forEach((b) => {
    b.onclick = () => {
      if (confirmAction("Delete this note?")) {
        store.removeNote(b.dataset.delnote);
        refresh();
      }
    };
  });

  document.getElementById("noteForm").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const tags = String(fd.get("tags") || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    store.addNote({
      title: fd.get("title"),
      type: fd.get("type"),
      body: fd.get("body"),
      status: fd.get("status"),
      tags,
      chapter: fd.get("chapter") || "",
      formula: fd.get("formula") || "",
      date: todayISO(),
    });
    toast("Note saved");
    refresh();
  };
}
