import { test, expect } from "@playwright/test";

test("modal rendering", async ({ page }) => {
  await page.goto("/users");
  await page.getByTestId("open-user-modal").click();
  await expect(page.getByTestId("modal-overlay")).toBeVisible();
});
