import { expect, test, type Page } from "@playwright/test";
import { register } from "./helpers";

const panel = (page: Page) => page.getByRole("complementary", { name: "Body map panel" });
const toggle = (page: Page) => page.getByRole("button", { name: "Body map", exact: true });

async function openMap(page: Page) {
  await toggle(page).click();
  await expect(panel(page)).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await register(page);
});

test("the × button closes the body map and returns focus", async ({ page }) => {
  await openMap(page);
  await panel(page).getByRole("button", { name: "Close body map" }).click();
  await expect(panel(page)).toHaveCount(0);
  await expect(toggle(page)).toBeFocused();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
});

test("Escape closes the body map", async ({ page }) => {
  await openMap(page);
  await page.keyboard.press("Escape");
  await expect(panel(page)).toHaveCount(0);
});

test("on a phone, tapping outside the panel closes it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openMap(page);
  await page.getByRole("button", { name: "Close body map overlay" }).click({ position: { x: 20, y: 400 } });
  await expect(panel(page)).toHaveCount(0);
});

test("the close button is reachable on a phone, where the panel covers the header", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openMap(page);
  const close = panel(page).getByRole("button", { name: "Close body map" });
  await expect(close).toBeInViewport();
  await close.click();
  await expect(panel(page)).toHaveCount(0);
});

test("switch from 3D to list and back, both ways", async ({ page }) => {
  await openMap(page);
  const view3d = panel(page).getByRole("tab", { name: "3D view" });
  const list = panel(page).getByRole("tab", { name: "List" });
  test.skip(await view3d.isDisabled(), "this browser has no WebGL");

  await list.click();
  await expect(list).toHaveAttribute("aria-selected", "true");
  await expect(panel(page).getByRole("list", { name: "Body regions" })).toBeVisible();
  await expect(panel(page).locator("canvas")).toHaveCount(0);

  await view3d.click();
  await expect(view3d).toHaveAttribute("aria-selected", "true");
  await expect(panel(page).locator("canvas")).toBeVisible();
  await expect(panel(page).getByRole("list", { name: "Body regions" })).toHaveCount(0);
});

test("the chosen view is remembered after closing and reopening", async ({ page }) => {
  await openMap(page);
  await panel(page).getByRole("tab", { name: "List" }).click();
  await panel(page).getByRole("button", { name: "Close body map" }).click();
  await openMap(page);
  await expect(panel(page).getByRole("tab", { name: "List" })).toHaveAttribute("aria-selected", "true");
});

test("arrow keys move between the two views", async ({ page }) => {
  await openMap(page);
  const view3d = panel(page).getByRole("tab", { name: "3D view" });
  test.skip(await view3d.isDisabled(), "this browser has no WebGL");
  const list = panel(page).getByRole("tab", { name: "List" });
  await list.click();
  await list.press("ArrowLeft");
  await expect(view3d).toHaveAttribute("aria-selected", "true");
  await expect(view3d).toBeFocused();
  await view3d.press("ArrowRight");
  await expect(list).toHaveAttribute("aria-selected", "true");
});

test("switching to the list does not disable 3D: back and forth, with pauses", async ({ page }) => {
  // Regression: unmounting the 3D canvas releases its WebGL context on purpose,
  // and that "context lost" event was mistaken for a GPU crash, which greyed
  // out the 3D view for the rest of the session.
  await openMap(page);
  const view3d = panel(page).getByRole("tab", { name: "3D view" });
  const list = panel(page).getByRole("tab", { name: "List" });
  test.skip(await view3d.isDisabled(), "this browser has no WebGL");
  await expect(panel(page).locator("canvas")).toBeVisible();

  for (let round = 0; round < 3; round++) {
    await list.click();
    await expect(panel(page).getByRole("list", { name: "Body regions" })).toBeVisible();
    await page.waitForTimeout(1200); // let the released context's event arrive
    await expect(view3d).toBeEnabled();
    await view3d.click();
    await expect(panel(page).locator("canvas")).toBeVisible();
    await page.waitForTimeout(600);
  }
});

test("a real GPU context loss falls back to the list, and 3D can be retried", async ({ page }) => {
  await openMap(page);
  const view3d = panel(page).getByRole("tab", { name: "3D view" });
  test.skip(await view3d.isDisabled(), "this browser has no WebGL");
  const canvas = panel(page).locator("canvas");
  await expect(canvas).toBeVisible();

  // Simulate the GPU dropping the context while the 3D view is on screen.
  await canvas.evaluate((el) => {
    const gl = (el as HTMLCanvasElement).getContext("webgl2") ?? (el as HTMLCanvasElement).getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(panel(page).getByRole("list", { name: "Body regions" })).toBeVisible();
  await expect(panel(page).getByRole("status")).toContainText("3D view stopped");
  await expect(view3d).toBeEnabled();

  await view3d.click();
  await expect(panel(page).locator("canvas")).toBeVisible();
  await expect(panel(page).getByRole("status")).toHaveCount(0);
});

test.describe("realistic body", () => {
  // No auto-rotation, so the body faces the camera and a point on screen is stable.
  test.use({ reducedMotion: "reduce" });

  async function openRealistic(page: Page) {
    await openMap(page);
    const view3d = panel(page).getByRole("tab", { name: "3D view" });
    test.skip(await view3d.isDisabled(), "this browser has no WebGL");
    await view3d.click();
    await expect(panel(page).locator('[data-body="realistic"]')).toBeVisible({ timeout: 30_000 });
    return panel(page).locator("canvas");
  }

  test("loads in place of the mannequin, and a click picks the region under the pointer", async ({ page }) => {
    const canvas = await openRealistic(page);
    const box = (await canvas.boundingBox())!;
    // The vertical framing is fixed by the camera, so the belly is at the same height at any panel size.
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.43);
    await expect(page.getByLabel("Describe your symptoms")).toHaveValue(/abdomen/);
  });

  test("clicking empty space beside the body selects nothing", async ({ page }) => {
    const canvas = await openRealistic(page);
    const box = (await canvas.boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.04, box.y + box.height * 0.5);
    await expect(page.getByLabel("Describe your symptoms")).toHaveValue("");
  });
});

test("falls back to the sculpted mannequin when the model cannot load", async ({ page }) => {
  await page.route("**/models/body-*.glb", (route) => route.abort());
  await openMap(page);
  const view3d = panel(page).getByRole("tab", { name: "3D view" });
  test.skip(await view3d.isDisabled(), "this browser has no WebGL");
  await view3d.click();
  await expect(panel(page).locator('[data-body="mannequin"]')).toBeVisible();
  await page.waitForTimeout(1500);
  await expect(panel(page).locator('[data-body="mannequin"]')).toBeVisible();
  await expect(panel(page).locator("canvas")).toBeVisible();
});
