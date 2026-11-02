/* PROJECT CMA — UI primitives. No dependencies. */

export const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const num = (v, d = 0) =>
  v === null || v === undefined || Number.isNaN(Number(v))
    ? "—"
    : Number(v).toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });

export const pct = (v, d = 0) => (v === null || v === undefined || Number.isNaN(Number(v)) ? "—" : `${Number(v).toFixed(d)}%`);

export const dateFmt = (iso, opts = { day: "2-digit", month: "short", year: "numeric" }) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("en-IN", opts);
};

export const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

export const todayISO = () => {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
};

export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const initials = (name) =>
  String(name || "CMA")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

/* ---------- small components ---------- */

export function badge(status = "") {
  const cls = `s-${slug(status || "not-started")}`;
  return `<span class="badge-status ${cls}">${esc(status || "not started")}</span>`;
}

export function progress(pctVal, cls = "") {
  const v = Math.max(0, Math.min(100, Number(pctVal) || 0));
  return `<div class="progress ${cls}" role="progressbar" aria-valuenow="${Math.round(v)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${v}%"></i></div>`;
}

export function stat(label, value, foot = "", accent = "") {
  return `<div class="stat">
    <div class="label">${esc(label)}</div>
    <div class="value"${accent ? ` style="color:${accent}"` : ""}>${value}</div>
    ${foot ? `<div class="foot">${foot}</div>` : ""}
  </div>`;
}

export function bars(rows, max = null) {
  if (!rows || !rows.length) return `<p class="muted tiny">No data yet.</p>`;
  const m = max ?? Math.max(...rows.map((r) => Number(r.value) || 0), 1);
  return rows
    .map(
      (r) => `<div class="bar-row">
      <div class="lbl" title="${esc(r.label)}">${esc(r.label)}</div>
      <div class="track"><i style="width:${((Number(r.value) || 0) / m) * 100}%;${r.color ? `background:${r.color}` : ""}"></i></div>
      <div class="num">${esc(r.display ?? num(r.value))}</div>
    </div>`
    )
    .join("");
}

export function table(columns, rows, opts = {}) {
  if (!rows || !rows.length) return `<p class="muted tiny">${esc(opts.empty || "No data.")}</p>`;
  const head = columns
    .map((c) => `<th class="${c.num ? "num" : ""}">${esc(c.label ?? c)}</th>`)
    .join("");
  const body = rows
    .map(
      (r) =>
        `<tr>${columns
          .map((c) => {
            const key = c.key ?? c;
            let v = Array.isArray(r) ? r[columns.indexOf(c)] : r[key];
            if (c.render) v = c.render(v, r);
            return `<td class="${c.num ? "num" : ""}">${v ?? ""}</td>`;
          })
          .join("")}</tr>`
    )
    .join("");
  return `<div class="table-wrap"><table class="table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

export function callout(html, kind = "") {
  return `<div class="callout ${kind}">${html}</div>`;
}

export function accordion(title, html, open = false, meta = "") {
  return `<details class="acc"${open ? " open" : ""}>
    <summary>${esc(title)}${meta ? ` <span class="chip" style="margin-left:auto">${esc(meta)}</span>` : ""}</summary>
    <div class="acc-body">${html}</div>
  </details>`;
}

export function empty(title, body = "") {
  return `<div class="empty"><strong>${esc(title)}</strong>${body}</div>`;
}

/* ---------- charts (inline SVG, no libraries) ---------- */

export function lineChart(series, opts = {}) {
  const width = opts.width || 620;
  const height = opts.height || 180;
  const pad = { t: 12, r: 12, b: 26, l: 34 };
  const labels = opts.labels || [];
  const all = series.flatMap((s) => s.points.filter((p) => p !== null && !Number.isNaN(p)));
  if (!all.length) return `<p class="muted tiny">No data to chart yet.</p>`;
  const max = opts.max ?? Math.max(...all, 1);
  const min = opts.min ?? 0;
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const n = Math.max(...series.map((s) => s.points.length), 1);
  const x = (i) => pad.l + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v) => pad.t + innerH - ((v - min) / (max - min || 1)) * innerH;

  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map((f) => {
      const yy = pad.t + innerH * f;
      const val = max - (max - min) * f;
      return `<line class="grid-line" x1="${pad.l}" y1="${yy}" x2="${width - pad.r}" y2="${yy}"/>
        <text x="${pad.l - 6}" y="${yy + 3}" text-anchor="end">${Math.round(val)}</text>`;
    })
    .join("");

  const paths = series
    .map((s, si) => {
      const d = s.points
        .map((v, i) => (v === null || v === undefined ? null : `${i === 0 || s.points[i - 1] == null ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`))
        .filter(Boolean)
        .join(" ");
      const dots = s.points
        .map((v, i) => (v == null ? "" : `<circle cx="${x(i)}" cy="${y(v)}" r="2.5" fill="${si === 0 ? "var(--accent)" : "var(--blue)"}"/>`))
        .join("");
      return `<path class="${si === 0 ? "series" : "series-2"}" d="${d}"/>${dots}`;
    })
    .join("");

  const xlabels = labels
    .map((l, i) => `<text x="${x(i)}" y="${height - 8}" text-anchor="middle">${esc(l)}</text>`)
    .join("");

  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(opts.aria || "chart")}">
    ${grid}${paths}${xlabels}
    <line class="axis" x1="${pad.l}" y1="${pad.t + innerH}" x2="${width - pad.r}" y2="${pad.t + innerH}"/>
  </svg>`;
}

export function barChart(items, opts = {}) {
  const width = opts.width || 620;
  const barH = opts.barH || 22;
  const gap = 8;
  const height = Math.max(items.length * (barH + gap), 40);
  const pad = { l: 130, r: 46 };
  const max = Math.max(...items.map((i) => Number(i.value) || 0), 1);
  const rows = items
    .map((it, idx) => {
      const yy = idx * (barH + gap) + 4;
      const w = ((Number(it.value) || 0) / max) * (width - pad.l - pad.r);
      const color = it.color || "var(--accent-2)";
      return `<text x="${pad.l - 8}" y="${yy + barH * 0.7}" text-anchor="end">${esc(it.label)}</text>
        <rect x="${pad.l}" y="${yy}" width="${Math.max(w, 1)}" height="${barH}" rx="4" fill="${color}" opacity=".85"/>
        <text x="${pad.l + Math.max(w, 1) + 6}" y="${yy + barH * 0.7}">${esc(it.display ?? it.value)}</text>`;
    })
    .join("");
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(opts.aria || "bar chart")}">${rows}</svg>`;
}

export function heatmap(cells, opts = {}) {
  const cols = opts.cols || 4;
  const max = Math.max(...cells.map((c) => Number(c.value) || 0), 1);
  const body = cells
    .map((c) => {
      const intensity = Math.max(0, Math.min(1, (Number(c.value) || 0) / max));
      const bg =
        Number(c.value) > 0
          ? `background: color-mix(in srgb, var(--accent) ${Math.round(18 + intensity * 62)}%, var(--panel-3))`
          : "";
      return `<div class="heat-cell" style="${bg}" title="${esc(c.label)}: ${esc(c.display ?? c.value)}">
        <span style="position:absolute;inset:0;display:grid;place-items:center;font-size:.62rem;color:var(--text-2);padding:2px;text-align:center;overflow:hidden">${esc(c.short ?? "")}</span>
      </div>`;
    })
    .join("");
  return `<div class="heat" style="grid-template-columns:repeat(${cols},minmax(0,1fr))">${body}</div>
    <div class="heat-legend"><span>low</span>
      ${[18, 38, 58, 80].map((v) => `<i style="background:color-mix(in srgb, var(--accent) ${v}%, var(--panel-3))"></i>`).join("")}
      <span>high</span></div>`;
}

/* ---------- toast ---------- */

let toastTimer = null;
export function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2600);
}

/** Ask the shell to re-render the current route after a state mutation. */
export function refresh() {
  const Ctor = document.defaultView?.CustomEvent || CustomEvent;
  document.dispatchEvent(new Ctor("pcm:refresh"));
}

export function confirmAction(message) {
  return window.confirm(message);
}
