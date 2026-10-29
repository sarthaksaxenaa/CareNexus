// Captures README screenshots and a demo GIF from the running app.
//
// Needs the API on :8000 and the web app on BASE_URL (default :3000), e.g.
// the production build started with `npm run start`. Writes:
//   docs/assets/screenshots/*.png   docs/assets/demo.gif
// Requires ffmpeg on PATH for the GIF.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { ASSETS } from "./theme.mjs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOTS = join(ASSETS, "screenshots");
mkdirSync(SHOTS, { recursive: true });

// Software WebGL so the 3D body map renders on machines without a GPU (CI).
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});

// A fixed timezone keeps times in the screenshots the same wherever this runs
// (CI runners use UTC). Override with README_TIMEZONE.
const timezoneId = process.env.README_TIMEZONE ?? "Asia/Kolkata";
const DESKTOP = { viewport: { width: 1440, height: 900 }, colorScheme: "dark", timezoneId };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name, opts = {}) {
  await pause(opts.wait ?? 900);
  await page.screenshot({ path: join(SHOTS, `${name}.png`), ...opts.screenshot });
  console.log(`  ${name}.png`);
}

/** Wait for the newest assistant reply after sending. */
async function waitForReplies(page, n) {
  await page.locator("article").nth(n - 1).waitFor({ timeout: 20_000 });
  await pause(700);
}

// ── 1. A demo account with a profile and two checks ─────────────────────────
console.log("screenshots");
const ctx = await browser.newContext(DESKTOP);
const page = await ctx.newPage();

await page.goto(`${BASE}/`);
await shot(page, "home");

await page.goto(`${BASE}/register`);
await shot(page, "register", { wait: 600 });
await page.getByLabel("Full name").fill("Asha Verma");
await page.getByLabel("Email").fill(`asha.${Date.now()}@example.com`);
await page.getByLabel("Password").fill("SecurePass#123");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL("**/chat");
await shot(page, "chat-empty");

await page.goto(`${BASE}/profile`);
await page.getByLabel("Age").fill("58");
await page.getByLabel("Sex").selectOption("Female");
await page.getByLabel("Known conditions").fill("Type 2 diabetes, high blood pressure");
await page.getByLabel("Blood group").selectOption("B+");
await page.getByRole("button", { name: "Create profile" }).click();
await page.getByText("Profile created.").waitFor();
await shot(page, "profile");

await page.goto(`${BASE}/chat`);
await page.getByRole("button", { name: "Headache" }).click();
await waitForReplies(page, 1);
await page.getByLabel("Describe your symptoms").fill("Crushing chest pain spreading to my left arm and I'm sweating");
await page.getByRole("button", { name: "Send" }).click();
await waitForReplies(page, 2);
await page.getByRole("button", { name: "Body map" }).click();
await shot(page, "chat", { wait: 3500 }); // 3D figure needs a moment to render

await page.goto(`${BASE}/dashboard`);
await shot(page, "dashboard", { wait: 1200 });

await page.goto(`${BASE}/about`);
await shot(page, "about");

const state = await ctx.storageState();
await ctx.close();

// ── 2. Phone screenshots ────────────────────────────────────────────────────
const phone = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  colorScheme: "dark",
  timezoneId,
  storageState: state,
});
const m = await phone.newPage();
await m.goto(`${BASE}/`);
await shot(m, "mobile-home");
await m.goto(`${BASE}/chat`);
await shot(m, "mobile-chat");
await phone.close();

// ── 3. Demo GIF ─────────────────────────────────────────────────────────────
console.log("demo.gif");
const videoDir = mkdtempSync(join(tmpdir(), "carenexus-demo-"));
const rec = await browser.newContext({
  ...DESKTOP,
  viewport: { width: 1280, height: 800 },
  storageState: state,
  recordVideo: { dir: videoDir, size: { width: 1280, height: 800 } },
});
// Headless browsers draw no pointer, so show one that follows the mouse.
await rec.addInitScript(() => {
  addEventListener("DOMContentLoaded", () => {
    const dot = document.createElement("div");
    dot.style.cssText =
      "position:fixed;z-index:2147483647;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;" +
      "border:2px solid #c7a8f0;background:rgba(199,168,240,.18);pointer-events:none;left:-40px;top:-40px;" +
      "transition:transform .12s ease";
    document.body.appendChild(dot);
    addEventListener("mousemove", (e) => {
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;
    }, true);
    addEventListener("mousedown", () => (dot.style.transform = "scale(.7)"), true);
    addEventListener("mouseup", () => (dot.style.transform = "scale(1)"), true);
  });
});
const d = await rec.newPage();
const point = async (locator) => {
  const box = await locator.boundingBox();
  await d.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 18 });
  await pause(250);
};
const click = async (locator) => {
  await point(locator);
  await d.mouse.down();
  await d.mouse.up();
};

await d.goto(`${BASE}/chat`);
await d.getByRole("button", { name: "New check" }).click();
await d.mouse.move(700, 300);
await pause(1200);
await click(d.getByRole("button", { name: "Fever" }));
await d.locator("article").first().waitFor({ timeout: 20_000 });
await pause(2200);
const input = d.getByLabel("Describe your symptoms");
await click(input);
await input.pressSequentially("Sudden weakness on one side of my face and slurred speech", { delay: 28 });
await pause(300);
await click(d.getByRole("button", { name: "Send" }));
await d.locator("article").nth(1).waitFor({ timeout: 20_000 });
await pause(2600);
await click(d.getByRole("button", { name: "Body map" }));
await pause(2800);
await click(d.getByRole("tab", { name: "List" }));
await click(d.getByRole("button", { name: "Knee", exact: true }));
await pause(1600);
await click(d.getByRole("link", { name: "Dashboard" }));
await d.waitForURL("**/dashboard");
await pause(2600);
await rec.close(); // flushes the video
await browser.close();

const webm = readdirSync(videoDir).find((f) => f.endsWith(".webm"));
const gif = join(ASSETS, "demo.gif");
// Two-pass palette keeps the dark gradients from banding.
execFileSync("ffmpeg", [
  "-y", "-loglevel", "error", "-i", join(videoDir, webm),
  "-vf", "fps=10,scale=900:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle",
  "-loop", "0", gif,
]);
rmSync(videoDir, { recursive: true, force: true });
console.log(`  demo.gif ${(statSync(gif).size / 1024 / 1024).toFixed(1)} MB`);
