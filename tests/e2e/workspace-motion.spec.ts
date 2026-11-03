import type { Page } from "@playwright/test";

import { expect, test } from "./browser-evidence";

async function runningWavefrontAnimations(page: Page): Promise<number> {
  return page.evaluate(() => [...document.querySelectorAll(".wavefront-signature circle")]
    .flatMap((circle) => circle.getAnimations())
    .filter((animation) => animation.playState === "running").length);
}

test("anchors the Add menu under its trigger", async ({ page }) => {
  await page.goto("/classic");
  const add = page.getByTestId("add-object");
  await add.click();
  const menu = page.getByRole("dialog", { name: "Add object" });
  await expect(menu).toBeVisible();
  const [trigger, popover] = await Promise.all([add.boundingBox(), menu.boundingBox()]);
  if (!trigger || !popover) throw new Error("Add menu is not visible.");
  expect(Math.abs(popover.x - trigger.x)).toBeLessThanOrEqual(1);
  expect(popover.y).toBeGreaterThanOrEqual(trigger.y + trigger.height);
  expect(popover.y - (trigger.y + trigger.height)).toBeLessThan(16);
});

test("pulses the source wavefront only while audio plays", async ({ page }) => {
  await page.goto("/classic");
  await expect(page.locator(".wavefront-signature circle")).not.toHaveCount(0);
  expect(await runningWavefrontAnimations(page)).toBe(0);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeVisible();
  await expect.poll(() => runningWavefrontAnimations(page)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  await expect.poll(() => runningWavefrontAnimations(page)).toBe(0);
});

test("opens popovers instantly from the keyboard and with a short transition from the pointer", async ({ page }) => {
  await page.goto("/classic");
  const trigger = page.getByRole("button", { name: /^Project:/ });
  const duration = () => page.locator("#workspace-project-menu").evaluate((element) => getComputedStyle(element).transitionDuration);

  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Project" })).toBeVisible();
  expect(await duration()).toBe("0s");
  await page.keyboard.press("Escape");

  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Project" })).toBeVisible();
  expect(await duration()).not.toBe("0s");
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("keeps fades but drops movement, scale and the looping wavefront", async ({ page }) => {
    await page.goto("/classic");
    const tokens = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return ["--press-scale", "--pop-scale", "--toast-shift", "--dur-move"].map((name) => style.getPropertyValue(name).trim());
    });
    expect(tokens.slice(0, 3)).toEqual(["1", "1", "0px"]);
    // Chrome may serialise the zero duration as "0s" or "0ms"; either means no movement transition.
    expect(tokens[3]).toMatch(/^0(ms|s)$/);
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeVisible();
    expect(await runningWavefrontAnimations(page)).toBe(0);
    const popoverTransition = await page.getByTestId("add-object").evaluate(() => {
      const probe = document.createElement("div");
      probe.className = "add-object-popover";
      document.body.append(probe);
      const value = getComputedStyle(probe).transitionProperty;
      probe.remove();
      return value;
    });
    expect(popoverTransition).toContain("opacity");
  });
});
