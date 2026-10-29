import { expect, test } from "@playwright/test";
import { register, send } from "./helpers";

test("create, view and edit a health profile", async ({ page }) => {
  await register(page);
  await page.goto("/profile");
  await page.getByLabel("Age").fill("58");
  await page.getByLabel("Sex").selectOption("Male");
  await page.getByLabel("Known conditions").fill("Type 2 diabetes");
  await page.getByRole("button", { name: "Create profile" }).click();
  await expect(page.getByText("Profile created.")).toBeVisible();
  await expect(page.getByText("Type 2 diabetes")).toBeVisible();

  await page.getByRole("button", { name: "Edit profile" }).click();
  await page.getByLabel("Age").fill("59");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved.")).toBeVisible();
  await expect(page.getByRole("definition").filter({ hasText: "59" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("definition").filter({ hasText: "59" })).toBeVisible();
});

test("cancel discards unsaved profile edits", async ({ page }) => {
  await register(page);
  await page.goto("/profile");
  await page.getByLabel("Age").fill("30");
  await page.getByRole("button", { name: "Create profile" }).click();
  await page.getByRole("button", { name: "Edit profile" }).click();
  await page.getByLabel("Age").fill("99");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("definition").filter({ hasText: "30" })).toBeVisible();
  await expect(page.getByText("99")).toHaveCount(0);
});

test("the dashboard reflects the user's own checks", async ({ page }) => {
  await register(page);
  await send(page, "I have a mild headache");
  await page.goto("/dashboard");
  await expect(page.getByText(/You have made\s*1\s*check/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "How answers were graded" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The medical library" })).toBeVisible();
});
