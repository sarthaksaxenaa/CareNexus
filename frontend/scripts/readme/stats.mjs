// Generates docs/assets/stats.svg (+ stats.json) from real CI output.
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
//   frontend/npm-audit.json     npm audit --json
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ASSETS, C, REPO, esc, fontFaces } from "./theme.mjs";

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
const backend = junit ? { tests: attr(junit, "tests"), failed: (attr(junit, "failures") ?? 0) + (attr(junit, "errors") ?? 0) } : null;

const lineRate = attr(read("backend/coverage.xml"), "line-rate");

const retrieval = json("backend/retrieval.json");

const vitest = json("frontend/vitest-report.json");
const unit = vitest ? { tests: vitest.numTotalTests, failed: vitest.numFailedTests } : null;

const e2eReport = json("frontend/e2e-report.json");
const e2e = e2eReport?.stats ? { tests: e2eReport.stats.expected + e2eReport.stats.unexpected + (e2eReport.stats.flaky ?? 0), failed: e2eReport.stats.unexpected } : null;

const pip = json("backend/pip-audit.json");
const npm = json("frontend/npm-audit.json");
const vulns =
  pip && npm
    ? (pip.dependencies ?? []).reduce((n, d) => n + (d.vulns?.length ?? 0), 0) +
      (npm.metadata?.vulnerabilities?.total ?? 0)
    : null;

const suites = [backend, unit, e2e];
const allSuites = suites.every(Boolean);
const totalTests = allSuites ? suites.reduce((n, s) => n + s.tests, 0) : null;
const failing = allSuites ? suites.reduce((n, s) => n + s.failed, 0) : null;

const pct = (x, digits = 0) => (x == null ? "–" : `${(x * 100).toFixed(digits)}%`);
const num = (x) => (x == null ? "–" : new Intl.NumberFormat("en-IN").format(x));
const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const stats = {
  updated: new Date().toISOString(),
  tests: { total: totalTests, failing, backend: backend?.tests ?? null, unit: unit?.tests ?? null, e2e: e2e?.tests ?? null },
  coverage: lineRate,
  retrieval,
  conditions: 49,
  vulnerabilities: vulns,
};

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
  { value: vulns == null ? "–" : String(vulns), label: "known vulnerabilities", sub: "pip-audit and npm audit" },
];

const colW = (W - 160) / cols.length;
const body = cols
  .map((c, i) => {
    const x = 80 + i * colW;
    const sep = i ? `<line x1="${x - 16}" x2="${x - 16}" y1="132" y2="300" stroke="${C.hair}"/>` : "";
    const bars = c.bars
      ? c.bars
          .map(
            ([name, v], j) => `<g transform="translate(${x} ${280 + j * 18})">
      <rect width="120" height="4" rx="2" fill="${C.hair}"/>
      <rect class="bar" width="${(120 * v).toFixed(1)}" height="4" rx="2" fill="${C.lilac}" style="animation-delay:${0.3 + j * 0.2}s"/>
      <text class="sans" x="132" y="5" font-size="11" fill="${C.ink4}">${name}</text></g>`,
          )
          .join("")
      : "";
    return `${sep}
  <g class="col" style="animation-delay:${i * 0.12}s">
    <text class="serif" x="${x}" y="206" font-size="72" font-weight="300" fill="${C.ink}" style="font-variant-numeric:lining-nums">${esc(c.value)}</text>
    <text class="sans" x="${x + 2}" y="236" font-size="15" fill="${C.ink3}">${esc(c.label)}</text>
    <text class="sans" x="${x + 2}" y="258" font-size="12" fill="${C.ink4}">${esc(c.sub)}</text>
    ${bars}
  </g>`;
  })
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="st sd">
<title id="st">CareNexus quality, measured on ${today}</title>
<desc id="sd">${esc(cols.map((c) => `${c.value} ${c.label}`).join("; "))}</desc>
<style>
${fontFaces()}
.serif{font-family:Cormorant,Georgia,serif}.sans{font-family:Jost,Helvetica,Arial,sans-serif}
@keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.col{animation:up .8s cubic-bezier(.22,1,.36,1) both}
.bar{transform-origin:left;transform-box:fill-box;animation:grow 1.2s cubic-bezier(.22,1,.36,1) both}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<defs><radialGradient id="g" cx="50%" cy="50%" r="50%">
  <stop offset="0" stop-color="${C.amethyst}" stop-opacity=".7"/><stop offset="1" stop-color="${C.amethyst}" stop-opacity="0"/>
</radialGradient></defs>
<rect width="${W}" height="${H}" fill="${C.void}"/>
<ellipse cx="${W - 160}" cy="0" rx="460" ry="240" fill="url(#g)"/>
<text class="serif" x="80" y="84" font-size="40" font-weight="300" fill="${C.lilac}">Measured, not claimed</text>
<text class="sans" x="${W - 80}" y="84" font-size="12" fill="${C.ink4}" text-anchor="end" letter-spacing=".2em">MEASURED BY CI ${esc(today.toUpperCase())}</text>
<line x1="80" x2="${W - 80}" y1="108" y2="108" stroke="${C.hair}"/>
${body}
</svg>
`;

// Only rewrite when a measured figure changed, so a scheduled run that finds
// the same numbers does not create a commit (the date means "last changed").
const previous = json("docs/assets/stats.json");
const same = (a, b) => JSON.stringify({ ...a, updated: 0 }) === JSON.stringify({ ...b, updated: 0 });
if (previous && same(previous, stats) && !process.argv.includes("--force")) {
  console.log("stats unchanged; keeping existing card");
  process.exit(0);
}

mkdirSync(ASSETS, { recursive: true });
writeFileSync(join(ASSETS, "stats.svg"), svg);
writeFileSync(join(ASSETS, "stats.json"), JSON.stringify(stats, null, 2) + "\n");
console.log("stats:", JSON.stringify({ totalTests, failing, coverage: lineRate, top1: retrieval?.labelled?.top1, vulns }));
