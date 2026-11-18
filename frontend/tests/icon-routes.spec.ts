import { test, expect } from "@playwright/test";
import manifest from "../src/devtools/data/manifest.json" with { type: "json" };

test("icon permalinks can be copied and opened on a phone", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dev-tools/developer-logos/vscode");
  await page
    .getByRole("button", { name: "Copy icon link", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("http://127.0.0.1:5173/dev-tools/developer-logos/vscode");
  await expect(
    page.getByRole("button", { name: "Copy TSX", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.reload();
  await expect(page.locator(".dev-inspector h2")).toHaveText("Vscode");
  await expect(
    page.getByRole("button", { name: "Copy TSX", exact: true }),
  ).toBeEnabled();
});

test("following icon routes keeps the card draft and undo history", async ({
  page,
}) => {
  await page.goto("/cards");
  await page
    .getByLabel("Card title", { exact: true })
    .fill("My original draft");
  await page.getByRole("link", { name: "Dev Tools", exact: true }).click();
  await page.getByLabel("Search icons").fill("braces");
  await page.locator('[data-icon-id="lucide:braces"]').click();
  await page.getByRole("link", { name: "Code Cards", exact: true }).click();
  await expect(page.getByLabel("Card title", { exact: true })).toHaveValue(
    "My original draft",
  );
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toBeEnabled();
});

test("icon links preserve browser history and library search", async ({
  page,
}) => {
  await page.goto("/dev-tools");
  await page.getByLabel("Search icons").fill("braces");
  const first = page.locator('[data-icon-id="lucide:braces"]');
  await expect(first).toHaveAttribute("href", "/dev-tools/outline/braces");
  await first.click();
  await expect(page).toHaveURL(/\/dev-tools\/outline\/braces$/);
  await expect(page.locator(".dev-inspector h2")).toHaveText("Braces");
  await page.getByLabel("Search icons").fill("terminal");
  await page.locator('[data-icon-id="lucide:terminal"]').click();
  await expect(page).toHaveURL(/\/dev-tools\/outline\/terminal$/);
  await page.goBack();
  await expect(page.locator(".dev-inspector h2")).toHaveText("Braces");
  await expect(page.getByLabel("Search icons")).toHaveValue("terminal");
  await page.goForward();
  await expect(page.locator(".dev-inspector h2")).toHaveText("Terminal");
  await page.getByRole("link", { name: "Icon library", exact: true }).click();
  await expect(page).toHaveURL(/\/dev-tools$/);
  await expect(page.getByLabel("Search icons")).toHaveValue("terminal");
});

test("missing and malformed icon URLs stay in Dev Tools with a return link", async ({
  page,
}) => {
  for (const path of [
    "/dev-tools/missing/terminal",
    "/dev-tools/outline/no-such-icon",
    "/dev-tools/outline",
    "/dev-tools/outline/terminal/extra",
  ]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: "Icon not found", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Copy TSX", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("link", { name: "Browse all icons" }).click();
    await expect(page).toHaveURL(/\/dev-tools$/);
    await expect(page.locator(".dev-preview svg")).toBeVisible();
  }
});

test("each collection supports direct icon URLs and reloads", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const collection of manifest.collections) {
    const slug = collection.label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    await page.goto(`/dev-tools/${slug}/${collection.names[0]}`);
    await expect(page.locator(".dev-preview svg")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Copy TSX", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByRole("link", { name: "Dev Tools", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      page.getByRole("button", { name: "Save", exact: true }),
    ).toHaveCount(0);
    await expect(page).toHaveTitle(/Dev Tools · Flair$/);
    await page.reload();
    await expect(page.locator(".dev-preview svg")).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("every catalog icon has a distinct resolvable URL", async ({ page }) => {
  await page.goto("/dev-tools");
  const result = await page.evaluate(async () => {
    const catalogModule = "/src/devtools/catalog.ts";
    const routesModule = "/src/devtools/iconRoutes.ts";
    const { catalog } = await import(catalogModule);
    const { iconPath, iconAtPath } = await import(routesModule);
    const paths = catalog.map(iconPath);
    return {
      total: paths.length,
      unique: new Set(paths).size,
      unresolved: catalog.filter(
        (entry: { id: string }) => iconAtPath(iconPath(entry))?.id !== entry.id,
      ).length,
    };
  });
  expect(result).toEqual({
    total: manifest.total,
    unique: manifest.total,
    unresolved: 0,
  });
});
