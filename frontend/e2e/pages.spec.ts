import { expect, test } from "@playwright/test";

const PAGES = [
  ["/", "A Clearer"],
  ["/about", "How CareNexus decides"],
  ["/login", "Welcome back"],
  ["/register", "Begin here"],
  ["/chat", "What are you feeling?"],
] as const;

for (const [path, heading] of PAGES) {
  test(`${path} renders without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto(path);
    await expect(page.getByRole("heading", { name: new RegExp(heading) }).first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("unknown pages show the themed 404", async ({ page }) => {
  const res = await page.goto("/definitely-not-a-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This page does not exist" })).toBeVisible();
});

test("the layout has no horizontal scroll on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  for (const path of ["/", "/about", "/chat", "/register"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${path} overflows by ${overflow}px`).toBeLessThanOrEqual(0);
  }
});
