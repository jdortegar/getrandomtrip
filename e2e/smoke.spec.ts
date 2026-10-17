import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("Spanish landing renders on the unprefixed URL", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.locator("main, body").first()).toBeVisible();
  });

  test("English landing renders under /en", async ({ page }) => {
    const response = await page.goto("/en");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("landing has no horizontal overflow", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
