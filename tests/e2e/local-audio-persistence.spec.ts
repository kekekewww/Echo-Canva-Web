import { expect, test, type Page } from "@playwright/test";

// Reads Chromium's real IndexedDB directly (database `echo-canvas-audio`, store `assets`),
// independent of the app's store wrapper, so assertions reflect committed data only.
async function storedAssetNames(page: Page): Promise<string[]> {
  return page.evaluate(() => new Promise<string[]>((resolve, reject) => {
    const open = indexedDB.open("echo-canvas-audio", 1);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("assets", "readonly").objectStore("assets").getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        open.result.close();
        resolve((request.result as { name: string }[]).map(({ name }) => name));
      };
    };
  }));
}

async function importLocalSource(page: Page) {
  await page.getByTestId("add-object").click();
  await page.getByTestId("add-source").click();
  await page.getByLabel("Import WAV / MP3 / Ogg").setInputFiles("public/audio/voice-loop.wav");
  await expect(page.getByRole("complementary", { name: "Scene Outliner" }).getByRole("button", { name: "voice-loop" })).toBeVisible();
}

test("commits local audio writes and deletes to real IndexedDB", async ({ page }) => {
  await page.goto("/lab");
  await importLocalSource(page);
  await expect.poll(() => storedAssetNames(page)).toEqual(["voice-loop.wav"]);
  await expect(page.getByText("Memory-only warning", { exact: true })).toHaveCount(0);

  await page.reload();
  await expect.poll(() => storedAssetNames(page)).toEqual(["voice-loop.wav"]);

  await page.getByRole("complementary", { name: "Scene Outliner" }).getByRole("button", { name: "voice-loop" }).click();
  await page.getByRole("button", { name: "Remove local audio" }).click();
  await page.getByRole("button", { name: "Remove audio", exact: true }).click();
  await expect(page.getByText("Relink required", { exact: true })).toBeVisible();
  await expect.poll(() => storedAssetNames(page)).toEqual([]);
  await expect(page.getByText("Memory-only warning", { exact: true })).toHaveCount(0);
});

test("reports memory-only local audio when a real IndexedDB write aborts after request success", async ({ page }) => {
  await page.addInitScript(() => {
    // Abort the containing readwrite transaction only after the put request has succeeded,
    // reproducing a late commit failure inside Chromium's real IndexedDB implementation.
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function patchedPut(this: IDBObjectStore, ...args: Parameters<IDBObjectStore["put"]>) {
      const request = put.apply(this, args);
      request.addEventListener("success", () => this.transaction.abort());
      return request;
    };
  });
  await page.goto("/lab");
  await importLocalSource(page);
  await expect(page.getByText("Memory-only warning", { exact: true })).toBeVisible();
  expect(await storedAssetNames(page)).toEqual([]);
});
