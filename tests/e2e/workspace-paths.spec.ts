import { expect, test } from "@playwright/test";

test("shows matched direct and first-order 3D paths with presentation controls", async ({ page }) => {
  await page.goto("/lab");
  const overlay = page.getByTestId("hybrid-path-overlay");
  await expect(overlay).toBeVisible();
  await expect(overlay.locator('[data-path-kind="reflection"]')).not.toHaveCount(0);
  await expect(overlay.locator('[data-source-id="radio"]')).not.toHaveCount(0);
  await expect(overlay.locator('[data-source-id="rain"]')).toHaveCount(0);
  await expect(overlay.locator(".hybrid-display-path.is-xray")).not.toHaveCount(0);
  const reflection = overlay.getByRole("img", { name: /reflection;/ }).first();
  await reflection.focus();
  await expect(overlay.locator(".hybrid-reflection-card")).toContainText(/m.*ms.*dB/);
  await page.getByRole("button", { name: "Show all paths" }).click();
  await expect(overlay.locator('[data-source-id="rain"]')).not.toHaveCount(0);
  await page.getByRole("button", { name: "Paths", exact: true }).click();
  await expect(overlay).toHaveCount(0);
  await page.getByRole("button", { name: "Paths", exact: true }).click();
  await expect(overlay).toBeVisible();
  await page.getByTestId("hybrid-spatial-viewport").getByRole("button", { name: "Ceiling" }).click();
  await expect(page.locator(".hybrid-viewport-ceiling")).toHaveCount(0);
  await expect(overlay).toBeVisible();
});

test("keeps the production audio render gate finite and continuous", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => typeof window.__echoCanvasRenderGateCValidation === "function");
  const result = await page.evaluate(() => window.__echoCanvasRenderGateCValidation!());
  expect(result.available).toBe(true);
  expect(result.finite).toBe(true);
  expect(result.transitionMaxStepRatio).toBeLessThanOrEqual(0.01);
});

test("labels the selected source's accepted arrival direction accessibly without changing revision", async ({ page }) => {
  await page.goto("/lab");
  const statusbar = page.locator(".workspace-statusbar");
  const label = page.getByRole("note", { name: /^Arrival direction for Radio/ });
  await expect(label).toHaveAttribute("data-state", "ready");
  await expect(label).toHaveAttribute("data-route-type", "direct");
  await expect(label).toContainText("Arrival · Radio · Direct · az 90.0° · el 0.0°");
  await expect(label).toContainText("not rotated by listener heading");
  await label.focus();
  await expect(label).toBeFocused();

  await page.getByRole("complementary", { name: "Scene Outliner" }).getByRole("button", { name: "Rain", exact: true }).click();
  const blocked = page.getByTestId("hybrid-arrival-label");
  await expect(blocked).toHaveAttribute("data-route-type", "blocked");
  await expect(blocked).toContainText("Rain · Blocked line of sight · az 109.7° · el 0.0°");
  await expect(blocked).toHaveAccessibleName(/azimuth 109\.7 degrees, elevation 0\.0 degrees/);

  const revision = await statusbar.getAttribute("data-acoustic-revision");
  const sequence = await statusbar.getAttribute("data-acoustic-sequence");
  await page.getByRole("button", { name: "Paths", exact: true }).click();
  await expect(blocked).toHaveCount(0);
  await page.getByRole("button", { name: "Paths", exact: true }).click();
  await expect(blocked).toHaveAttribute("data-state", "ready");
  await expect(statusbar).toHaveAttribute("data-acoustic-revision", revision ?? "");
  await expect(statusbar).toHaveAttribute("data-acoustic-sequence", sequence ?? "");
});
