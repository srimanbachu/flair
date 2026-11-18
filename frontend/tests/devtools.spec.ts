import { test, expect } from "@playwright/test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import manifest from "../src/devtools/data/manifest.json" with { type: "json" };

function renderJsx(source: string) {
  const result = ts.transpileModule(`export default (${source});`, {
    compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS },
    reportDiagnostics: true,
  });
  expect(result.diagnostics).toEqual([]);
  const exports: { default?: React.ReactNode } = {};
  new Function("React", "exports", result.outputText)(React, exports);
  return renderToStaticMarkup(exports.default);
}

test("JSX and SVG copy self-contained artwork with matching options and license", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/dev-tools");
  await page.getByLabel("Search icons").fill("braces");
  await page.locator('[data-icon-id="lucide:braces"]').click();
  await page.getByLabel("Icon size").selectOption("48");
  await page.getByLabel("Stroke width").selectOption("1.5");
  await expect(page.locator(".dev-preview svg")).toHaveAttribute("width", "48");
  await expect(page.locator(".dev-preview [stroke-width]")).toHaveAttribute(
    "stroke-width",
    "1.5",
  );
  await page.getByRole("button", { name: "Copy JSX", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("<svg");
  const jsx = await page.evaluate(() => navigator.clipboard.readText());
  expect(jsx).not.toContain('from "lucide-react"');
  expect(jsx).toContain("Permission");
  expect(renderJsx(jsx)).toContain('width="48"');
  expect(renderJsx(jsx)).toContain('stroke-width="1.5"');
  await page.getByRole("button", { name: "Copy SVG", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("<!--");
  const parsed = await page.evaluate(async () => {
    const source = await navigator.clipboard.readText();
    const doc = new DOMParser().parseFromString(source, "image/svg+xml");
    const svg = doc.documentElement;
    return {
      tag: svg.tagName,
      width: svg.getAttribute("width"),
      stroke: svg.querySelector("[stroke-width]")?.getAttribute("stroke-width"),
      namespace: svg.namespaceURI,
      paths: svg.querySelectorAll("path").length,
      errors: doc.querySelectorAll("parsererror").length,
    };
  });
  expect(parsed).toEqual({
    tag: "svg",
    width: "48",
    stroke: "1.5",
    namespace: "http://www.w3.org/2000/svg",
    paths: 1,
    errors: 0,
  });
});

test("Dev Tools remains usable on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dev-tools");
  await page.getByLabel("Search icons").fill("terminal");
  await page.locator('[data-icon-id="lucide:terminal"]').click();
  await expect(
    page.getByRole("button", { name: "Copy SVG", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy TSX", exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

test("catalog has over 10,000 icons, complete search, collections and pagination", async ({
  page,
}) => {
  await page.goto("/dev-tools");
  await expect(page.getByRole("heading", { name: "Dev Tools." })).toBeVisible();
  await expect(page.locator(".dev-result-count")).toHaveText(
    `${manifest.total.toLocaleString()} icons`,
  );
  expect(manifest.total).toBeGreaterThanOrEqual(10000);
  await expect(page.locator(".dev-icon-tile")).toHaveCount(96);
  await page.getByRole("button", { name: /Show more icons/ }).click();
  await expect(page.locator(".dev-icon-tile")).toHaveCount(192);
  await page.getByLabel("Search icons").fill("file-code");
  await expect(page.locator('[data-icon-id="lucide:file-code"]')).toBeVisible();
  await page.getByLabel("Icon collection").selectOption("tabler");
  await expect(page.locator('[data-icon-id^="lucide:"]')).toHaveCount(0);
  await expect(page.locator('[data-icon-id="tabler:file-code"]')).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await page.getByRole("button", { name: "Development", exact: true }).click();
  await page.getByLabel("Icon collection").selectOption("devicon");
  await page.getByLabel("Search icons").fill("typescript");
  await expect(
    page.locator('[data-icon-id="devicon:typescript"]'),
  ).toBeVisible();
  await page.getByLabel("Search icons").fill("no-such-icon-123");
  await expect(
    page.getByRole("heading", { name: "No icons found" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset search" }).click();
  await expect(page.getByLabel("Icon collection")).toHaveValue("all");
  await expect(page.locator(".dev-icon-tile")).toHaveCount(96);
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Dev Tools", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("switching to Dev Tools preserves the editor draft and undo history", async ({
  page,
}) => {
  await page.goto("/cards");
  await page.getByLabel("Card title", { exact: true }).fill("Keep my draft");
  await page.getByRole("link", { name: "Dev Tools", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Dev Tools." })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Code Cards", exact: true }).click();
  await expect(page.getByLabel("Card title", { exact: true })).toHaveValue(
    "Keep my draft",
  );
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toBeEnabled();
});

test("all seven collections load from local assets and retain their licenses", async ({
  page,
}) => {
  const errors: string[] = [];
  const foreignRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (
      !request.url().startsWith("http://127.0.0.1:5173") &&
      !request.url().startsWith("data:") &&
      !request.url().includes("fonts.gstatic.com") &&
      !request.url().includes("fonts.google")
    )
      foreignRequests.push(request.url());
  });
  await page.goto("/dev-tools");
  await expect(page.getByText("Lucide React", { exact: true })).toHaveCount(0);
  await expect(page.locator(".dev-source")).not.toContainText("lucide-react");
  for (const collection of manifest.collections) {
    await page.getByLabel("Icon collection").selectOption(collection.prefix);
    await expect(page.locator(".dev-result-count")).toHaveText(
      `${collection.count.toLocaleString()} icons`,
    );
    const tile = page.locator(
      `[data-icon-id="${collection.prefix}:${collection.names[0]}"]`,
    );
    await expect(tile.locator("svg")).toBeVisible();
    await tile.click();
    await expect(page.locator(".dev-preview svg")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Copy SVG", exact: true }),
    ).toBeEnabled();
    const response = await page.request.get(`/icons/${collection.file}`);
    const data = await response.json();
    expect(data.license).toMatch(/copyright/i);
    expect(Object.keys(data.icons)).toHaveLength(collection.count);
  }
  const notice = await page.request.get("/icons/NOTICE.txt");
  expect(await notice.text()).toContain("THIRD-PARTY ICON NOTICES");
  expect(errors).toEqual([]);
  expect(foreignRequests).toEqual([]);
});

test("colored logo JSX renders and repeated artwork has isolated SVG definitions", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/dev-tools");
  await page.getByLabel("Icon collection").selectOption("devicon");
  await page.getByLabel("Search icons").fill("vscode");
  await page.locator('[data-icon-id="devicon:vscode"]').click();
  await expect(page.locator(".dev-preview svg")).toBeVisible();
  await page.getByRole("button", { name: "Copy JSX", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("mask-type");
  const jsx = await page.evaluate(() => navigator.clipboard.readText());
  const rendered = renderJsx(jsx);
  expect(rendered).toContain("linearGradient");
  expect(rendered).toContain('mask-type="alpha"');
  expect(rendered).not.toContain("parsererror");
  const ids = await page
    .locator(".dev-tools svg [id]")
    .evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(new Set(ids).size).toBe(ids.length);
});

test("failed asset loads disable copying and can be retried", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/icons/collections/lucide-*.json", async (route) => {
    if (fail) await route.fulfill({ status: 503, body: "Unavailable" });
    else await route.continue();
  });
  await page.goto("/dev-tools");
  await expect(
    page.getByRole("button", { name: "Copy SVG", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Copy TSX", exact: true })).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText("Couldn't load");
  fail = false;
  await page.getByRole("button", { name: "Retry loading icon" }).click();
  await expect(page.locator(".dev-preview svg")).toBeVisible();
  await expect(page.locator(".dev-icon-tile svg")).toHaveCount(96);
  await expect(
    page.getByRole("button", { name: "Copy SVG", exact: true }),
  ).toBeEnabled();
});
