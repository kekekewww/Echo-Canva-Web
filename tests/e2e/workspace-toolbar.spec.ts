import { expect, test } from "./browser-evidence";
import { openProjectMenu, selectPreset } from "./workspace-helpers";

test("keeps project tools in the scene menu and selection editing in the Inspector", async ({ page }) => {
  await page.goto("/classic");
  const inspector = page.getByRole("complementary", { name: "Inspector" });
  const trigger = page.getByRole("button", { name: /^Project:/ });
  const menu = page.getByRole("dialog", { name: "Project" });

  await expect(inspector.getByLabel("Scene preset")).toHaveCount(0);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeHidden();

  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  for (const control of [
    menu.getByLabel("Scene preset"),
    menu.getByRole("button", { name: "Export authoring JSON" }),
    menu.getByLabel("Describe a scene"),
    menu.getByRole("button", { name: "Reset 2.5D project…" }),
    menu.getByRole("button", { name: "Clear all local data…" }),
  ]) await expect(control).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();

  await openProjectMenu(page);
  await page.getByRole("complementary", { name: "Scene Outliner" }).getByRole("button", { name: "Radio", exact: true }).click();
  await expect(menu).toBeHidden();

  await selectPreset(page, "hard-room");
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "Project: Hard Room" })).toBeVisible();
});

test("keeps an unapplied AI prompt when the project menu closes", async ({ page }) => {
  await page.goto("/classic");
  await openProjectMenu(page);
  await page.getByLabel("Describe a scene").fill("A small rehearsal room");
  await page.keyboard.press("Escape");
  await openProjectMenu(page);
  await expect(page.getByLabel("Describe a scene")).toHaveValue("A small rehearsal room");
});

test("shows the preview state and ignores repeated Play while audio starts", async ({ page }) => {
  // Delay built-in clip downloads so the start is observably pending.
  await page.route("**/audio/*.wav", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    await route.continue();
  });
  await page.goto("/classic");
  const workspace = page.getByTestId("unified-workspace");
  const simulated = page.getByRole("button", { name: "Simulated", exact: true });
  const raw = page.getByRole("button", { name: "Raw", exact: true });
  await expect(simulated).toHaveAttribute("aria-pressed", "true");
  await expect(raw).toHaveAttribute("aria-pressed", "false");

  const play = page.locator(".workspace-play");
  await play.click();
  await expect(play).toHaveAttribute("aria-busy", "true");
  await expect(play).toContainText("Starting…");
  await play.click();
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeVisible();
  await expect(play).not.toHaveAttribute("aria-busy", "true");
  await expect(workspace).toHaveAttribute("data-audio-contexts", "1");

  await raw.click();
  await expect(raw).toHaveAttribute("aria-pressed", "true");
  await expect(simulated).toHaveAttribute("aria-pressed", "false");
});
