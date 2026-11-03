import type { Page } from "@playwright/test";

/** Opens the toolbar project menu (scene name button) unless it is already open. */
export async function openProjectMenu(page: Page): Promise<void> {
  const menu = page.getByRole("dialog", { name: "Project" });
  if (await menu.isVisible()) return;
  await page.getByRole("button", { name: /^Project:/ }).click();
  await menu.waitFor({ state: "visible" });
}

/** Loads a scene preset from the project menu; the menu closes after the scene is replaced. */
export async function selectPreset(page: Page, presetId: string): Promise<void> {
  await openProjectMenu(page);
  await page.getByLabel("Scene preset").selectOption(presetId);
}
