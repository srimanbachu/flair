import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});
test("card editing, line effects and multiple blocks", async ({ page }) => {
  await page
    .getByLabel("Card title", { exact: true })
    .fill("A beautiful snippet");
  await expect(page.getByLabel("Card title", { exact: true })).toHaveValue(
    "A beautiful snippet",
  );
  await page.getByText("Line effects").click();
  await page.getByLabel("Highlight lines", { exact: true }).fill("2-4");
  await expect(page.locator(".line-highlight")).toHaveCount(3);
  await page.getByLabel("Blur lines", { exact: true }).fill("5");
  await expect(page.locator(".line-text").nth(4)).toHaveCSS(
    "filter",
    "blur(6px)",
  );
  await page.getByRole("button", { name: "Add block" }).click();
  await expect(page.locator(".code-window")).toHaveCount(2);
});
test("card templates, typography and backgrounds", async ({ page }) => {
  await page.getByRole("button", { name: "Templates", exact: true }).click();
  await page.getByRole("button", { name: "Error → Fix" }).click();
  await expect(page.locator(".code-window")).toHaveCount(2);
  await page.getByRole("button", { name: "Typography", exact: true }).click();
  await page.getByRole("button", { name: "Dracula" }).click();
  await page.getByRole("button", { name: "Courier", exact: true }).click();
  await expect(page.locator(".syntax").first()).toHaveCSS(
    "font-family",
    '"Courier New", monospace',
  );
  await page.getByRole("button", { name: "Background", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Solid", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Gradient", exact: true }).click();
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
    .last()
    .click();
  await page
    .getByRole("group", { name: "Export dimensions" })
    .getByRole("button", { name: "4:3" })
    .click();
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
  await page.getByRole("button", { name: "Rectangle", exact: true }).click();
  await page.mouse.move(b.x + 180, b.y + 160);
  await page.mouse.down();
  await page.mouse.move(b.x + 400, b.y + 300, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator("[data-item]")).toHaveCount(1);
  await page.locator("[data-item]").first().dblclick();
  await page.getByLabel("Edit text").fill("Frontend");
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-item]")).toContainText("Frontend");
  await page.getByText("Comments", { exact: true }).click();
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
  await page.locator("[data-item]").filter({ hasText: "Client" }).dblclick();
  await page.getByLabel("Edit text").fill("Browser");
  await page.keyboard.press("Enter");
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
  await expect(page.getByRole("group", { name: "Font family" })).toBeVisible();
});

test("freehand strokes retain geometry and can be erased", async ({ page }) => {
  await page.getByRole("button", { name: "Canvas", exact: true }).click();
  const b = (await page.locator(".canvas-surface").boundingBox())!;
  await page.getByRole("button", { name: "Draw", exact: true }).click();
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
  await page.getByRole("button", { name: "Eraser", exact: true }).click();
  await page.mouse.click(b.x + 170, b.y + 180);
  await expect(page.locator("[data-item]")).toHaveCount(0);
});
test("frames present and project files round-trip", async ({ page }) => {
  await page.getByRole("button", { name: "Canvas", exact: true }).click();
  const b = (await page.locator(".canvas-surface").boundingBox())!;
  await page.getByRole("button", { name: "Frame", exact: true }).click();
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
  await page.getByRole("button", { name: "Board settings" }).click();
  await page.getByLabel("Live sharing between browser tabs").check();
  const other = await context.newPage();
  await other.goto("/");
  await other.getByRole("button", { name: "Canvas", exact: true }).click();
  await other.getByRole("button", { name: "Board settings" }).click();
  await other.getByLabel("Live sharing between browser tabs").check();
  await page
    .locator(".board-menu")
    .getByRole("button", { name: "Mind map" })
    .click();
  await expect(other.locator("[data-item]")).toHaveCount(7);
  await other.getByRole("button", { name: "Layers" }).click();
  await other.locator(".layer-row").filter({ hasText: "Design" }).click();
  await other.keyboard.press("Enter");
  await other.getByLabel("Edit text").fill("Shared design");
  await other.keyboard.press("Enter");
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
  await page.screenshot({ path: test.info().outputPath("studio-desktop.png") });
  await page.getByRole("button", { name: "Canvas", exact: true }).click();
  await page.getByRole("button", { name: "System architecture" }).click();
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "PNG image" }).click();
  expect((await promise).suggestedFilename()).toBe("flair-canvas.png");
  expect(errors).toEqual([]);
});

test("line words and window visibility respond to controls", async ({
  page,
}) => {
  await page.getByText("Line effects").click();
  await page.getByLabel("Highlight words", { exact: true }).fill("Infinity");
  await expect(page.locator(".syntax mark")).toHaveText("Infinity");
  await page.getByRole("button", { name: "Window", exact: true }).click();
  await page.getByLabel("Show file names").uncheck();
  await page.getByLabel("Show window controls").uncheck();
  await expect(page.locator(".code-window-bar")).toHaveCount(0);
});
test("custom export dimensions and transparent background are preserved", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Export", exact: true })
    .last()
    .click();
  const sizes = page.getByRole("group", { name: "Export dimensions" });
  await sizes.getByRole("button", { name: "1:1" }).click();
  await expect(sizes.getByRole("button", { name: "1:1" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByLabel("Width (px)")).toHaveValue("1080");
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
  await page.getByLabel("Upload background").setInputFiles({
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
test("two-finger scroll pans and pinch zooms the canvas, not the page", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Canvas", exact: true }).click();
  const zoom = page.locator(".zoom-controls span");
  await expect(zoom).toHaveText("100%");
  const surface = page.locator(".canvas-surface");
  const prevented = await surface.evaluate((el) => {
    const e = new WheelEvent("wheel", {
      deltaY: -100,
      ctrlKey: true,
      clientX: 400,
      clientY: 300,
      bubbles: true,
      cancelable: true,
    });
    el.dispatchEvent(e);
    return e.defaultPrevented;
  });
  expect(prevented).toBe(true);
  await expect(zoom).not.toHaveText("100%");
  const b = (await surface.boundingBox())!;
  await page.mouse.move(b.x + 200, b.y + 200);
  const before = await surface.evaluate((el) => el.style.backgroundPosition);
  const zoomed = await zoom.textContent();
  await page.mouse.wheel(120, 300);
  await expect
    .poll(() => surface.evaluate((el) => el.style.backgroundPosition))
    .not.toBe(before);
  await expect(zoom).toHaveText(zoomed!);
  await page.keyboard.press("ControlOrMeta+0");
  await expect(zoom).toHaveText("100%");
  await page.keyboard.press("ControlOrMeta+=");
  await expect(zoom).toHaveText("125%");
});
test("single-key canvas shortcuts switch tools and Escape returns to select", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Canvas", exact: true }).click();
  const tool = (name: string) =>
    page.getByRole("button", { name, exact: true });
  await expect(tool("Select")).toHaveAttribute("aria-pressed", "true");
  for (const [key, name] of [
    ["r", "Rectangle"],
    ["o", "Ellipse"],
    ["Shift+T", "Triangle"],
    ["a", "Arrow"],
    ["t", "Text"],
    ["e", "Eraser"],
  ]) {
    await page.keyboard.press(key);
    await expect(tool(name)).toHaveAttribute("aria-pressed", "true");
  }
  await page.keyboard.press("Escape");
  await expect(tool("Select")).toHaveAttribute("aria-pressed", "true");
  const b = (await page.locator(".canvas-surface").boundingBox())!;
  await page.keyboard.press("s");
  await page.mouse.move(b.x + 300, b.y + 300);
  await page.mouse.down();
  await page.mouse.move(b.x + 480, b.y + 360, { steps: 6 });
  await page.mouse.up();
  const square = page.locator("[data-item] rect").first();
  expect(await square.getAttribute("width")).toBe(
    await square.getAttribute("height"),
  );
  await expect(tool("Select")).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("?");
  await expect(
    page.getByRole("dialog", { name: "Keyboard shortcuts" }),
  ).toBeVisible();
});
test("text is typed and edited directly on the canvas", async ({ page }) => {
  await page.getByRole("button", { name: "Canvas", exact: true }).click();
  const b = (await page.locator(".canvas-surface").boundingBox())!;
  await page.keyboard.press("t");
  await page.mouse.click(b.x + 400, b.y + 300);
  const editor = page.getByLabel("Edit text");
  await expect(editor).toBeFocused();
  await page.keyboard.type("Hello canvas");
  await page.keyboard.press("Enter");
  await expect(editor).toHaveCount(0);
  const item = page.locator("[data-item]").filter({ hasText: "Hello canvas" });
  await expect(item).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Select", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await item.dblclick();
  await editor.fill("Edited in place");
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-item]")).toContainText("Edited in place");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator("[data-item]")).toContainText("Hello canvas");
  await page.keyboard.press("t");
  await page.mouse.click(b.x + 200, b.y + 500);
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-item]")).toHaveCount(1);
});
test("Tab indents inside the code editor", async ({ page }) => {
  const editor = page.getByLabel("Code block 1", { exact: true });
  await editor.fill("return 1;");
  await editor.press("Home");
  await editor.press("Tab");
  await expect(editor).toHaveValue("  return 1;");
});
test("export tab downloads directly", async ({ page }) => {
  await page
    .getByRole("button", { name: "Export", exact: true })
    .last()
    .click();
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JPEG" }).click();
  expect((await promise).suggestedFilename()).toBe("flair-card.jpg");
});
test("code is edited directly on the card", async ({ page }) => {
  await page.getByRole("button", { name: "Typography", exact: true }).click();
  await page.locator(".code-window-bar").first().click();
  const editor = page.getByLabel("Code block 1", { exact: true });
  await expect(editor).toBeFocused();
  await editor.fill('const flair = "inline";');
  await expect(page.locator(".code-window .line-text").first()).toHaveText(
    'const flair = "inline";',
  );
  // The overlay covers exactly the same box as the rendered code.
  const [syntax, overlay] = await page.evaluate(() =>
    [".code-window .syntax", ".code-window .code-editor"].map((q) => {
      const r = document.querySelector(q)!.getBoundingClientRect();
      return [r.x, r.y, r.width, r.height].map(Math.round).join();
    }),
  );
  expect(overlay).toBe(syntax);
});
test("dragging empty canvas box-selects instead of panning", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Canvas", exact: true }).click();
  await page.getByRole("button", { name: "Flowchart" }).click();
  const surface = page.locator(".canvas-surface");
  const b = (await surface.boundingBox())!;
  const before = await surface.evaluate((el) => el.style.backgroundPosition);
  await page.mouse.move(b.x + 5, b.y + b.height - 80);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width - 5, b.y + 70, { steps: 10 });
  await page.mouse.up();
  expect(await surface.evaluate((el) => el.style.backgroundPosition)).toBe(
    before,
  );
  await expect(page.locator(".props-head strong")).toContainText("objects");
});
test("auto-sized card wraps the code with padding", async ({ page }) => {
  const art = page.locator(".card-art");
  const win = page.locator(".code-window").first();
  const a = (await art.boundingBox())!;
  const w = (await win.boundingBox())!;
  // Background hugs the window: equal margins on all sides.
  const left = w.x - a.x,
    top = w.y - a.y;
  expect(Math.abs(left - (a.x + a.width - (w.x + w.width)))).toBeLessThan(2);
  expect(Math.abs(top - (a.y + a.height - (w.y + w.height)))).toBeLessThan(2);
  expect(Math.abs(left - top)).toBeLessThan(2);
  await expect(page.locator(".size-chip")).toContainText("Auto");
});
test("Windows-style window controls sit on the right", async ({ page }) => {
  await page.getByRole("button", { name: "Window", exact: true }).click();
  await page.getByRole("button", { name: "Windows", exact: true }).click();
  const bar = (await page.locator(".code-window-bar").first().boundingBox())!;
  const controls = (await page.locator(".windows-controls").boundingBox())!;
  expect(controls.x).toBeGreaterThan(bar.x + bar.width / 2);
});
test("solid background colors apply to the card", async ({ page }) => {
  await page.getByRole("button", { name: "Solid", exact: true }).click();
  await page.getByRole("button", { name: "Solid #e7e5e0" }).click();
  await expect(page.locator(".card-background")).toHaveCSS(
    "background-color",
    "rgb(231, 229, 224)",
  );
});
