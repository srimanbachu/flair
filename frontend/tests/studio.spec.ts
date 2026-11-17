import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});
test("card editing, line effects and multiple blocks", async ({ page }) => {
  await page
    .getByLabel("Card title", { exact: true })
    .fill("A beautiful snippet");
  await expect(
    page.getByRole("heading", { name: "A beautiful snippet" }),
  ).toBeVisible();
  await page.getByLabel("Highlight lines", { exact: true }).fill("2-4");
  await expect(page.locator(".line-highlight")).toHaveCount(3);
  await page.getByLabel("Blur lines", { exact: true }).fill("5");
  await expect(page.locator(".line-text").nth(4)).toHaveCSS(
    "filter",
    "blur(6px)",
  );
  await page.getByRole("button", { name: "+ Add code block" }).click();
  await expect(page.locator(".code-window")).toHaveCount(2);
});
test("card templates, typography and backgrounds", async ({ page }) => {
  await page.getByRole("button", { name: "Templates", exact: true }).click();
  await page.getByRole("button", { name: "Error → Fix" }).click();
  await expect(page.locator(".code-window")).toHaveCount(2);
  await page.getByRole("button", { name: "Typography", exact: true }).click();
  await page.getByRole("button", { name: "Dracula" }).click();
  await page.getByLabel("Font family").selectOption('"Courier New", monospace');
  await page.getByRole("button", { name: "Background", exact: true }).click();
  await page.getByRole("button", { name: "Sunset", exact: true }).click();
  await expect(page.locator(".card-background")).toHaveCSS(
    "background-image",
    /linear-gradient/,
  );
});
test("local library survives reload and opens saved project", async ({
  page,
}) => {
  await page.getByLabel("Card title", { exact: true }).fill("Saved locally");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "My projects" }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "Saved locally", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open project" }).click();
  await expect(page.getByLabel("Card title", { exact: true })).toHaveValue(
    "Saved locally",
  );
});
test("card png download has exact requested size", async ({ page }) => {
  await page
    .getByRole("button", { name: "Export", exact: true })
    .first()
    .click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "PNG image" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("flair-card.png");
  const { readFile } = await import("node:fs/promises");
  const bytes = await readFile((await file.path())!);
  expect(bytes.readUInt32BE(16)).toBe(1200);
  expect(bytes.readUInt32BE(20)).toBe(900);
});
test("canvas shapes, history, comments and grouping", async ({ page }) => {
  await page.getByRole("button", { name: "Canvas", exact: true }).click();
  const surface = page.locator(".canvas-surface");
  const b = (await surface.boundingBox())!;
  await page.getByRole("button", { name: "rectangle", exact: true }).click();
  await page.mouse.move(b.x + 180, b.y + 160);
  await page.mouse.down();
  await page.mouse.move(b.x + 400, b.y + 300, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator("[data-item]")).toHaveCount(1);
  await page.getByLabel("Text / code").fill("Frontend");
  await page.getByLabel("Leave feedback").fill("Ship it");
  await page.getByRole("button", { name: "Add comment" }).click();
  await expect(page.locator(".local-comment")).toContainText("Ship it");
  await page.getByRole("button", { name: "Duplicate", exact: true }).click();
  await expect(page.locator("[data-item]")).toHaveCount(2);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator("[data-item]")).toHaveCount(1);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(page.locator("[data-item]")).toHaveCount(2);
});
test("canvas attached connectors follow nodes and SVG exports", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Canvas", exact: true }).click();
  await page.getByRole("button", { name: "System architecture" }).click();
  await expect(page.locator("[data-item]")).toHaveCount(9);
  await page.locator(".layer-row").filter({ hasText: "Client" }).click();
  await page.getByLabel("Text / code").fill("Browser");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "SVG vector" }).click();
  const file = await promise;
  const { readFile } = await import("node:fs/promises");
  const text = await readFile((await file.path())!, "utf8");
  expect(text).toContain("Browser");
  expect(text).toContain("marker-end");
  expect(text).not.toContain('stroke-dasharray="5 4"');
});
test("reject malformed project imports", async ({ page }) => {
  await page.locator('input[accept="application/json,.json"]').setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      '{"format":"flair","version":1,"kind":"canvas","data":{"items":"bad"}}',
    ),
  });
  await expect(page.getByRole("status")).toContainText("Invalid");
});
test("mobile layout keeps preview and controls accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.locator(".card-art")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Typography", exact: true }).click();
  await expect(page.getByLabel("Font family")).toBeVisible();
});

test("freehand strokes retain geometry and can be erased", async ({ page }) => {
  await page.getByRole("button", { name: "Canvas", exact: true }).click();
  const b = (await page.locator(".canvas-surface").boundingBox())!;
  await page.getByRole("button", { name: "pen", exact: true }).click();
  await page.mouse.move(b.x + 250, b.y + 250);
  await page.mouse.down();
  await page.mouse.move(b.x + 170, b.y + 180, { steps: 12 });
  await page.mouse.move(b.x + 350, b.y + 200, { steps: 12 });
  await page.mouse.up();
  const stroke = page.locator("[data-item] polyline");
  await expect(stroke).toBeVisible();
  expect(
    (await stroke.getAttribute("points"))!.split(" ").length,
  ).toBeGreaterThan(15);
  await page.getByRole("button", { name: "eraser", exact: true }).click();
  await page.mouse.click(b.x + 170, b.y + 180);
  await expect(page.locator("[data-item]")).toHaveCount(0);
});
test("frames present and project files round-trip", async ({ page }) => {
  await page.getByRole("button", { name: "Canvas", exact: true }).click();
  const b = (await page.locator(".canvas-surface").boundingBox())!;
  await page.getByRole("button", { name: "frame", exact: true }).click();
  await page.mouse.move(b.x + 90, b.y + 120);
  await page.mouse.down();
  await page.mouse.move(b.x + 500, b.y + 400, { steps: 8 });
  await page.mouse.up();
  await page
    .getByRole("button", { name: "Present frames", exact: true })
    .click();
  await expect(page.locator(".presentation-nav")).toContainText("1 / 1");
  await page.keyboard.press("Escape");
  await expect(page.locator(".presentation-nav")).toHaveCount(0);
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Editable project" }).click();
  const f = await promise;
  const { readFile } = await import("node:fs/promises");
  const bytes = await readFile((await f.path())!);
  await page.reload();
  await page.locator('input[accept="application/json,.json"]').setInputFiles({
    name: "roundtrip.json",
    mimeType: "application/json",
    buffer: bytes,
  });
  await expect(page.locator("[data-item]")).toHaveCount(1);
  await expect(page.getByRole("status")).toContainText("Project imported");
});
test("same-browser local room syncs between two tabs", async ({
  page,
  context,
}) => {
  await page.getByRole("button", { name: "Canvas", exact: true }).click();
  await page.getByLabel("Live sharing between browser tabs").check();
  const other = await context.newPage();
  await other.goto("/");
  await other.getByRole("button", { name: "Canvas", exact: true }).click();
  await other.getByLabel("Live sharing between browser tabs").check();
  await page.getByRole("button", { name: /Mind map/ }).click();
  await expect(other.locator("[data-item]")).toHaveCount(7);
  await other.locator(".layer-row").filter({ hasText: "Design" }).click();
  await other.getByLabel("Text / code").fill("Shared design");
  await expect(
    page.locator("[data-item]").filter({ hasText: "Shared design" }),
  ).toHaveCount(1);
  await other.close();
});
test("canvas PNG rasterization works and studio has no browser errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.screenshot({ path: "/private/tmp/flair-desktop.png" });
  await page.getByRole("button", { name: "Canvas", exact: true }).click();
  await page.getByRole("button", { name: "System architecture" }).click();
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "PNG image" }).click();
  expect((await promise).suggestedFilename()).toBe("flair-canvas.png");
  expect(errors).toEqual([]);
});

test("line words, annotations and window visibility respond to controls", async ({
  page,
}) => {
  await page.getByLabel("Highlight words", { exact: true }).fill("Infinity");
  await expect(page.locator(".syntax mark")).toHaveText("Infinity");
  await page.getByRole("button", { name: "Window", exact: true }).click();
  await page.getByLabel("Show file names").uncheck();
  await page.getByLabel("Show window controls").uncheck();
  await expect(page.locator(".code-window-bar")).toHaveCount(0);
  await page.getByRole("button", { name: "Annotations", exact: true }).click();
  await page.getByRole("button", { name: "+ label", exact: true }).click();
  await page.getByLabel("Text", { exact: true }).fill("A useful detail");
  await expect(page.locator(".annotation")).toContainText("A useful detail");
});
test("custom export dimensions and transparent background are preserved", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Export", exact: true })
    .last()
    .click();
  await page.getByLabel("Export dimensions").selectOption("1:1");
  await expect(page.getByLabel("Export dimensions")).toHaveValue("1:1");
  await page.getByLabel("Export dimensions").selectOption("Custom");
  await expect(page.getByLabel("Export dimensions")).toHaveValue("Custom");
  await page.getByLabel("Width (px)").fill("640");
  await page.getByLabel("Height (px)").fill("640");
  await page.getByLabel("Height (px)").blur();
  await page.getByRole("button", { name: "Background", exact: true }).click();
  await page.getByRole("slider", { name: /Background opacity/ }).focus();
  await page.keyboard.press("Home");
  await page
    .getByRole("button", { name: "Export", exact: true })
    .first()
    .click();
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "PNG image" }).click();
  const f = await promise;
  const { readFile } = await import("node:fs/promises");
  const buffer = await readFile((await f.path())!);
  expect(buffer.readUInt32BE(16)).toBe(640);
  expect(buffer.readUInt32BE(20)).toBe(640);
  const alpha = await page.evaluate(
    async (data) => {
      const image = new Image();
      image.src = data;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 640;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, 0, 0);
      return ctx.getImageData(0, 0, 1, 1).data[3];
    },
    `data:image/png;base64,${buffer.toString("base64")}`,
  );
  expect(alpha).toBe(0);
});
test("marquee grouping, moving nodes and attached arrow geometry", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Canvas", exact: true }).click();
  await page.getByRole("button", { name: "System architecture" }).click();
  const first = page.locator("[data-item]").first(),
    arrow = page.locator("[data-item] line[marker-end]").first();
  const x1 = Number(await arrow.getAttribute("x1"));
  const b = (await first.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 70, b.y + b.height / 2 + 35, {
    steps: 8,
  });
  await page.mouse.up();
  expect(Number(await arrow.getAttribute("x1"))).toBeGreaterThan(x1 + 50);
  await page.keyboard.press("ControlOrMeta+a");
  await page.getByRole("button", { name: "Group", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Ungroup", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Ungroup", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Ungroup", exact: true }),
  ).toBeDisabled();
});
test("uploaded background is embedded and saved in project file", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Background", exact: true }).click();
  await page
    .getByLabel("Upload background")
    .setInputFiles({
      name: "pixel.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  await expect(
    page.getByRole("button", { name: "Remove uploaded image" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Background", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Remove uploaded image" }),
  ).toBeVisible();
});
