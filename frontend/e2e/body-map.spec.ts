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
