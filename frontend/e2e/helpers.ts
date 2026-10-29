import { expect, type Page } from "@playwright/test";

export const PASSWORD = "SecurePass#123";

export function uniqueEmail(tag = "user"): string {
  // example.com is reserved for examples (RFC 2606) yet passes e-mail validation;
  // special-use domains such as .test are rejected by the API.
  return `${tag}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@example.com`;
}

/** Register through the UI and wait for the chat page. */
export async function register(page: Page, name = "Asha Verma"): Promise<string> {
  const email = uniqueEmail();
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/chat$/);
  return email;
}

/** Send a chat message and return the newest assistant reply. */
export async function send(page: Page, text: string) {
  const replies = page.locator("article");
  const before = await replies.count();
  await page.getByLabel("Describe your symptoms").fill(text);
  await page.getByRole("button", { name: "Send" }).click();
  await expect(replies).toHaveCount(before + 1, { timeout: 15_000 });
  return replies.last();
}
