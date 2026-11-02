import { expect, test } from "@playwright/test";
import { PASSWORD, chooseSex, register, uniqueEmail } from "./helpers";

test("sign-up offers exactly Male and Female, and requires one", async ({ page }) => {
  await page.goto("/register");
  const radios = page.getByRole("main").getByRole("radio");
  await expect(radios).toHaveCount(2);
  expect(await radios.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value))).toEqual([
    "female",
    "male",
  ]);

  await page.getByLabel("Full name").fill("No Choice");
  await page.getByLabel("Email").fill(uniqueEmail("nosex"));
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/register$/); // the browser blocks the submit
});

test("the chosen sex is saved on the account", async ({ page }) => {
  await register(page, "Ravi Kumar", "Male");
  const user = await page.evaluate(() => JSON.parse(localStorage.getItem("user") ?? "{}"));
  expect(user.sex).toBe("male");
});

test("an account without a sex is asked once, then returns where it was going", async ({ page }) => {
  await register(page);
  // Simulate an account created before sex was asked: the server reports none.
  await page.evaluate(() => {
    const user = JSON.parse(localStorage.getItem("user") ?? "{}");
    localStorage.setItem("user", JSON.stringify({ ...user, sex: null }));
  });
  await page.route("**/api/v1/auth/me", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    const response = await route.fetch();
    await route.fulfill({ response, json: { ...(await response.json()), sex: null } });
  });

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/onboarding\?next=%2Fdashboard$/);
  await expect(page.getByRole("heading", { name: "One more thing" })).toBeVisible();

  await page.unroute("**/api/v1/auth/me");
  await chooseSex(page, "Male");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  // Saved on the server: the profile page reads the account and shows it,
  // and the dashboard no longer redirects.
  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/profile");
  await expect(page.getByRole("radio", { name: "Male", exact: true })).toBeChecked();
});

test("onboarding never redirects off the site", async ({ page }) => {
  await register(page);
  await page.goto("/onboarding?next=https://evil.example");
  // This account already has a sex, so onboarding forwards it, safely.
  await expect(page).toHaveURL(/\/chat$/);
});

for (const [sex, hasFemaleRegions] of [
  ["Female", true],
  ["Male", false],
] as const) {
  test(`the body map shows the ${sex.toLowerCase()} body's regions`, async ({ page }) => {
    await register(page, "Body Map", sex);
    await page.getByRole("button", { name: /Body map/ }).click();
    await page.getByRole("tab", { name: "List" }).click();
    const regions = page.getByRole("list", { name: "Body regions" });
    for (const region of ["Breast", "Pelvis"]) {
      await expect(regions.getByRole("button", { name: region, exact: true })).toHaveCount(hasFemaleRegions ? 1 : 0);
    }
    await expect(regions.getByRole("button", { name: "Chest", exact: true })).toBeVisible();
    // No body picker for signed-in users: the account decides.
    await expect(page.getByRole("radiogroup", { name: "Body" })).toHaveCount(0);
  });
}

test("a signed-out visitor can switch between the two bodies", async ({ page }) => {
  await page.goto("/chat");
  await page.getByRole("button", { name: /Body map/ }).click();
  await page.getByRole("tab", { name: "List" }).click();
  const regions = page.getByRole("list", { name: "Body regions" });
  await expect(regions.getByRole("button", { name: "Breast", exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "Male", exact: true }).click();
  await expect(regions.getByRole("button", { name: "Breast", exact: true })).toHaveCount(0);
});
