import { test, expect } from "@playwright/test";

test.describe("Designer App", () => {
  test("loads the designer page with all three panels", async ({ page }) => {
    await page.goto("/designer");

    // The designer should mount with toolbar, palette, canvas, inspector
    await expect(page.locator(".designer-page")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".designer-toolbar")).toBeVisible();
    await expect(page.locator(".component-palette")).toBeVisible();
    await expect(page.locator(".eods-canvas")).toBeVisible();
    await expect(page.locator(".property-inspector")).toBeVisible();
  });

  test("palette lists all component categories", async ({ page }) => {
    await page.goto("/designer");

    // Palette should show category sections with component entries
    const paletteItems = page.locator(".palette-item");
    const count = await paletteItems.count();
    expect(count).toBeGreaterThanOrEqual(4); // layout, form, data, action

    // Layout category should exist
    await expect(page.locator(".palette-category:has-text('Layout')")).toBeVisible();
  });

  test("empty canvas shows drop hint", async ({ page }) => {
    await page.goto("/designer");

    // Empty canvas should show a hint message
    await expect(
      page.locator(".eods-canvas__empty-text:has-text('Drag')")
    ).toBeVisible();
  });

  test("property inspector shows placeholder when nothing selected", async ({ page }) => {
    await page.goto("/designer");

    // With no component selected, show a hint
    await expect(
      page.locator(".property-inspector--empty")
    ).toBeVisible();
  });
});

test.describe("Render Engine", () => {
  test("preview page renders without crashing", async ({ page }) => {
    await page.goto("/preview");

    // The render engine mounts even without a layout
    await expect(page.locator('[data-eowl-renderer]')).toBeAttached({
      timeout: 10000,
    });
  });
});

test.describe("Navigation", () => {
  test("wildcard route redirects to designer", async ({ page }) => {
    await page.goto("/some-unknown-path");

    // The app should render the designer page (catch-all wildcard)
    await expect(page.locator(".designer-page")).toBeVisible({ timeout: 10000 });
  });
});
