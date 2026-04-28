import { test, expect } from "@playwright/test";

test("users page and CRUD modal trigger", async ({ page }) => {
  await page.goto("/users");
  await expect(page.getByTestId("open-user-modal")).toBeVisible();

  await page.getByTestId("open-user-modal").click();
  await expect(page.getByTestId("submit-user-create")).toBeVisible();
});
