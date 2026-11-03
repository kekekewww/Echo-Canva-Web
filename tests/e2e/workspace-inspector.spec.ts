import { expect, test } from "./browser-evidence";
import { deleteSelection } from "./workspace-helpers";

async function sectionTitles(page: import("@playwright/test").Page): Promise<string[]> {
  return page.getByRole("complementary", { name: "Inspector" }).locator(".inspector-section > h3").allTextContents();
}

test("names the selection in the Inspector header and keeps one section order", async ({ page }) => {
  await page.goto("/lab");
  const inspector = page.getByRole("complementary", { name: "Inspector" });
  const outliner = page.getByRole("complementary", { name: "Scene Outliner" });

  await outliner.getByRole("button", { name: /^Listener/ }).first().click();
  await expect(inspector.locator(".inspector-title")).toHaveText("Listener");
  await expect(inspector.locator(".inspector-type")).toHaveText("Listener");
  await expect(inspector.locator(".inspector-chip")).toHaveText("Active");
  expect(await sectionTitles(page)).toEqual(["Placement"]);

  await outliner.getByRole("button", { name: "Radio", exact: true }).click();
  await expect(inspector.getByRole("textbox", { name: "Source name" })).toHaveValue("Radio");
  expect(await sectionTitles(page)).toEqual(["Placement", "Acoustics"]);

  await outliner.getByRole("button", { name: "partition center", exact: true }).click();
  await expect(inspector.locator(".inspector-title")).toHaveText("partition center");
  expect(await sectionTitles(page)).toEqual(["Shape", "Acoustics"]);

  await outliner.getByRole("button", { name: "Room dimensions", exact: true }).click();
  expect(await sectionTitles(page)).toEqual(["Shape", "Acoustics"]);
  await expect(inspector.getByRole("button", { name: "More actions" })).toHaveCount(0);

  await outliner.getByRole("button", { name: "Radio", exact: true }).click();
  await inspector.getByRole("button", { name: "More actions" }).click();
  await expect(inspector.getByRole("button", { name: "Move to room centre" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(inspector.getByRole("button", { name: "Move to room centre" })).toBeHidden();
  await expect(inspector.getByRole("button", { name: "More actions" })).toBeFocused();
});

test("shows a scene summary with limits when nothing is selected", async ({ page }) => {
  await page.goto("/classic");
  const inspector = page.getByRole("complementary", { name: "Inspector" });
  await page.getByRole("complementary", { name: "Scene Outliner" }).getByRole("button", { name: "Rain", exact: true }).click();
  await deleteSelection(page);
  await expect(inspector.locator(".inspector-title")).toHaveText("Scene");
  await expect(inspector).toContainText("Sources");
  await expect(inspector).toContainText("1 / 4");
  await expect(inspector).toContainText("RT60 (mid)");
  await expect(inspector.getByRole("button", { name: "Add source" })).toBeVisible();
});

test("deletes with the Delete key, offers Undo, and drops the toast after the next edit", async ({ page }) => {
  await page.goto("/classic");
  const outliner = page.getByRole("complementary", { name: "Scene Outliner" });
  const rain = outliner.getByRole("button", { name: "Rain", exact: true });
  await rain.click();
  await rain.press("Delete");
  await expect(rain).toHaveCount(0);
  const toast = page.getByRole("status").filter({ hasText: "Deleted Rain" });
  await expect(toast).toBeVisible();

  // Any later history step makes the toast's Undo ambiguous, so it disappears.
  await outliner.getByRole("button", { name: "Radio", exact: true }).click();
  const gain = page.getByRole("textbox", { name: "Source gain" });
  await gain.fill("-9");
  await gain.press("Enter");
  await expect(toast).toBeHidden();

  // Ctrl+Z still walks back through both steps.
  await page.getByTitle("Undo (Ctrl+Z)").click();
  await page.getByTitle("Undo (Ctrl+Z)").click();
  await expect(outliner.getByRole("button", { name: "Rain", exact: true })).toBeVisible();
});

test("never shows an Undo toast for a refused delete", async ({ page }) => {
  await page.goto("/classic");
  await page.getByRole("complementary", { name: "Scene Outliner" }).getByRole("button", { name: /^Listener/ }).first().click();
  await deleteSelection(page);
  await expect(page.getByRole("status").filter({ hasText: "At least one listener" })).toBeVisible();
  await expect(page.locator(".workspace-toast")).toHaveCount(0);
});
