import { test as base, expect } from "@playwright/test";
import { open, writeFile } from "node:fs/promises";

// Error listeners are installed before navigation, including on the first attempt.
// CPU tracing is opt-in: profiled runs are diagnostics, never performance acceptance.
export const test = base.extend<{ browserEvidence: void }>({
  browserEvidence: [async ({ page, browser }, runTest, testInfo) => {
    const events: { elapsedMs: number; kind: string; detail: string }[] = [];
    const started = performance.now();
    const record = (kind: string, detail: string) => {
      if (events.length < 200) events.push({ elapsedMs: performance.now() - started, kind, detail });
    };
    page.on("pageerror", (error) => record("pageerror", error.stack ?? error.message));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) record(message.type(), message.text());
    });
    page.on("requestfailed", (request) => record("requestfailed", `${request.url()} ${request.failure()?.errorText}`));
    page.on("response", (response) => {
      if (response.status() >= 400) record("http-error", `${response.status()} ${response.url()}`);
    });
    page.on("domcontentloaded", () => record("domcontentloaded", page.url()));
    page.on("load", () => record("load", page.url()));
    page.on("crash", () => record("crash", page.url()));

    // Exercise the original one-Worker branch even if a hosted runner gains cores.
    // This overrides the reported count only; it does not emulate a slower CPU.
    const pageCdp = process.env.E2E_SINGLE_ACOUSTIC_WORKER === "1"
      ? await page.context().newCDPSession(page) : undefined;
    if (pageCdp) await pageCdp.send("Emulation.setHardwareConcurrencyOverride", { hardwareConcurrency: 3 });

    const profile = process.env.BROWSER_DIAGNOSTICS === "1";
    const cdp = profile ? await browser.newBrowserCDPSession() : undefined;
    if (cdp) {
      await cdp.send("Tracing.start", {
        categories: "toplevel,devtools.timeline,v8,blink.user_timing,disabled-by-default-devtools.timeline,disabled-by-default-v8.cpu_profiler",
        transferMode: "ReturnAsStream",
      });
    }
    try {
      await runTest();
    } finally {
      if (pageCdp) await pageCdp.detach();
      if (profile || testInfo.status !== testInfo.expectedStatus) {
        const path = testInfo.outputPath("browser-events.json");
        await writeFile(path, JSON.stringify({
          diagnosticOnly: profile,
          title: testInfo.title,
          retry: testInfo.retry,
          status: testInfo.status,
          events,
        }, null, 2));
        await testInfo.attach("browser-events", { path, contentType: "application/json" });
      }
      if (cdp) {
        const completed = new Promise<{ stream?: string }>((resolve) => cdp.once("Tracing.tracingComplete", resolve));
        await cdp.send("Tracing.end");
        const { stream } = await completed;
        if (!stream) throw new Error("Chromium did not return the diagnostic trace stream.");
        const path = testInfo.outputPath("chromium-cpu-trace.json");
        const file = await open(path, "w");
        try {
          let eof = false;
          while (!eof) {
            const chunk = await cdp.send("IO.read", { handle: stream });
            await file.write(Buffer.from(chunk.data, chunk.base64Encoded ? "base64" : "utf8"));
            eof = chunk.eof;
          }
        } finally {
          await file.close();
          await cdp.send("IO.close", { handle: stream });
          await cdp.detach();
        }
        await testInfo.attach("chromium-cpu-trace", { path, contentType: "application/json" });
      }
    }
  }, { auto: true }],
});

export { expect };
