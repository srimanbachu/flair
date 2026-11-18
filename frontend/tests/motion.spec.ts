import { test, expect } from "@playwright/test";

test("buttons ease their hover and press feedback", async ({ page }) => {
  await page.goto("/cards/typography");
  const save = page.getByRole("button", { name: /^Save/ });
  // Every button shares the fast timing token and the same easing curve.
  await expect(save).toHaveCSS("transition-duration", /0\.12s/);
  await expect(save).toHaveCSS(
    "transition-timing-function",
    /cubic-bezier\(0\.2, 0, 0, 1\)/,
  );
  // Holding the pointer down dips the button slightly.
  const box = (await save.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect
    .poll(() => save.evaluate((el) => getComputedStyle(el).transform))
    .toMatch(/^matrix\(0\.9/);
  await page.mouse.up();
  await expect
    .poll(() => save.evaluate((el) => getComputedStyle(el).transform))
    .toBe("none");
});

test("menus and popovers animate in from their trigger", async ({ page }) => {
  await page.goto("/cards/typography");
  await page.locator(".export-wrap > button").click();
  await expect(page.locator(".export-menu")).toHaveCSS(
    "animation-name",
    "drop-in",
  );
  await page.locator(".menu-dismiss").click();
  await page.getByText("Line effects").click();
  await expect(page.locator(".effects-body")).toHaveCSS(
    "animation-name",
    "rise-in",
  );
});

test("theme changes cross-fade, then hand timing back", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/cards");
  const html = page.locator("html");
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(html).toHaveClass(/theme-fading/);
  // The fade class is temporary so it never slows ordinary hovers.
  await expect(html).not.toHaveClass(/theme-fading/, { timeout: 2000 });
});

test("reduced motion switches every transition and animation off", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("/cards/typography");
  const save = page.getByRole("button", { name: /^Save/ });
  await expect(save).toHaveCSS("transition-duration", "0s");
  await page.locator(".export-wrap > button").click();
  await expect(page.locator(".export-menu")).toHaveCSS(
    "animation-name",
    "none",
  );
  await page.locator(".menu-dismiss").click();
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).not.toHaveClass(/theme-fading/);
});
