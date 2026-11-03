import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./browser-evidence";

function outlinerOf(page: Page): Locator {
  return page.getByRole("complementary", { name: "Scene Outliner" });
}

function groupCount(outliner: Locator, label: string): Locator {
  return outliner.locator(".outliner-group").filter({ has: outliner.page().getByText(label, { exact: true }) }).locator(".outliner-count");
}

test("shows each group's count against its limit", async ({ page }) => {
  await page.goto("/lab");
  const outliner = outlinerOf(page);
  const listeners = await outliner.locator(".outliner-row.kind-listener").count();
  const sources = await outliner.locator(".outliner-row.kind-source").count();
  const geometry = await outliner.locator(".outliner-row.kind-wall, .outliner-row.kind-portal, .outliner-row.kind-primitive").count();
  await expect(groupCount(outliner, "Listeners")).toHaveText(`${listeners} / 8`);
  await expect(groupCount(outliner, "Sources")).toHaveText(`${sources} / 4`);
  await expect(groupCount(outliner, "Geometry")).toHaveText(`${geometry}`);
  await expect(groupCount(outliner, "Geometry")).toHaveAttribute("title", /^Walls \d+ \/ 100 · Portals \d+ \/ 8 · Shapes \d+ \/ 8$/);
});

test("adds a listener and sources from the group headers and disables the button at the limit", async ({ page }) => {
  await page.goto("/lab");
  const outliner = outlinerOf(page);
  const listenersBefore = await outliner.locator(".outliner-row.kind-listener").count();
  await outliner.getByRole("button", { name: "Add listener", exact: true }).click();
  await expect(outliner.locator(".outliner-row.kind-listener")).toHaveCount(listenersBefore + 1);
  await expect(groupCount(outliner, "Listeners")).toHaveText(`${listenersBefore + 1} / 8`);
  // A newly added listener becomes the audible receiver, as with the toolbar Add menu.
  await expect(outliner.locator(".outliner-row.kind-listener").last()).toContainText("Active");

  const addSource = outliner.getByRole("button", { name: "Add source", exact: true });
  for (let count = await outliner.locator(".outliner-row.kind-source").count(); count < 4; count += 1) {
    await addSource.click();
    await expect(page.getByRole("dialog", { name: "Choose source audio" })).toBeVisible();
    await page.getByRole("dialog", { name: "Choose source audio" }).getByRole("button", { name: "Voice loop" }).click();
    await expect(outliner.locator(".outliner-row.kind-source")).toHaveCount(count + 1);
  }
  await expect(groupCount(outliner, "Sources")).toHaveText("4 / 4");
  await expect(addSource).toBeDisabled();
  await expect(addSource).toHaveAttribute("title", "Limit: 4 sources");
});

test("opens a geometry Add menu under its button with the shared rules", async ({ page }) => {
  await page.goto("/lab");
  const outliner = outlinerOf(page);
  const trigger = outliner.getByRole("button", { name: "Add geometry", exact: true });
  await trigger.click();
  const menu = page.getByRole("dialog", { name: "Add geometry" });
  await expect(menu).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const [button, popover] = await Promise.all([trigger.boundingBox(), menu.boundingBox()]);
  if (!button || !popover) throw new Error("Geometry menu is not visible.");
  expect(Math.abs(popover.x - button.x)).toBeLessThanOrEqual(1);
  expect(popover.y).toBeGreaterThanOrEqual(button.y + button.height);
  expect(popover.y - (button.y + button.height)).toBeLessThan(16);
  expect(popover.y + popover.height).toBeLessThanOrEqual(page.viewportSize()!.height);

  await expect(menu.getByRole("button")).toHaveText(["×", "WWall", "PPortal Select an enabled Wall first", "□Box", "○Cylinder", "●Sphere"]);
  await expect(page.getByTestId("outliner-add-portal")).toBeDisabled();

  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  const shapes = await outliner.locator(".outliner-row.kind-primitive").count();
  await trigger.click();
  await page.getByTestId("outliner-add-box").click();
  await expect(menu).toHaveCount(0);
  await expect(outliner.locator(".outliner-row.kind-primitive")).toHaveCount(shapes + 1);
  await expect(page.getByRole("complementary", { name: "Inspector" }).locator(".inspector-type")).toHaveText("Box");
});

test("turns a row on and off in one action without changing the selection", async ({ page }) => {
  await page.goto("/lab");
  const outliner = outlinerOf(page);
  await outliner.getByRole("button", { name: "Room dimensions", exact: true }).click();
  await expect(outliner.getByRole("button", { name: /^Turn (off|on) Room/ })).toHaveCount(0);
  await expect(outliner.getByRole("button", { name: /^Turn (off|on) Floor/ })).toHaveCount(0);

  // The row's name gains an "Off" chip while the source is off.
  const row = outliner.getByRole("button", { name: /^Radio( Off)?$/ });
  const off = outliner.getByRole("button", { name: "Turn off Radio", exact: true });
  await row.hover();
  await expect(off).toBeVisible();
  await off.click();
  await expect(row).toHaveClass(/is-disabled/);
  await expect(row).toContainText("Off");
  await expect(row).toHaveAttribute("aria-pressed", "false");
  await expect(outliner.getByRole("button", { name: "Room dimensions", exact: true })).toHaveAttribute("aria-pressed", "true");
  // An off row keeps its toggle visible so it can be turned back on without hovering.
  await page.mouse.move(0, 0);
  const on = outliner.getByRole("button", { name: "Turn on Radio", exact: true });
  await expect(on).toHaveCSS("opacity", "1");

  await page.keyboard.press("Control+z");
  await expect(row).not.toHaveClass(/is-disabled/);
  await page.keyboard.press("Control+Shift+z");
  await expect(row).toHaveClass(/is-disabled/);
  await on.click();
  await expect(row).not.toHaveClass(/is-disabled/);
  await expect(row).not.toContainText("Off");
});

test("keeps the last enabled listener on", async ({ page }) => {
  await page.goto("/lab");
  const outliner = outlinerOf(page);
  const listeners = outliner.locator(".outliner-row.kind-listener");
  await expect(listeners).toHaveCount(1);
  const name = (await listeners.first().locator("span").textContent()) ?? "";
  await outliner.getByRole("button", { name: `Turn off ${name}`, exact: true }).click();
  await expect(page.getByText("At least one listener must remain enabled.")).toBeVisible();
  await expect(listeners.first()).not.toHaveClass(/is-disabled/);
});
