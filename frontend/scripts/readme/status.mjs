// Generates docs/assets/status-{dark,light}.svg (+ status.json) by probing the
// live deployment: API health and latency, the browser's CORS preflight from
// the web origin, and the web app itself. Nothing is assumed: a probe that
// fails is shown as failed, and the workflow carries on.
//
//   STATUS_API_URL  default https://carenexus-api.onrender.com
//   STATUS_WEB_URL  default https://carenexus-health.vercel.app
// Run: node scripts/readme/status.mjs   (from frontend/)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ASSETS, THEMES, esc, svgDoc } from "./theme.mjs";

const API = (process.env.STATUS_API_URL ?? "https://carenexus-api.onrender.com").replace(/\/$/, "");
const WEB = (process.env.STATUS_WEB_URL ?? "https://carenexus-health.vercel.app").replace(/\/$/, "");
const SAMPLES = 15;

async function timed(url, init = {}, timeoutMs = 15_000) {
  const start = performance.now();
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    const body = await res.text();
    return { ok: res.ok, status: res.status, ms: performance.now() - start, body, headers: res.headers };
  } catch (error) {
    return { ok: false, status: 0, ms: performance.now() - start, error: String(error.cause?.code ?? error.name) };
  }
}

const quantile = (xs, q) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil(q * s.length) - 1)];
};

// ── Probe ────────────────────────────────────────────────────────────────────
// The free API instance sleeps when idle, so the first call may wake it.
const first = await timed(`${API}/health`, {}, 120_000);
let version = null;
try {
  version = JSON.parse(first.body ?? "{}").version ?? null;
} catch {}

const samples = [];
if (first.ok) {
  for (let i = 0; i < SAMPLES; i++) {
    const r = await timed(`${API}/health`);
    if (r.ok) samples.push(r.ms);
  }
}

const preflight = await timed(`${API}/api/v1/auth/login`, {
  method: "OPTIONS",
  headers: { Origin: WEB, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type" },
});
const corsOk = preflight.ok && preflight.headers?.get("access-control-allow-origin") === WEB;

const web = await timed(WEB, {}, 30_000);
const webOk = web.ok && /CareNexus/.test(web.body ?? "");

const p50 = quantile(samples, 0.5);
const p95 = quantile(samples, 0.95);
const checks = [first.ok, samples.length === SAMPLES, corsOk, webOk];
const state = checks.every(Boolean) ? "operational" : checks.some(Boolean) ? "degraded" : "unreachable";

const status = {
  checked: new Date().toISOString(),
  state,
  api: { url: API, ok: first.ok, version, firstMs: Math.round(first.ms), p50Ms: p50 && Math.round(p50), p95Ms: p95 && Math.round(p95), samples: samples.map(Math.round) },
  cors: { ok: corsOk, status: preflight.status },
  web: { url: WEB, ok: webOk, status: web.status, ms: Math.round(web.ms) },
};

// ── Draw ─────────────────────────────────────────────────────────────────────
const W = 1280;
const H = 264;
const ms = (x) => (x == null ? "–" : x >= 1000 ? `${(x / 1000).toFixed(1)} s` : `${Math.round(x)} ms`);
const when = new Date(status.checked).toLocaleString("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});
const host = (u) => u.replace(/^https?:\/\//, "");

function card(t) {
  const tone = { operational: t.green, degraded: t.amber, unreachable: t.red }[state];
  const label = { operational: "All systems operational", degraded: "Partly degraded", unreachable: "Unreachable" }[state];
  const metrics = [
    [ms(p50), "API median", `${samples.length} warm requests`],
    [ms(p95), "API p95", "same sample"],
    [ms(first.ms), "first request", first.ms > 5000 ? "woke from sleep" : "already awake"],
    [web.status ? String(web.status) : "–", "web app", corsOk ? "CORS preflight ok" : "CORS preflight failed"],
  ]
    .map(
      ([v, l, sub], i) => `<g transform="translate(${480 + i * 172} 112)"><g class="fig" style="animation-delay:${0.15 + i * 0.08}s">
    <text class="serif" x="0" y="0" font-size="42" font-weight="300" fill="${t.ink}">${esc(v)}</text>
    <text class="sans track" x="1" y="26" font-size="12" fill="${t.ink4}">${esc(l)}</text>
    <text class="sans" x="1" y="48" font-size="14" fill="${t.ink3}">${esc(sub)}</text></g></g>`,
    )
    .join("");

  // Sparkline of the warm samples
  const sx = 480;
  const sw = 690;
  const sy = 228;
  const sh = 22;
  const max = Math.max(...samples, 1);
  const pts = samples.map((v, i) => `${(sx + (i / Math.max(1, samples.length - 1)) * sw).toFixed(1)},${(sy - (v / max) * sh).toFixed(1)}`);
  const spark = samples.length > 1
    ? `<polyline class="spark" points="${pts.join(" ")}" fill="none" stroke="${t.accent}" stroke-width="1.6" stroke-linejoin="round" pathLength="100"/>`
    : "";

  return svgDoc({
    w: W,
    h: H,
    title: `Production status: ${label}`,
    desc:
      `Checked ${when} UTC by CI. API ${host(API)} ${first.ok ? `healthy, version ${version}` : "not responding"}; ` +
      `median ${ms(p50)}, p95 ${ms(p95)}, first request ${ms(first.ms)}. ` +
      `Web app ${host(WEB)} HTTP ${web.status || "no response"}; CORS preflight ${corsOk ? "accepted" : "failed"}.`,
    css: `@keyframes in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes ping{0%{transform:scale(1);opacity:.6}80%,100%{transform:scale(3.2);opacity:0}}
@keyframes draw{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}
.fig{animation:in .8s cubic-bezier(.22,1,.36,1) both}
.ping{transform-box:fill-box;transform-origin:center;animation:ping 2.2s cubic-bezier(0,0,.2,1) infinite}
.spark{stroke-dasharray:100;animation:draw 1.6s .4s cubic-bezier(.22,1,.36,1) both}`,
    body: `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="24" fill="${t.void}" stroke="${t.hair}"/>
<g transform="translate(80 92)">
  <circle class="ping" cx="8" cy="-10" r="8" fill="${tone}"/>
  <circle cx="8" cy="-10" r="8" fill="${tone}"/>
  <text class="serif" x="32" y="0" font-size="36" font-weight="300" fill="${t.ink}">Production</text>
  <text class="sans" x="2" y="36" font-size="17" fill="${tone}">${esc(label)}</text>
  <text class="sans" x="2" y="72" font-size="15" fill="${t.ink3}">${esc(host(WEB))}</text>
  <text class="sans" x="2" y="96" font-size="15" fill="${t.ink3}">${esc(host(API))}${version ? ` · v${esc(version)}` : ""}</text>
  <text class="sans track" x="2" y="132" font-size="12" fill="${t.ink4}">Probed by CI · ${esc(when)} UTC</text>
</g>
<line x1="440" x2="440" y1="40" y2="${H - 40}" stroke="${t.hair}"/>
${metrics}
<line x1="${sx}" x2="${sx + sw}" y1="${sy}" y2="${sy}" stroke="${t.hair}"/>
${spark}`,
  });
}

// Latency differs on every run; only rewrite when the picture really changed
// (state, version, CORS, web) or the last check is a week old, so pushes do
// not each produce a bot commit.
const prevPath = join(ASSETS, "status.json");
const prev = existsSync(prevPath) ? JSON.parse(readFileSync(prevPath, "utf8")) : null;
const fingerprint = (s) => JSON.stringify([s.state, s.api.version, s.cors.ok, s.web.ok, s.web.status]);
const stale = !prev || Date.now() - Date.parse(prev.checked) > 6.5 * 86_400_000;
if (prev && !stale && fingerprint(prev) === fingerprint(status) && !process.argv.includes("--force")) {
  console.log(`status unchanged (${state}); keeping the card from ${prev.checked}`);
  process.exit(0);
}
for (const t of THEMES) writeFileSync(join(ASSETS, `status-${t.scheme}.svg`), card(t));
writeFileSync(join(ASSETS, "status.json"), JSON.stringify(status, null, 2) + "\n");
console.log("status:", JSON.stringify({ state, version, firstMs: status.api.firstMs, p50: status.api.p50Ms, p95: status.api.p95Ms, cors: corsOk, web: web.status }));
