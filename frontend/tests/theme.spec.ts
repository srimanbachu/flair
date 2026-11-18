import { test, expect } from "@playwright/test";

const routes = ["/cards", "/canvas", "/dev-tools", "/projects"];

for (const width of [1920, 1440, 1101, 900, 761, 390])
  test(`workspace switch stays in one place at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    let first: { x: number; y: number; width: number } | null = null;
    for (const route of routes) {
      await page.goto(route);
      const nav = page.getByLabel("Workspace");
      await expect(nav).toBeVisible();
      // Measure after the web font swaps in, so text width is final.
      await page.evaluate(() => document.fonts.ready);
      const box = (await nav.boundingBox())!;
      const pos = { x: box.x, y: box.y, width: box.width };
      if (!first) first = pos;
      else expect(pos, `${route} at ${width}px`).toEqual(first);
      // On one-row headers the actions never run into the switch.
      if (width > 760 && route !== "/dev-tools") {
        const actions = (await page.locator(".header-actions").boundingBox())!;
        expect(actions.x).toBeGreaterThanOrEqual(box.x + box.width);
      }
    }
  });

test("theme toggle switches, persists and follows the saved choice", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/cards");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(0, 0, 0)",
  );

  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#ffffff",
  );

  // The saved choice wins over the system preference, on any route.
  await page.goto("/dev-tools");
  await expect(html).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
});

test("first visit follows the system theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/cards");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("the canvas board stays dark in light mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/canvas");
  await expect(page.locator(".canvas-surface")).toHaveCSS(
    "background-color",
    "rgb(0, 0, 0)",
  );
  await expect(page.locator(".studio-header")).toBeVisible();
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
});

test("studio chrome has no strokes", async ({ page }) => {
  await page.goto("/cards/window");
  const stroked = await page.evaluate(() => {
    const chrome = document.querySelectorAll(
      ".studio-header, .studio-header *, .tool-rail, .tool-rail *, .inspector, .inspector *, .block-bar, .block-bar *",
    );
    return [...chrome]
      .filter((el) => {
        if (el.closest(".mini-window, .size-grid .ratio")) return false;
        const s = getComputedStyle(el);
        return ["Top", "Right", "Bottom", "Left"].some(
          (side) =>
            parseFloat(
              s.getPropertyValue(`border-${side.toLowerCase()}-width`),
            ) > 0 &&
            s.getPropertyValue(`border-${side.toLowerCase()}-style`) !== "none",
        );
      })
      .map((el) => el.className || el.tagName);
  });
  expect(stroked).toEqual([]);
});

for (const theme of ["dark", "light"] as const)
  test(`hovering the card never paints over the code (${theme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto("/cards/typography");
    const editor = page.locator("textarea.code-editor").first();
    await page.locator(".code-window").first().hover();
    await expect(editor).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await editor.focus();
    await expect(editor).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    const title = page.getByLabel("Card title");
    await title.hover();
    await expect(title).not.toHaveCSS("background-color", "rgb(28, 28, 28)");
  });

test("Dev Tools search row controls share one height and line", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dev-tools");
  const boxes = await Promise.all(
    [".dev-search", ".dev-collection-select", ".dev-categories"].map(
      async (s) => (await page.locator(s).boundingBox())!,
    ),
  );
  for (const b of boxes) {
    expect(b.height).toBe(40);
    expect(b.y).toBe(boxes[0].y);
  }
});
