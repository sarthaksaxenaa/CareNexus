// Generates docs/assets/banner-dark.svg and banner-light.svg: the animated
// README header. The three assessments it plays are real outputs of the
// offline engine for these exact messages (level and closest match).
// Run: node scripts/readme/banner.mjs   (from frontend/)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ASSETS, REPO, THEMES, esc, svgDoc } from "./theme.mjs";

const pkg = JSON.parse(readFileSync(join(REPO, "frontend/package.json"), "utf8"));
const W = 1280;
const H = 540;
const CYCLE = 15; // seconds for all three scenes

const SCENES = [
  {
    quote: ["Mild headache since this morning,", "a little tired."],
    level: "Self-care",
    tone: "green",
    match: "Tension headache · ICD-10 G44.2",
    advice: "Rest, fluids, and the signs to watch for.",
  },
  {
    quote: ["Burning when I urinate and", "a fever since yesterday."],
    level: "See a doctor",
    tone: "amber",
    match: "Urinary tract infection · ICD-10 N39.0",
    advice: "Book an appointment in the next day or two.",
  },
  {
    quote: ["Crushing pain in my chest,", "spreading to my left arm."],
    level: "Emergency",
    tone: "red",
    match: "Emergency rule · possible cardiac event",
    advice: "Call your local emergency number now.",
  },
];

// One heartbeat, repeated across the width: flat, P wave, QRS spike, T wave.
function ecgPath(width, y, beat = 160) {
  let d = `M0 ${y}`;
  for (let x = 0; x < width; x += beat) {
    d +=
      ` L${x + 40} ${y} q6 -7 12 0 L${x + 64} ${y}` + // P
      ` L${x + 70} ${y + 8} L${x + 78} ${y - 46} L${x + 86} ${y + 18} L${x + 92} ${y}` + // QRS
      ` L${x + 108} ${y} q10 -14 20 0 L${x + beat} ${y}`; // T
  }
  return d;
}

function banner(t) {
  const dark = t.scheme === "dark";
  const cardX = 700;
  const cardY = 92;
  const cardW = 492;
  const cardH = 330;

  const scenes = SCENES.map((s, i) => {
    const color = t[s.tone];
    const delay = `${(i * CYCLE) / 3}s`;
    const bubbleW = 372;
    return `
  <g class="scene s${i + 1}" style="animation-delay:${delay}">
    <!-- message -->
    <g transform="translate(${cardW - 28 - bubbleW} 70)">
      <rect width="${bubbleW}" height="88" rx="18" fill="${t.raised}" stroke="${t.hair}"/>
      <clipPath id="type${t.scheme}${i}"><rect class="type" style="animation-delay:${delay}" x="0" y="0" width="${bubbleW}" height="88"/></clipPath>
      <g clip-path="url(#type${t.scheme}${i})">
        <text class="serif" font-style="italic" font-size="24" fill="${t.ink}">
          <tspan x="24" y="38">“${esc(s.quote[0])}</tspan><tspan x="24" y="68">${esc(s.quote[1])}”</tspan>
        </text>
      </g>
    </g>
    <!-- verdict -->
    <g transform="translate(28 190)"><g class="verdict" style="animation-delay:${delay}">
      <rect width="${s.level.length * 13 + 66}" height="36" rx="18" fill="${color}" fill-opacity="${dark ? 0.14 : 0.1}" stroke="${color}" stroke-opacity=".55"/>
      <circle class="beat" cx="22" cy="18" r="5" fill="${color}"/>
      <text class="sans track" x="38" y="23" font-size="13" font-weight="500" fill="${color}">${esc(s.level)}</text>
      <text class="sans" x="0" y="72" font-size="16" fill="${t.ink}">${esc(s.advice)}</text>
      <text class="sans" x="0" y="100" font-size="14.5" fill="${t.ink4}" letter-spacing=".02em">${esc(s.match)}</text>
    </g></g>
  </g>`;
  }).join("");

  const legend = SCENES.map(
    (s, i) => `
    <g class="chip c${i + 1}" style="animation-delay:${(i * CYCLE) / 3}s" transform="translate(${i * 178} 0)">
      <circle cx="6" cy="-5" r="5" fill="${t[s.tone]}"/>
      <text class="sans track" x="22" y="0" font-size="12.5" fill="${t.ink}">${esc(s.level)}</text>
    </g>`,
  ).join("");

  const body = `
<defs>
  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="${t.amethyst}" stop-opacity="${dark ? 0.95 : 0.9}"/>
    <stop offset="1" stop-color="${t.amethyst}" stop-opacity="0"/>
  </radialGradient>
  <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="1" fill="${t.hair2}"/>
  </pattern>
  <radialGradient id="fadeDots" cx="70%" cy="40%" r="70%">
    <stop offset="0" stop-color="#fff" stop-opacity=".9"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
  <mask id="dotMask"><rect width="${W}" height="${H}" fill="url(#fadeDots)"/></mask>
  <linearGradient id="ecgFade" x1="0" x2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/>
    <stop offset=".12" stop-color="#fff" stop-opacity="1"/>
    <stop offset=".88" stop-color="#fff" stop-opacity="1"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <mask id="ecgMask"><rect width="${W}" height="${H}" fill="url(#ecgFade)"/></mask>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="${t.void}"/>
<rect width="${W}" height="${H}" fill="url(#dots)" mask="url(#dotMask)"/>
<ellipse class="glow" cx="${cardX + cardW / 2}" cy="250" rx="430" ry="330" fill="url(#glow)"/>

<!-- Wordmark -->
<g transform="translate(88 0)">
  <text class="sans track r1" x="4" y="120" font-size="12.5" fill="${t.accent}">Symptom triage · v${esc(pkg.version)}</text>
  <text class="serif r1" x="0" y="222" font-size="116" font-weight="300" fill="${t.ink}" letter-spacing="-2">Care<tspan font-style="italic" fill="${t.accent}">Nexus</tspan></text>
  <text class="serif r2" x="4" y="280" font-size="35" font-style="italic" font-weight="300" fill="${t.ink3}">A clearer kind of care.</text>
  <text class="sans r3" x="5" y="330" font-size="17" fill="${t.ink3}">
    <tspan x="5">Describe what you feel. Learn how urgently to get</tspan><tspan x="5" dy="26">care, and what to do in the meantime.</tspan>
  </text>
  <g transform="translate(5 430)"><g class="r4">
    <line x1="0" x2="520" y1="-34" y2="-34" stroke="${t.hair}"/>${legend}
  </g></g>
</g>

<!-- Assessment card -->
<g transform="translate(${cardX} ${cardY})">
  <g class="r3">
    <rect width="${cardW}" height="${cardH}" rx="24" fill="${t.surface}" fill-opacity="${dark ? 0.82 : 0.92}" stroke="${t.hair2}"/>
    <circle class="live" cx="32" cy="36" r="4" fill="${t.accent}"/>
    <text class="sans track" x="46" y="40" font-size="12" fill="${t.ink4}">Assessment</text>
    <text class="sans" x="${cardW - 28}" y="40" font-size="13" fill="${t.ink4}" text-anchor="end" letter-spacing=".02em">offline engine · no AI key needed</text>
    <line x1="28" x2="${cardW - 28}" y1="56" y2="56" stroke="${t.hair}"/>
    ${scenes}
  </g>
</g>

<!-- Heartbeat -->
<g mask="url(#ecgMask)">
  <path d="${ecgPath(W, 492)}" fill="none" stroke="${t.hair2}" stroke-width="1.5"/>
  <path class="ecg" d="${ecgPath(W, 492)}" fill="none" stroke="${t.accent}" stroke-width="2.2" stroke-linejoin="round" pathLength="1000"/>
  <path class="ecg" d="${ecgPath(W, 492)}" fill="none" stroke="${t.accent}" stroke-width="6" stroke-opacity=".35" filter="url(#soft)" pathLength="1000"/>
</g>`;

  const css = `
@keyframes drift{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-36px,16px) scale(1.07)}}
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes scene{0%{opacity:0;transform:translateY(10px)}3%,30%{opacity:1;transform:none}33.3%,100%{opacity:0;transform:translateY(-6px)}}
@keyframes type{0%,2%{transform:scaleX(0)}12%,100%{transform:scaleX(1)}}
@keyframes verdict{0%,13%{opacity:0;transform:translateY(8px)}16%,100%{opacity:1;transform:none}}
@keyframes chip{0%,100%{opacity:.32}3%,30%{opacity:1}33.3%{opacity:.32}}
@keyframes ecg{from{stroke-dashoffset:1000}to{stroke-dashoffset:0}}
@keyframes beat{0%,100%{transform:scale(1)}10%{transform:scale(1.6)}20%{transform:scale(1)}}
@keyframes live{0%,100%{opacity:1}50%{opacity:.25}}
.glow{animation:drift 18s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.r1{animation:rise .9s cubic-bezier(.22,1,.36,1) both}
.r2{animation:rise .9s .15s cubic-bezier(.22,1,.36,1) both}
.r3{animation:rise .9s .3s cubic-bezier(.22,1,.36,1) both}
.r4{animation:rise .9s .45s cubic-bezier(.22,1,.36,1) both}
.scene{opacity:0;animation:scene ${CYCLE}s cubic-bezier(.22,1,.36,1) infinite both}
.s1{opacity:1}
.type{transform-box:fill-box;transform-origin:left;animation:type ${CYCLE}s steps(28,end) infinite both}
.verdict{animation:verdict ${CYCLE}s cubic-bezier(.22,1,.36,1) infinite both}
.chip{animation:chip ${CYCLE}s ease-in-out infinite both}
.c1{opacity:1}
.ecg{stroke-dasharray:240 760;animation:ecg 5s linear infinite}
.beat{transform-box:fill-box;transform-origin:center;animation:beat 1.2s ease-out infinite}
.live{animation:live 2.4s ease-in-out infinite}`;

  return svgDoc({
    w: W,
    h: H,
    title: "CareNexus: a clearer kind of care",
    desc:
      "Animated header. Three real assessments play in turn: a mild headache graded self-care (tension headache), " +
      "burning urination with fever graded see a doctor (urinary tract infection), and crushing chest pain graded emergency.",
    css,
    body,
  });
}

mkdirSync(ASSETS, { recursive: true });
for (const t of THEMES) {
  const svg = banner(t);
  writeFileSync(join(ASSETS, `banner-${t.scheme}.svg`), svg);
  console.log(`banner-${t.scheme}.svg  ${(svg.length / 1024).toFixed(0)} KB`);
}
