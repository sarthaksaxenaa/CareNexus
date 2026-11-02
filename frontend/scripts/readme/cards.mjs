// Generates the README's designed panels, each in a dark and a light version:
//   features-{dark,light}.svg  four principles, figures read from stats.json
//   stack-{dark,light}.svg     the stack, versions read from the manifests
//   divider-{dark,light}.svg   a section rule with one heartbeat
// Run after stats.mjs: node scripts/readme/cards.mjs   (from frontend/)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ASSETS, REPO, THEMES, esc, svgDoc } from "./theme.mjs";

const W = 1280;

// ── Real figures ─────────────────────────────────────────────────────────────
const statsPath = join(ASSETS, "stats.json");
const stats = existsSync(statsPath) ? JSON.parse(readFileSync(statsPath, "utf8")) : {};
const pct = (x) => (x == null ? "–" : `${(x * 100).toFixed(x >= 0.995 ? 0 : 1)}%`);
const tests = stats.tests?.total ?? "–";
const coverage = pct(stats.coverage);
const heldout = pct(stats.retrieval?.heldout?.top1);
const conditions = stats.conditions ?? "–";

const pkg = JSON.parse(readFileSync(join(REPO, "frontend/package.json"), "utf8"));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
const major = (v) => (v ? String(v).replace(/^[^\d]*/, "").split(".")[0] : "");
const reqs = readFileSync(join(REPO, "backend/requirements.txt"), "utf8");
const pin = (name) => reqs.match(new RegExp(`^${name}==([\\d.]+)`, "im"))?.[1] ?? "";
const minor = (v) => v.split(".").slice(0, 2).join(".");

// ── Helpers ──────────────────────────────────────────────────────────────────
/** Greedy word wrap by an average glyph width; good enough for short copy. */
function wrap(text, maxChars) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if ((line + " " + word).trim().length > maxChars) {
      lines.push(line.trim());
      line = word;
    } else line += " " + word;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

// Line icons on a 40×40 grid, drawn here so nothing is borrowed.
const ICONS = {
  siren: `<path d="M10 30v-9a10 10 0 0 1 20 0v9"/><path d="M6 30h28"/><path d="M20 4v4M7 10l3 3M33 10l-3 3"/><path d="M17 22l3-4 3 4"/>`,
  search: `<circle cx="17" cy="17" r="10"/><path d="M24.5 24.5L34 34"/><path d="M12 17h3l2-4 3 8 2-4h3"/>`,
  offline: `<path d="M8 26a8 8 0 0 1 3-15.5A10 10 0 0 1 30 13a7 7 0 0 1 1 13.9"/><path d="M14 32l12-12M14 20l12 12"/>`,
  check: `<rect x="6" y="6" width="28" height="28" rx="7"/><path d="M13 20.5l5 5 9-11"/>`,
};

function features(t) {
  const items = [
    {
      icon: "siren",
      title: "Emergencies first",
      body: "Heart, breathing, stroke, crisis, collapse and bleeding are checked before anything else, in the words people actually type.",
      figure: "6",
      unit: "emergency categories",
    },
    {
      icon: "search",
      title: "Grounded answers",
      body: `Every reply is built from a curated library of ${conditions} ICD-10 conditions, searched with field-weighted TF-IDF.`,
      figure: heldout,
      unit: "first match, unseen",
    },
    {
      icon: "offline",
      title: "No AI key needed",
      body: "Runs fully offline. Gemini is optional and only rephrases what retrieval found; any failure falls back.",
      figure: "0",
      unit: "external calls required",
    },
    {
      icon: "check",
      title: "Tested like production",
      body: "Unit, API, browser and PostgreSQL suites run on every push; a drop in accuracy or coverage fails the build.",
      figure: String(tests),
      unit: `tests · ${coverage} coverage`,
    },
  ];
  const gap = 20;
  const cw = (W - gap * 3) / 4;
  const H = 372;
  const cards = items
    .map((it, i) => {
      const x = i * (cw + gap);
      const lines = wrap(it.body, 30);
      return `
  <g transform="translate(${x} 0)"><g class="card" style="animation-delay:${i * 0.12}s">
    <rect x=".5" y=".5" width="${cw - 1}" height="${H - 1}" rx="22" fill="${t.surface}" stroke="${t.hair2}"/>
    <rect x=".5" y=".5" width="${cw - 1}" height="${H - 1}" rx="22" fill="url(#sheen)"/>
    <text class="serif" x="28" y="52" font-size="18" font-style="italic" fill="${t.accent}">0${i + 1}</text>
    <g transform="translate(${cw - 68} 26)" fill="none" stroke="${t.accent}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[it.icon]}</g>
    <text class="serif" x="28" y="112" font-size="28" fill="${t.ink}">${esc(it.title)}</text>
    <text class="sans" font-size="16.5" fill="${t.ink3}">${lines.map((l, j) => `<tspan x="28" y="${148 + j * 25}">${esc(l)}</tspan>`).join("")}</text>
    <line x1="28" x2="${cw - 28}" y1="280" y2="280" stroke="${t.hair}"/>
    <text class="serif" x="28" y="322" font-size="42" font-weight="300" fill="${t.ink}">${esc(it.figure)}</text>
    <text class="sans track" x="28" y="341" font-size="12" fill="${t.ink4}">${esc(it.unit)}</text>
  </g></g>`;
    })
    .join("");
  return svgDoc({
    w: W,
    h: H,
    title: "Four principles",
    desc: items.map((it) => `${it.title}: ${it.body} ${it.figure} ${it.unit}.`).join(" "),
    css: `@keyframes in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.card{animation:in .8s cubic-bezier(.22,1,.36,1) both}`,
    body: `<defs><linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="${t.amethyst}" stop-opacity="${t.scheme === "dark" ? 0.35 : 0.55}"/>
  <stop offset=".55" stop-color="${t.amethyst}" stop-opacity="0"/>
</linearGradient></defs>${cards}`,
  });
}

function stack(t) {
  const groups = [
    ["Interface", [`Next.js ${major(deps.next)}`, `React ${major(deps.react)}`, `Tailwind ${major(deps.tailwindcss)}`, "three.js", "TypeScript"]],
    ["Service", [`FastAPI ${minor(pin("fastapi"))}`, `SQLAlchemy ${major(pin("sqlalchemy"))}`, `Pydantic ${major(pin("pydantic"))}`, "PyJWT", "bcrypt"]],
    ["Data & triage", ["PostgreSQL", "SQLite", "TF-IDF retrieval", "Gemini (optional)"]],
    ["Quality & delivery", ["pytest", "Vitest", "Playwright", "GitHub Actions", "Vercel", "Render", "Neon"]],
  ];
  const H = 262;
  let y = 0;
  const rows = groups
    .map(([label, items], gi) => {
      let x = 250;
      const chips = items
        .map((name) => {
          const w = name.length * 9.6 + 38;
          const chip = `<g transform="translate(${x} -24)"><rect width="${w}" height="38" rx="19" fill="${t.surface}" stroke="${t.hair2}"/><text class="sans" x="${w / 2}" y="25" font-size="16" fill="${t.ink}" text-anchor="middle">${esc(name)}</text></g>`;
          x += w + 10;
          return chip;
        })
        .join("");
      y = 40 + gi * 62;
      return `<g transform="translate(0 ${y})"><g class="row" style="animation-delay:${gi * 0.1}s">
    <text class="sans track" x="0" y="0" font-size="13" fill="${t.ink4}">${esc(label)}</text>${chips}
  </g></g>`;
    })
    .join("");
  return svgDoc({
    w: W,
    h: H,
    title: "Tech stack",
    desc: groups.map(([g, items]) => `${g}: ${items.join(", ")}.`).join(" "),
    css: `@keyframes in{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
.row{animation:in .7s cubic-bezier(.22,1,.36,1) both}`,
    body: rows,
  });
}

function divider(t) {
  const H = 48;
  const mid = W / 2;
  const y = 24;
  const beat = `M${mid - 60} ${y} L${mid - 22} ${y} L${mid - 16} ${y + 6} L${mid - 8} ${y - 18} L${mid} ${y + 10} L${mid + 6} ${y} L${mid + 60} ${y}`;
  return svgDoc({
    w: W,
    h: H,
    title: "Section divider",
    desc: "A thin rule with a single heartbeat in the middle.",
    css: `@keyframes draw{from{stroke-dashoffset:200}to{stroke-dashoffset:0}}
.beat{stroke-dasharray:200;animation:draw 1.6s cubic-bezier(.22,1,.36,1) both}`,
    body: `<defs><linearGradient id="rule" x1="0" x2="1">
  <stop offset="0" stop-color="${t.accent}" stop-opacity="0"/>
  <stop offset=".5" stop-color="${t.accent}" stop-opacity=".5"/>
  <stop offset="1" stop-color="${t.accent}" stop-opacity="0"/>
</linearGradient></defs>
<path d="M120 ${y} H${mid - 60} M${mid + 60} ${y} H${W - 120}" stroke="url(#rule)" stroke-width="1"/>
<path class="beat" d="${beat}" fill="none" stroke="${t.accent}" stroke-width="1.6" stroke-linejoin="round" pathLength="200"/>`,
  });
}

for (const t of THEMES) {
  for (const [name, fn] of [["features", features], ["stack", stack], ["divider", divider]]) {
    const svg = fn(t);
    writeFileSync(join(ASSETS, `${name}-${t.scheme}.svg`), svg);
    console.log(`${name}-${t.scheme}.svg  ${(svg.length / 1024).toFixed(0)} KB`);
  }
}
