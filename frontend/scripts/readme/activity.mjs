// Generates docs/assets/activity-{dark,light}.svg from the git history:
// commits per day since the first commit, and the share of each Conventional
// Commit type. Bot commits (asset refreshes, Dependabot) are left out.
// Needs full history: actions/checkout with fetch-depth: 0.
// Run: node scripts/readme/activity.mjs   (from frontend/)
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ASSETS, REPO, THEMES, esc, svgDoc } from "./theme.mjs";

const SEP = "\u001f";
const log = execFileSync("git", ["log", "--no-merges", `--format=%ad${SEP}%an${SEP}%s`, "--date=short"], {
  cwd: REPO,
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .map((line) => {
    const [date, author, subject] = line.split(SEP);
    return { date, author, subject };
  })
  .filter((c) => c.date && !/\[bot\]$/.test(c.author));

if (!log.length) {
  console.log("activity: no commits found; skipping");
  process.exit(0);
}

// ── Per day ──────────────────────────────────────────────────────────────────
const DAY = 86_400_000;
const toDay = (iso) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / DAY);
const first = Math.min(...log.map((c) => toDay(c.date)));
const last = Math.max(toDay(new Date().toISOString().slice(0, 10)), ...log.map((c) => toDay(c.date)));
const days = Array.from({ length: last - first + 1 }, () => 0);
for (const c of log) days[toDay(c.date) - first] += 1;
const activeDays = days.filter(Boolean).length;
const peak = Math.max(...days);

// ── Per type ─────────────────────────────────────────────────────────────────
const TYPES = ["feat", "fix", "test", "docs", "ci", "build", "refactor", "style", "perf", "chore"];
const typeOf = (subject) => subject.match(/^([a-z]+)(\([^)]*\))?!?:/)?.[1];
const counts = {};
let conventional = 0;
for (const c of log) {
  const t = typeOf(c.subject);
  if (t && TYPES.includes(t)) {
    conventional += 1;
    counts[t] = (counts[t] ?? 0) + 1;
  }
}
const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
const top = ranked.slice(0, 5);
const rest = ranked.slice(5).reduce((n, [, v]) => n + v, 0);
if (rest) top.push(["other", rest]);

const fmtDay = (d) =>
  new Date((first + d) * DAY).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

// ── Draw ─────────────────────────────────────────────────────────────────────
const W = 1280;
const H = 340;

function card(t) {
  // One hue in steps: green, amber and red are reserved for triage levels.
  const OPACITY = [1, 0.72, 0.52, 0.38, 0.26, 0.16];
  const shade = (i) => `fill="${t.accent}" fill-opacity="${OPACITY[i % OPACITY.length]}"`;
  // Timeline
  const x0 = 80;
  const x1 = 780;
  const base = 262;
  const maxH = 130;
  const step = (x1 - x0) / days.length;
  const bw = Math.max(3, Math.min(18, step * 0.62));
  const bars = days
    .map((n, i) => {
      const h = n ? Math.max(4, (n / peak) * maxH) : 2;
      const x = x0 + i * step + (step - bw) / 2;
      return `<rect class="bar" style="animation-delay:${(i * 0.015).toFixed(3)}s" x="${x.toFixed(1)}" y="${(base - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="${Math.min(3, bw / 2)}" fill="${n ? t.accent : t.hair}" fill-opacity="${n ? 0.35 + 0.65 * (n / peak) : 1}"><title>${fmtDay(i)}: ${n} commit${n === 1 ? "" : "s"}</title></rect>`;
    })
    .join("");
  const tickEvery = Math.max(1, Math.round(days.length / 6));
  const ticks = days
    .map((_, i) => i)
    .filter((i) => i % tickEvery === 0 || i === days.length - 1)
    .map((i) => `<text class="sans" x="${(x0 + i * step + step / 2).toFixed(1)}" y="${base + 24}" font-size="13" fill="${t.ink4}" text-anchor="middle">${esc(fmtDay(i))}</text>`)
    .join("");

  // Figures and type split
  const fx = 860;
  const figures = [
    [String(log.length), "commits"],
    [String(activeDays), "active days"],
    [`${Math.round((conventional / log.length) * 100)}%`, "conventional"],
  ]
    .map(
      ([v, l], i) => `<g transform="translate(${fx + i * 118} 172)"><g class="fig" style="animation-delay:${0.2 + i * 0.1}s">
    <text class="serif" x="0" y="0" font-size="46" font-weight="300" fill="${t.ink}">${esc(v)}</text>
    <text class="sans track" x="1" y="26" font-size="12" fill="${t.ink4}">${esc(l)}</text></g></g>`,
    )
    .join("");
  const splitW = 340;
  let acc = 0;
  const split = top
    .map(([type, n], i) => {
      const w = (n / conventional) * splitW;
      const seg = `<rect class="seg" style="animation-delay:${0.4 + i * 0.08}s" x="${(fx + acc).toFixed(1)}" y="226" width="${Math.max(0, w - 2).toFixed(1)}" height="8" rx="4" ${shade(i)}><title>${type}: ${n}</title></rect>`;
      acc += w;
      return seg;
    })
    .join("");
  const legend = top
    .map(
      ([type, n], i) => `<g transform="translate(${fx + (i % 3) * 118} ${262 + Math.floor(i / 3) * 26})">
    <circle cx="4" cy="-4" r="4" ${shade(i)}/>
    <text class="sans" x="14" y="0" font-size="14.5" fill="${t.ink3}">${esc(type)} <tspan fill="${t.ink4}">${n}</tspan></text></g>`,
    )
    .join("");

  return svgDoc({
    w: W,
    h: H,
    title: "Commit activity",
    desc:
      `${log.length} commits on ${activeDays} of ${days.length} days since ${fmtDay(0)}, bots excluded; ` +
      `${Math.round((conventional / log.length) * 100)}% follow Conventional Commits (` +
      ranked.map(([k, v]) => `${k} ${v}`).join(", ") +
      ").",
    css: `@keyframes grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes wide{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.bar{transform-box:fill-box;transform-origin:bottom;animation:grow .9s cubic-bezier(.22,1,.36,1) both}
.fig{animation:in .8s cubic-bezier(.22,1,.36,1) both}
.seg{transform-box:fill-box;transform-origin:left;animation:wide .8s cubic-bezier(.22,1,.36,1) both}`,
    body: `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="24" fill="${t.void}" stroke="${t.hair}"/>
<text class="serif" x="80" y="78" font-size="36" font-weight="300" fill="${t.accent}">Built in the open</text>
<text class="sans" x="82" y="106" font-size="15" fill="${t.ink4}">Commits to main per day since ${esc(fmtDay(0))}, bots excluded</text>
<line x1="${x0}" x2="${x1}" y1="${base}" y2="${base}" stroke="${t.hair2}"/>
${bars}
${ticks}
<line x1="820" x2="820" y1="56" y2="${H - 40}" stroke="${t.hair}"/>
<text class="sans track" x="${fx}" y="78" font-size="12" fill="${t.ink4}">Atomic, typed commits</text>
<text class="sans" x="${fx}" y="106" font-size="15" fill="${t.ink4}">Conventional Commits: feat, fix, test, docs…</text>
${figures}
${split}
${legend}`,
  });
}

for (const t of THEMES) {
  const svg = card(t);
  writeFileSync(join(ASSETS, `activity-${t.scheme}.svg`), svg);
  console.log(`activity-${t.scheme}.svg  ${(svg.length / 1024).toFixed(0)} KB`);
}
console.log(`activity: ${log.length} commits, ${activeDays}/${days.length} days, ${conventional} conventional`);
