import { expect, test } from "@playwright/test";
import { PASSWORD, register, uniqueEmail } from "./helpers";

test("register lands on the chat and shows the user's name", async ({ page }) => {
  await register(page, "Ravi Kumar");
  await page.goto("/dashboard");
  await expect(page.getByRole("banner").getByText("Ravi Kumar")).toBeVisible();
});

test("log out, then log back in", async ({ page }) => {
  const email = await register(page);
  await page.goto("/about");
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

  await page.goto("/login");
  await page.getByLabel("Email").fill(email.toUpperCase()); // e-mail is case-insensitive
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/chat$/);
});

test("wrong password shows an error and stays on the form", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(uniqueEmail("nobody"));
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(/invalid email or password/i);
  await expect(page).toHaveURL(/\/login$/);
});

test("registering an existing e-mail is refused", async ({ page }) => {
  const email = await register(page);
  await page.evaluate(() => localStorage.clear());
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Second Person");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(/already exists/i);
});

for (const path of ["/dashboard", "/profile"]) {
  test(`${path} sends signed-out visitors to sign in`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  });
}

test("an expired access token is renewed silently", async ({ page }) => {
  await register(page);
  // Corrupt the access token; the refresh token is still valid.
  await page.evaluate(() => localStorage.setItem("access_token", "expired.or.invalid"));
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Health profile" })).toBeVisible();
  await expect(page.getByText("You have not created a profile yet.")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("access_token"))).not.toBe("expired.or.invalid");
});

test("when both tokens are invalid the user is sent to sign in", async ({ page }) => {
  await register(page);
  await page.evaluate(() => {
    localStorage.setItem("access_token", "bad");
    localStorage.setItem("refresh_token", "bad");
  });
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem("access_token"))).toBeNull();
});
