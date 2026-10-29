// Generates docs/assets/banner.svg: the animated README header.
// Run: node scripts/readme/banner.mjs   (from frontend/)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ASSETS, C, REPO, fontFaces } from "./theme.mjs";

const pkg = JSON.parse(readFileSync(join(REPO, "frontend/package.json"), "utf8"));
const W = 1280;
const H = 440;

const levels = [
  ["Self-care", C.green],
  ["See a doctor", C.amber],
  ["Emergency", C.red],
];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
<title id="t">CareNexus</title>
<desc id="d">A symptom triage assistant. Describe what you feel and learn how urgently to get care: self-care, see a doctor, or emergency.</desc>
<style>
${fontFaces()}
.serif{font-family:Cormorant,Georgia,serif}
.sans{font-family:Jost,Helvetica,Arial,sans-serif}
.track{letter-spacing:.28em;text-transform:uppercase}
@keyframes drift{0%{transform:translate(0,0) scale(1)}50%{transform:translate(-40px,18px) scale(1.08)}100%{transform:translate(0,0) scale(1)}}
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes pulse{0%,100%{opacity:.35}12%,30%{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
.glow{animation:drift 18s ease-in-out infinite;transform-origin:center;transform-box:fill-box}
.r1{animation:rise .9s cubic-bezier(.22,1,.36,1) both}
.r2{animation:rise .9s .15s cubic-bezier(.22,1,.36,1) both}
.r3{animation:rise .9s .3s cubic-bezier(.22,1,.36,1) both}
.r4{animation:rise .9s .45s cubic-bezier(.22,1,.36,1) both}
.lv{animation:pulse 6s ease-in-out infinite}
.lv1{animation-delay:0s}.lv2{animation-delay:2s}.lv3{animation-delay:4s}
.orbit{animation:spin 60s linear infinite;transform-origin:center;transform-box:fill-box}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<defs>
  <radialGradient id="g" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="${C.amethyst}" stop-opacity=".95"/>
    <stop offset="1" stop-color="${C.amethyst}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="sphere" cx="35%" cy="30%" r="75%">
    <stop offset="0" stop-color="${C.amethyst500}"/>
    <stop offset=".55" stop-color="${C.amethyst}"/>
    <stop offset="1" stop-color="${C.void}"/>
  </radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="${C.void}"/>
<ellipse class="glow" cx="980" cy="220" rx="420" ry="360" fill="url(#g)"/>

<!-- Specimen: one real assessment, as on the home page -->
<g transform="translate(985 220)">
  <circle r="182" fill="none" stroke="${C.hair}"/>
  <g class="orbit"><circle r="150" fill="none" stroke="${C.hair}" stroke-dasharray="2 9"/></g>
  <circle r="118" fill="url(#sphere)"/>
  <text class="serif" font-style="italic" font-size="25" fill="${C.ink}" text-anchor="middle">
    <tspan x="0" y="-16">“Crushing pain in</tspan><tspan x="0" y="16">my chest, spreading</tspan><tspan x="0" y="48">to my left arm.”</tspan>
  </text>
</g>

<!-- Wordmark and line -->
<g transform="translate(88 0)">
  <text class="serif r1" x="0" y="168" font-size="108" font-weight="300" fill="${C.ink}" letter-spacing="-2">Care<tspan font-style="italic" fill="${C.lilac}">Nexus</tspan></text>
  <text class="serif r2" x="4" y="226" font-size="34" font-style="italic" font-weight="300" fill="${C.ink3}">A clearer kind of care.</text>
  <text class="sans track r3" x="6" y="270" font-size="13" fill="${C.ink4}">Symptom triage that works offline<tspan text-transform="none" style="text-transform:none" letter-spacing=".12em" dx="22">v${pkg.version}</tspan></text>
  <!-- Position and animation on separate groups: a CSS transform animation
       would otherwise replace the SVG transform attribute. -->
  <g transform="translate(6 330)"><g class="r4">
    <line x1="0" x2="560" y1="-30" y2="-30" stroke="${C.hair}"/>
${levels
  .map(
    ([label, color], i) => `    <g class="lv lv${i + 1}" transform="translate(${i * 190} 0)">
      <circle cx="5" cy="-5" r="5" fill="${color}"/>
      <text class="sans track" x="20" y="0" font-size="13" fill="${C.ink}">${label}</text>
    </g>`,
  )
  .join("\n")}
  </g></g>
</g>
</svg>
`;

mkdirSync(ASSETS, { recursive: true });
writeFileSync(join(ASSETS, "banner.svg"), svg);
console.log(`banner.svg  ${(svg.length / 1024).toFixed(0)} KB`);
