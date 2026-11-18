import { test, expect } from "@playwright/test";
import manifest from "../src/devtools/data/manifest.json" with { type: "json" };

test("each collection supports direct icon URLs and reloads", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const collection of manifest.collections) {
    const slug = collection.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await page.goto(`/dev-tools/${slug}/${collection.names[0]}`);
    await expect(page.locator(".dev-preview svg")).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy TSX", exact: true })).toBeEnabled();
    await expect(page.getByRole("link", { name: "Dev Tools", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("button", { name: "Save", exact: true })).toHaveCount(0);
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
    return { total: paths.length, unique: new Set(paths).size,
      unresolved: catalog.filter((entry: { id: string }) => iconAtPath(iconPath(entry))?.id !== entry.id).length };
  });
  expect(result).toEqual({ total: manifest.total, unique: manifest.total, unresolved: 0 });
});
