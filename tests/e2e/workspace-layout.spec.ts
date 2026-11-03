import { expect, test } from "./browser-evidence";

const DESKTOP_SIZES = [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

test("keeps both viewports inside their panel without scrolling on desktop sizes", async ({ page }) => {
  for (const size of DESKTOP_SIZES) {
    await page.setViewportSize(size);
    for (const route of ["/classic", "/lab"]) {
      await page.goto(route);
      const panel = page.locator(".workspace-viewport-panel");
      await expect(panel.locator("svg").first()).toBeVisible();
      const layout = await panel.evaluate((element) => {
        const bottom = element.getBoundingClientRect().top + element.clientHeight;
        const legend = element.querySelector(".canvas-legend")?.getBoundingClientRect();
        const svg = element.querySelector("svg.scene-canvas, svg.hybrid-viewport-svg")!.getBoundingClientRect();
        return { clientHeight: element.clientHeight, scrollHeight: element.scrollHeight, bottom, legendBottom: legend?.bottom ?? null, svgBottom: svg.bottom };
      });
      expect(layout.scrollHeight, `${route} at ${size.width}×${size.height}`).toBeLessThanOrEqual(layout.clientHeight);
      expect(layout.svgBottom).toBeLessThanOrEqual(layout.bottom + 0.5);
      if (layout.legendBottom !== null) expect(layout.legendBottom).toBeLessThanOrEqual(layout.bottom);
    }
  }
});
