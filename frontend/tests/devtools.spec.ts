import { test, expect } from "@playwright/test";

test("Dev Tools exposes the full catalog, search, filters and more icons", async ({ page }) => {
  await page.goto("/dev-tools");
  await expect(page.getByRole("heading", { name: "Dev Tools." })).toBeVisible();
  await expect(page.locator(".dev-result-count")).toHaveText(/[1-9],\d{3} icons/);
  await expect(page.locator(".dev-icon-tile")).toHaveCount(96);
  await page.getByRole("button", { name: /Show more icons/ }).click();
  await expect(page.locator(".dev-icon-tile")).toHaveCount(192);
  await page.getByLabel("Search icons").fill("file-code");
  await expect(page.getByRole("button", { name: "FileCode", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await page.getByRole("button", { name: "Development", exact: true }).click();
  await page.getByLabel("Search icons").fill("terminal");
  await expect(page.getByRole("button", { name: "Terminal", exact: true })).toBeVisible();
  await page.getByLabel("Search icons").fill("no-such-icon-123");
  await expect(page.getByRole("heading", { name: "No icons found" })).toBeVisible();
  await page.getByRole("button", { name: "Reset search" }).click();
  await expect(page.locator(".dev-icon-tile")).toHaveCount(96);
  await page.reload();
  await expect(page.getByRole("link", { name: "Dev Tools", exact: true })).toHaveAttribute("aria-current", "page");
});

test("switching to Dev Tools preserves the editor draft and undo history", async ({ page }) => {
  await page.goto("/cards");
  await page.getByLabel("Card title", { exact: true }).fill("Keep my draft");
  await page.getByRole("link", { name: "Dev Tools", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Dev Tools." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save", exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Code Cards", exact: true }).click();
  await expect(page.getByLabel("Card title", { exact: true })).toHaveValue("Keep my draft");
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toBeEnabled();
});
