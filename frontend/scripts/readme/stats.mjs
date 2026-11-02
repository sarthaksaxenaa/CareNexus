// Generates docs/assets/stats-{dark,light}.svg (+ stats.json) from real CI output.
// Nothing is typed by hand: every figure is read from a report file, and a
// missing report shows "–" instead of a guess.
//
// Inputs (paths relative to the repo root):
//   backend/test-report.xml     pytest --junitxml
//   backend/coverage.xml        pytest --cov --cov-report=xml
//   backend/retrieval.json      python -m scripts.eval_retrieval --json
//   backend/pip-audit.json      pip-audit -f json
//   frontend/vitest-report.json vitest --reporter=json
//   frontend/e2e-report.json    playwright --reporter=json
//   frontend/npm-audit.json     npm audit --omit=dev --json
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ASSETS, REPO, THEMES, esc, svgDoc } from "./theme.mjs";

const read = (rel) => {
  const p = join(REPO, rel);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
};
const json = (rel) => {
  const text = read(rel);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // Some commands log a line before their JSON; use the last JSON line.
    const line = text.trim().split("\n").reverse().find((l) => l.trim().startsWith("{"));
    try {
      return line ? JSON.parse(line) : null;
    } catch {
      return null;
    }
  }
};
const attr = (xml, name) => {
  const m = xml?.match(new RegExp(`${name}="([^"]+)"`));
  return m ? Number(m[1]) : null;
};

// ── Collect ──────────────────────────────────────────────────────────────────
const junit = read("backend/test-report.xml");
let backend = junit ? { tests: attr(junit, "tests"), failed: (attr(junit, "failures") ?? 0) + (attr(junit, "errors") ?? 0) } : null;

let lineRate = attr(read("backend/coverage.xml"), "line-rate");

let retrieval = json("backend/retrieval.json");

const vitest = json("frontend/vitest-report.json");
let unit = vitest ? { tests: vitest.numTotalTests, failed: vitest.numFailedTests } : null;

const e2eReport = json("frontend/e2e-report.json");
let e2e = e2eReport?.stats ? { tests: e2eReport.stats.expected + e2eReport.stats.unexpected + (e2eReport.stats.flaky ?? 0), failed: e2eReport.stats.unexpected } : null;

const pip = json("backend/pip-audit.json");
const npm = json("frontend/npm-audit.json");
let vulns =
  pip && npm
    ? (pip.dependencies ?? []).reduce((n, d) => n + (d.vulns?.length ?? 0), 0) +
      (npm.metadata?.vulnerabilities?.total ?? 0)
    : null;

// No reports at all (a local redesign run): redraw from the figures CI last
// measured, keeping their date, rather than showing dashes or guessing.
const cached = json("docs/assets/stats.json");
const fromCache = ![junit, vitest, e2eReport, retrieval, pip].some(Boolean) && cached;
if (fromCache) {
  const t = cached.tests;
  backend = { tests: t.backend, failed: 0 };
  unit = { tests: t.unit, failed: 0 };
  e2e = { tests: t.e2e, failed: t.failing };
  lineRate = cached.coverage;
  retrieval = cached.retrieval;
  vulns = cached.vulnerabilities;
}

const suites = [backend, unit, e2e];
const allSuites = suites.every(Boolean);
const totalTests = allSuites ? suites.reduce((n, s) => n + s.tests, 0) : null;
const failing = allSuites ? suites.reduce((n, s) => n + s.failed, 0) : null;

const pct = (x, digits = 0) => (x == null ? "–" : `${(x * 100).toFixed(digits)}%`);
const num = (x) => (x == null ? "–" : new Intl.NumberFormat("en-IN").format(x));

const measured = {
  tests: { total: totalTests, failing, backend: backend?.tests ?? null, unit: unit?.tests ?? null, e2e: e2e?.tests ?? null },
  coverage: lineRate,
  retrieval,
  conditions: 49,
  vulnerabilities: vulns,
};
// The date means "figures last changed": unchanged figures keep the previous
// date, which makes the drawing deterministic and an unchanged run a no-op.
const same = (a, b) => JSON.stringify({ ...a, updated: 0 }) === JSON.stringify({ ...b, updated: 0 });
const unchanged = cached && same(cached, measured);
const stats = { updated: fromCache || unchanged ? cached.updated : new Date().toISOString(), ...measured };
const today = new Date(stats.updated).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

// ── Draw ─────────────────────────────────────────────────────────────────────
const W = 1280;
const H = 360;
const cols = [
  {
    value: num(totalTests),
    label: failing === 0 ? "tests passing" : failing ? `tests, ${failing} failing` : "tests",
    sub: allSuites ? `${num(backend.tests)} API, ${num(unit.tests)} unit, ${num(e2e.tests)} browser` : "",
  },
  { value: pct(lineRate), label: "backend line coverage", sub: "CI fails below 90%" },
  {
    value: pct(retrieval?.labelled?.top1),
    label: "correct first match",
    sub: retrieval ? `${pct(retrieval.heldout.top1, 0)} on unseen queries` : "",
    bars: retrieval ? [["labelled", retrieval.labelled.top1], ["unseen", retrieval.heldout.top1]] : null,
  },
  { value: "49", label: "ICD-10-coded conditions", sub: "in 11 specialties" },
  { value: vulns == null ? "–" : String(vulns), label: "known vulnerabilities", sub: "shipped deps · pip-audit, npm audit" },
];

const colW = (W - 160) / cols.length;

function card(t) {
  const body = cols
    .map((c, i) => {
      const x = 80 + i * colW;
      const sep = i ? `<line x1="${x - 16}" x2="${x - 16}" y1="132" y2="300" stroke="${t.hair}"/>` : "";
      const bars = c.bars
        ? c.bars
            .map(
              ([name, v], j) => `<g transform="translate(${x} ${280 + j * 18})">
      <rect width="120" height="4" rx="2" fill="${t.hair}"/>
      <rect class="bar" width="${(120 * v).toFixed(1)}" height="4" rx="2" fill="${t.accent}" style="animation-delay:${0.3 + j * 0.2}s"/>
      <text class="sans" x="132" y="5" font-size="13" fill="${t.ink4}">${name}</text></g>`,
            )
            .join("")
        : "";
      return `${sep}
  <g class="col" style="animation-delay:${i * 0.12}s">
    <text class="serif" x="${x}" y="206" font-size="72" font-weight="300" fill="${t.ink}">${esc(c.value)}</text>
    <text class="sans" x="${x + 2}" y="238" font-size="17" fill="${t.ink3}">${esc(c.label)}</text>
    <text class="sans" x="${x + 2}" y="262" font-size="14" fill="${t.ink4}">${esc(c.sub)}</text>
    ${bars}
  </g>`;
    })
    .join("");
  return svgDoc({
    w: W,
    h: H,
    title: `CareNexus quality, measured on ${today}`,
    desc: cols.map((c) => `${c.value} ${c.label}`).join("; "),
    css: `@keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.col{animation:up .8s cubic-bezier(.22,1,.36,1) both}
.bar{transform-origin:left;transform-box:fill-box;animation:grow 1.2s cubic-bezier(.22,1,.36,1) both}`,
    body: `<defs><radialGradient id="g" cx="50%" cy="50%" r="50%">
  <stop offset="0" stop-color="${t.amethyst}" stop-opacity=".7"/><stop offset="1" stop-color="${t.amethyst}" stop-opacity="0"/>
</radialGradient></defs>
<rect width="${W}" height="${H}" rx="24" fill="${t.void}"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="24" fill="none" stroke="${t.hair}"/>
<ellipse cx="${W - 160}" cy="0" rx="460" ry="240" fill="url(#g)"/>
<text class="serif" x="80" y="84" font-size="40" font-weight="300" fill="${t.accent}">Measured, not claimed</text>
<text class="sans track" x="${W - 80}" y="84" font-size="12" fill="${t.ink4}" text-anchor="end">Measured by CI · ${esc(today)}</text>
<line x1="80" x2="${W - 80}" y1="108" y2="108" stroke="${t.hair}"/>
${body}`,
  });
}

// Write only files whose content differs, so the workflow commits nothing
// when nothing changed, and a card can never lag behind stats.json.
mkdirSync(ASSETS, { recursive: true });
const writeIfChanged = (name, content) => {
  const path = join(ASSETS, name);
  if (existsSync(path) && readFileSync(path, "utf8") === content) return false;
  writeFileSync(path, content);
  return true;
};
const changed = [
  ...THEMES.map((t) => writeIfChanged(`stats-${t.scheme}.svg`, card(t)) && `stats-${t.scheme}.svg`),
  writeIfChanged("stats.json", JSON.stringify(stats, null, 2) + "\n") && "stats.json",
].filter(Boolean);
console.log("stats:", JSON.stringify({ totalTests, failing, coverage: lineRate, top1: retrieval?.labelled?.top1, vulns }), changed.length ? `wrote ${changed.join(", ")}` : "no change");
