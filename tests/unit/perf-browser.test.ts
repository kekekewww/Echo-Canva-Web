import { describe, expect, it } from "vitest";

import { collectBrowserFacts, launchBrowser } from "../../scripts/perf/cdp-tools.mjs";
import { browserArgsOf, groupKeyOf, parseViewport, validateBrowserArgs, viewportOf, traceExtraCategoriesOf, validateTraceExtraCategories } from "../../scripts/perf/lib.mjs";

const ENTRY = { runId: "a", variant: "TS-W", case: "APP_H100_SWITCH", pass: "clean", boundary: "browser-app", workers: 4, audio: "on", build: "prod", driver: "poll", parity: false, status: "passed", start: "", end: "", orderIndex: 0, sampleCount: 1 };

describe("viewport and browser args", () => {
  it("parses a viewport and rejects anything else", () => {
    expect(parseViewport("1920x1080")).toEqual({ width: 1920, height: 1080 });
    expect(parseViewport("default")).toBeNull();
    for (const bad of ["1920", "1920*1080", "100x100", "9000x1080", "axb", "1920x1080x2"]) expect(() => parseViewport(bad)).toThrow();
  });

  it("accepts Chromium switches and rejects path separators and non-switches", () => {
    expect(validateBrowserArgs(["--use-angle=d3d11", "--enable-gpu-rasterization"])).toEqual(["--use-angle=d3d11", "--enable-gpu-rasterization"]);
    expect(() => validateBrowserArgs(["--data-dir=" + ["a", "b"].join(String.fromCharCode(92))])).toThrow(/path separator/);
    expect(() => validateBrowserArgs(["--data-dir=" + ["a", "b"].join("/")])).toThrow(/path separator/);
    expect(() => validateBrowserArgs(["use-angle"])).toThrow(/starting with/);
    expect(() => validateBrowserArgs("--x" as unknown as string[])).toThrow();
  });

  it("puts the viewport and the arguments in the group key; older in-app runs count as the default", () => {
    const base = { ...ENTRY };
    expect(groupKeyOf({ ...base, viewport: "1920x1080" })).not.toBe(groupKeyOf({ ...base, viewport: "default" }));
    expect(groupKeyOf({ ...base, browserArgs: ["--enable-gpu-rasterization"] })).not.toBe(groupKeyOf({ ...base, browserArgs: [] }));
    expect(groupKeyOf({ ...base, browserArgs: ["--a", "--b"] })).not.toBe(groupKeyOf({ ...base, browserArgs: ["--a"] }));
    expect(groupKeyOf(base)).toBe(groupKeyOf({ ...base, viewport: "default", browserArgs: [] }));
    expect(viewportOf({ boundary: "browser-pool" })).toBe("not-applicable");
    expect(browserArgsOf({ boundary: "browser-pool" })).toBe("not-applicable");
  });

  it("validates extra trace categories", () => {
    expect(validateTraceExtraCategories(["disabled-by-default-cc.debug", "cc,gpu", "a_b.c-d"])).toEqual(["disabled-by-default-cc.debug", "cc,gpu", "a_b.c-d"]);
    expect(validateTraceExtraCategories([])).toEqual([]);
    for (const bad of ["", "has space", "a/b", "a\b", "x*", "a;b"]) expect(() => validateTraceExtraCategories([bad])).toThrow(/trace-extra-category/);
    expect(() => validateTraceExtraCategories("cc" as unknown as string[])).toThrow();
  });

  it("changes the group key only when extra trace categories are present", () => {
    const base = { ...ENTRY };
    const key = groupKeyOf(base);
    expect(groupKeyOf({ ...base, traceExtraCategories: [] })).toBe(key);
    expect(traceExtraCategoriesOf(base)).toEqual([]);
    expect(groupKeyOf({ ...base, traceExtraCategories: ["cc"] })).not.toBe(key);
    expect(groupKeyOf({ ...base, traceExtraCategories: ["cc"] })).not.toBe(groupKeyOf({ ...base, traceExtraCategories: ["gpu"] }));
  });
});

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
      browserSession: { send: async () => ({ gpu: { featureStatus: { rasterization: "enabled_on", gpu_compositing: "disabled_software", webgl: "enabled" } } }) },
    });
    expect(full).toMatchObject({ version: "1.2.3", browserChannel: "chromium", executableKind: "chromium-full", webglVendor: "Vendor X", webglRenderer: "ANGLE (Renderer Y)", gpuRasterization: "enabled_on", gpuCompositing: "disabled_software" });
    const none = await collectBrowserFacts({
      browser, chromium, channel: "default",
      page: { evaluate: async () => null },
      browserSession: { send: async () => { throw new Error("no"); } },
    });
    expect(none).toMatchObject({ webglVendor: "unavailable", webglRenderer: "unavailable", gpuRasterization: "unavailable", gpuCompositing: "unavailable", executableSha256: "unavailable" });
  });
});
