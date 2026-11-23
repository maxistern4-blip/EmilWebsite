import { expect, test } from "@playwright/test";
test("arcade opens the full chess analysis workspace", async ({ page }) => {
  await page.goto("/arcade.html");
  await expect(page.getByRole("heading", { name: "Wähle deine Sprache" })).toBeVisible();
  await page.getByRole("button", { name: /Deutsch/ }).click();
  await page.getByRole("button", { name: /Schach-Analyse/ }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Schach-Analyse" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Analyse starten" })).toBeVisible();
});
