import type { Page } from "@playwright/test";

import { expect, test } from "./browser-evidence";

const DESKTOP_SIZES = [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

async function overlappingLabelPairs(page: Page): Promise<string[][]> {
  return page.getByTestId("hybrid-viewport-label-layer").evaluate((layer) => {
    const boxes = [...layer.querySelectorAll("text")].map((text) => ({ text: text.textContent ?? "", rect: text.getBoundingClientRect() }));
    const pairs: string[][] = [];
    for (let left = 0; left < boxes.length; left += 1) {
      for (let right = left + 1; right < boxes.length; right += 1) {
        const a = boxes[left]!.rect;
        const b = boxes[right]!.rect;
        if (Math.min(a.right, b.right) > Math.max(a.left, b.left) && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top)) {
          pairs.push([boxes[left]!.text, boxes[right]!.text]);
        }
      }
    }
    return pairs;
  });
}

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

test("keeps Hybrid viewport labels apart and shows coordinates only for the selection", async ({ page }) => {
  await page.goto("/lab");
  const viewport = page.getByTestId("hybrid-spatial-viewport");
  const labels = page.getByTestId("hybrid-viewport-label-layer");
  await expect(labels.locator("text")).not.toHaveCount(0);
  await expect(labels.locator(".hybrid-viewport-object-value")).toHaveCount(1);
  expect(await overlappingLabelPairs(page)).toEqual([]);

  await page.getByRole("complementary", { name: "Scene Outliner" }).getByRole("button", { name: "Radio", exact: true }).click();
  await expect(labels.locator(".hybrid-viewport-object-value")).toHaveCount(1);
  await expect(labels.locator(".hybrid-viewport-object-value")).toHaveText("X 9.0 · Y 1.5 · Z 4.0");
  expect(await overlappingLabelPairs(page)).toEqual([]);
  // Exact coordinates of every object remain in its accessible name.
  await expect(page.getByTestId("hybrid-viewport-listener")).toHaveAttribute("aria-label", /X 3\.0 m, Y 1\.5 m, Z 4\.0 m/);

  for (const view of ["Top", "Front", "Home"]) {
    await viewport.getByRole("button", { name: view, exact: true }).click();
    expect(await overlappingLabelPairs(page), view).toEqual([]);
  }
});

test("styles overlay actions like workspace controls and separates disabled reasons", async ({ page }) => {
  await page.goto("/classic");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  const reset = page.getByRole("alertdialog", { name: "Reset active project" }).getByRole("button", { name: "Reset project" });
  const style = await reset.evaluate((element) => {
    const computed = getComputedStyle(element);
    return { borderStyle: computed.borderTopStyle, background: computed.backgroundColor };
  });
  expect(style).toEqual({ borderStyle: "solid", background: "rgba(0, 0, 0, 0)" });
  await page.getByRole("button", { name: "Cancel", exact: true }).click();

  await page.getByTestId("add-object").click();
  await expect(page.getByTestId("add-portal")).toBeDisabled();
  await expect(page.getByTestId("add-portal")).toContainText("Portal Select an enabled Wall first");
});

test("keeps workspace chrome text at 11 px or larger with tabular numerals", async ({ page }) => {
  for (const route of ["/classic", "/lab"]) {
    await page.goto(route);
    await page.getByRole("complementary", { name: "Scene Outliner" }).getByRole("button", { name: "Radio", exact: true }).click();
    const report = await page.getByTestId("unified-workspace").evaluate((root) => {
      const small: string[] = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const element = walker.currentNode.parentElement;
        if (!element || !walker.currentNode.textContent?.trim() || element.closest("svg")) continue;
        const box = element.getBoundingClientRect();
        if (!box.width || !box.height) continue;
        const size = Number.parseFloat(getComputedStyle(element).fontSize);
        if (size < 11) small.push(`${element.textContent?.trim().slice(0, 30)} (${size}px)`);
      }
      const numeric = root.querySelector<HTMLInputElement>('input[aria-label="X position"]')!;
      return { small, numeric: getComputedStyle(numeric).fontVariantNumeric };
    });
    expect(report.small, route).toEqual([]);
    expect(report.numeric).toContain("tabular-nums");
  }
});
