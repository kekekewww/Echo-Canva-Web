import { describe, expect, it } from "vitest";

import { collectBrowserFacts, launchBrowser } from "../../scripts/perf/cdp-tools.mjs";
import { groupKeyOf } from "../../scripts/perf/lib.mjs";

const ENTRY = { runId: "a", variant: "TS-W", case: "APP_H100_SWITCH", pass: "clean", boundary: "browser-app", workers: 4, audio: "on", build: "prod", driver: "poll", parity: false, status: "passed", start: "", end: "", orderIndex: 0, sampleCount: 1 };

describe("browser channel", () => {
  it("is part of the group key, and runs from before the option count as the default launch", () => {
    expect(groupKeyOf({ ...ENTRY, browserChannel: "chromium" })).not.toBe(groupKeyOf({ ...ENTRY, browserChannel: "default" }));
    expect(groupKeyOf(ENTRY)).toBe(groupKeyOf({ ...ENTRY, browserChannel: "default" }));
    expect(groupKeyOf({ ...ENTRY, boundary: "node-core" })).toBe(groupKeyOf({ ...ENTRY, boundary: "node-core", browserChannel: "not-applicable" }));
  });

  it("launches the default build with no options and fails clearly when the full build is missing", async () => {
    const launched: unknown[] = [];
    const chromium = { executablePath: () => "missing/chromium-1/chrome-win64/chrome.exe", launch: async (options?: unknown) => { launched.push(options); return {}; } };
    await launchBrowser(chromium, "default");
    expect(launched).toEqual([undefined]);
    await expect(launchBrowser(chromium, "chromium")).rejects.toThrow(/full Chromium build.*not installed/);
    expect(launched).toHaveLength(1);
  });

  it("records the renderer and raster status, and marks missing data unavailable", async () => {
    const chromium = { executablePath: () => "missing/chromium-1/chrome-win64/chrome.exe" };
    const browser = { version: () => "1.2.3" };
    const full = await collectBrowserFacts({
      browser, chromium, channel: "chromium",
      page: { evaluate: async () => ({ vendor: "Vendor X", renderer: "ANGLE (Renderer Y)" }) },
      browserSession: { send: async () => ({ gpu: { featureStatus: { rasterization: "enabled_on", webgl: "enabled" } } }) },
    });
    expect(full).toMatchObject({ version: "1.2.3", browserChannel: "chromium", executableKind: "chromium-full", webglVendor: "Vendor X", webglRenderer: "ANGLE (Renderer Y)", gpuRasterization: "enabled_on" });
    const none = await collectBrowserFacts({
      browser, chromium, channel: "default",
      page: { evaluate: async () => null },
      browserSession: { send: async () => { throw new Error("no"); } },
    });
    expect(none).toMatchObject({ webglVendor: "unavailable", webglRenderer: "unavailable", gpuRasterization: "unavailable", executableSha256: "unavailable" });
  });
});
