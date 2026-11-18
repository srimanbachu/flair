import { test, expect } from "@playwright/test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { resolve } from "node:path";
import manifest from "../src/devtools/data/manifest.json" with { type: "json" };

function typecheck(sources: string[]) {
  const files = new Map(sources.map((source, index) => [resolve(`tests/icon-export-${index}.tsx`), source]));
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2023,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    skipLibCheck: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noEmit: true,
    types: ["react"],
  };
  const host = ts.createCompilerHost(options);
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (path, ...args) => files.has(path)
    ? ts.createSourceFile(path, files.get(path)!, options.target!, true, ts.ScriptKind.TSX)
    : original(path, ...args);
  const program = ts.createProgram([...files.keys()], options, host);
  expect(ts.getPreEmitDiagnostics(program).map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))).toEqual([]);
}

function renderComponent(source: string, props: React.SVGProps<SVGSVGElement> = {}) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS },
    reportDiagnostics: true,
  });
  expect(compiled.diagnostics).toEqual([]);
  const exports: { default?: React.ComponentType<React.SVGProps<SVGSVGElement>> } = {};
  new Function("React", "exports", compiled.outputText)(React, exports);
  return renderToStaticMarkup(React.createElement(exports.default!, props));
}

test("TSX exports from every collection typecheck and accept SVG props", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/dev-tools");
  const sources: string[] = [];
  for (const collection of manifest.collections) {
    await page.getByLabel("Icon collection").selectOption(collection.prefix);
    await page.locator(`[data-icon-id="${collection.prefix}:${collection.names[0]}"]`).click();
    await page.getByRole("button", { name: "Copy TSX", exact: true }).click();
    await expect(page.locator(".toast")).toContainText("TSX copied");
    const source = await page.evaluate(() => navigator.clipboard.readText());
    expect(source).toContain('import type { SVGProps } from "react"');
    expect(source).toContain("export default function");
    expect(source).toMatch(/copyright/i);
    sources.push(source);
    const html = renderComponent(source, { width: 40, height: 36, className: "custom-icon", color: "tomato" });
    expect(html).toContain('width="40"');
    expect(html).toContain('height="36"');
    expect(html).toContain('class="custom-icon"');
    expect(html).toContain('color="tomato"');
    if (collection.prefix === "bi") expect(source).toContain("function Icon123(");
  }
  typecheck(sources);
});

test("TSX retains selected defaults and allows stroke width overrides", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/dev-tools/outline/braces");
  await page.getByLabel("Icon size").selectOption("48");
  await page.getByLabel("Stroke width").selectOption("1.5");
  await page.getByRole("button", { name: "Copy TSX", exact: true }).click();
  await expect(page.locator(".toast")).toContainText("Braces TSX copied");
  const source = await page.evaluate(() => navigator.clipboard.readText());
  typecheck([source]);
  expect(renderComponent(source)).toContain('width="48"');
  expect(renderComponent(source)).toContain('stroke-width="1.5"');
  expect(renderComponent(source, { strokeWidth: 3 })).not.toContain('stroke-width="1.5"');
  expect(renderComponent(source, { strokeWidth: 3 })).toContain('stroke-width="3"');
});

test("colored logos produce valid typed components", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/dev-tools/developer-logos/vscode");
  await page.getByRole("button", { name: "Copy TSX", exact: true }).click();
  await expect(page.locator(".toast")).toContainText("Vscode TSX copied");
  const source = await page.evaluate(() => navigator.clipboard.readText());
  typecheck([source]);
  const html = renderComponent(source);
  expect(html).toContain("linearGradient");
  expect(html).toContain('mask-type="alpha"');
});
