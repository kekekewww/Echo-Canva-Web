import { describe, expect, it, vi } from "vitest";

import { createSlidingWindowLimiter } from "@/ai/rate-limit";
import { createAiRequestBudget, MAX_AI_REQUEST_BYTES, readBoundedJson } from "@/ai/request-security";
import { handleCompileRequest, type CompileRouteDependencies } from "@/app/api/scene/compile/route";
import { handleExplainRequest, type ExplainRouteDependencies } from "@/app/api/scene/explain/route";
import { CONCRETE_PARTITION_PRESET } from "@/domain/presets/concrete-partition";

const explainBody = {
  sceneName: "Concrete passage",
  sourceName: "Radio",
  snapshot: {
    routeType: "blocked",
    effectiveDistanceM: 6,
    dryGainDb: -18,
    lowpassHz: 1200,
    portalCount: 0,
    rt60S: { low: 1.8, mid: 1.3, high: 0.7 },
  },
};
const explanation = {
  summary: "The direct path is blocked in the deterministic snapshot.",
  factors: [{ label: "Direct path", evidence: "The route type is blocked." }],
  limitations: [],
};

function post(route: "compile" | "explain", body: unknown, identity = "client"): Request {
  return new Request(`http://test/api/scene/${route}`, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": identity, "x-forwarded-for": identity },
    body: JSON.stringify(body),
  });
}

function compilerDependencies(overrides: Partial<CompileRouteDependencies> = {}): CompileRouteDependencies {
  return {
    available: true,
    generateScene: vi.fn().mockResolvedValue(CONCRETE_PARTITION_PRESET),
    limiter: createSlidingWindowLimiter(10, 60_000),
    clientKey: (request) => request.headers.get("user-agent") ?? "test-client",
    budget: createAiRequestBudget(),
    ...overrides,
  };
}

function explainerDependencies(overrides: Partial<ExplainRouteDependencies> = {}): ExplainRouteDependencies {
  return {
    available: true,
    generateExplanation: vi.fn().mockResolvedValue(explanation),
    limiter: createSlidingWindowLimiter(10, 60_000),
    clientKey: (request) => request.headers.get("user-agent") ?? "test-client",
    budget: createAiRequestBudget(),
    ...overrides,
  };
}

describe("bounded AI JSON transport", () => {
  it("accepts a JSON document exactly at the byte boundary", async () => {
    const body = `{}${" ".repeat(MAX_AI_REQUEST_BYTES - 2)}`;
    const request = new Request("http://test", { method: "POST", body });
    await expect(readBoundedJson(request)).resolves.toEqual({ ok: true, value: {} });
  });

  it("counts UTF-8 bytes rather than characters when no length header is present", async () => {
    const body = JSON.stringify({ prompt: "房".repeat(Math.ceil(MAX_AI_REQUEST_BYTES / 3)) });
    expect(body.length).toBeLessThan(MAX_AI_REQUEST_BYTES);
    const request = new Request("http://test", { method: "POST", body });
    await expect(readBoundedJson(request)).resolves.toEqual({ ok: false, reason: "too_large" });
  });

  it("cancels a chunked oversized stream even when its declared length is false", async () => {
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_AI_REQUEST_BYTES));
        controller.enqueue(new Uint8Array(1));
      },
      cancel,
    });
    const request = new Request("http://test", {
      method: "POST", headers: { "content-length": "1" }, body, ...{ duplex: "half" },
    });
    await expect(readBoundedJson(request)).resolves.toEqual({ ok: false, reason: "too_large" });
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("rejects invalid UTF-8 instead of replacing invalid bytes", async () => {
    const request = new Request("http://test", { method: "POST", body: new Uint8Array([0xff]) });
    await expect(readBoundedJson(request)).resolves.toEqual({ ok: false, reason: "invalid_json" });
  });

  it("rejects oversize bodies at both routes without a model request", async () => {
    const generateScene = vi.fn();
    const generateExplanation = vi.fn();
    const oversized = { payload: "x".repeat(MAX_AI_REQUEST_BYTES) };
    const responses = [
      await handleCompileRequest(post("compile", oversized), compilerDependencies({ generateScene })),
      await handleExplainRequest(post("explain", oversized), explainerDependencies({ generateExplanation })),
    ];
    for (const response of responses) {
      expect(response.status).toBe(413);
      expect(response.headers.get("cache-control")).toBe("no-store");
      await expect(response.json()).resolves.toMatchObject({ ok: false, error: { code: "INVALID_REQUEST" } });
    }
    expect(generateScene).not.toHaveBeenCalled();
    expect(generateExplanation).not.toHaveBeenCalled();
  });

  it("rejects an oversized declared length before reading the body", async () => {
    const response = await handleCompileRequest(new Request("http://test/api/scene/compile", {
      method: "POST", headers: { "content-length": String(MAX_AI_REQUEST_BYTES + 1) }, body: "{}",
    }), compilerDependencies());
    expect(response.status).toBe(413);
  });
});

describe("shared AI request budget", () => {
  it("caps combined endpoints despite changes to forwarding headers and user agent", async () => {
    const budget = createAiRequestBudget(2);
    const compile = compilerDependencies({ budget });
    const explain = explainerDependencies({ budget });
    expect((await handleCompileRequest(post("compile", { prompt: "room" }, "address-1"), compile)).status).toBe(200);
    expect((await handleExplainRequest(post("explain", explainBody, "address-2"), explain)).status).toBe(200);
    const rejected = await handleCompileRequest(post("compile", { prompt: "room" }, "address-3"), compile);
    expect(rejected.status).toBe(429);
    expect(rejected.headers.get("retry-after")).not.toBeNull();
    await expect(rejected.json()).resolves.toMatchObject({ error: { code: "RATE_LIMITED" } });
    expect(compile.generateScene).toHaveBeenCalledOnce();
    expect(explain.generateExplanation).toHaveBeenCalledOnce();
  });

  it("bounds in-flight requests across routes and releases capacity after a provider exception", async () => {
    const budget = createAiRequestBudget(20, 1);
    let rejectProvider!: (reason: Error) => void;
    const pendingProvider = new Promise<never>((_, reject) => { rejectProvider = reject; });
    const generateScene = vi.fn().mockReturnValue(pendingProvider);
    const compile = compilerDependencies({ budget, generateScene });
    const pending = handleCompileRequest(post("compile", { prompt: "room" }), compile);
    await vi.waitFor(() => expect(generateScene).toHaveBeenCalledOnce());
    const explain = explainerDependencies({ budget });
    expect((await handleExplainRequest(post("explain", explainBody), explain)).status).toBe(429);
    expect(explain.generateExplanation).not.toHaveBeenCalled();
    rejectProvider(new Error("Mock provider failure"));
    expect((await pending).status).toBe(502);
    expect((await handleExplainRequest(post("explain", explainBody), explain)).status).toBe(200);
  });

  it("releases capacity after success and expires the aggregate rate window deterministically", () => {
    const budget = createAiRequestBudget(1, 1);
    const first = budget.acquire(0);
    expect(first.allowed).toBe(true);
    if (!first.allowed) throw new Error("Expected the first lease.");
    first.release();
    first.release();
    expect(budget.acquire(1)).toEqual({ allowed: false, retryAfterMs: 59_999 });
    const next = budget.acquire(60_000);
    expect(next.allowed).toBe(true);
    if (next.allowed) next.release();
  });

  it("does not consume the paid budget for no-key fallback requests", async () => {
    const budget = createAiRequestBudget(1);
    const compile = compilerDependencies({ available: false, budget });
    expect((await handleCompileRequest(post("compile", { prompt: "room" }), compile)).status).toBe(503);
    expect(budget.acquire(0).allowed).toBe(true);
    expect(compile.generateScene).not.toHaveBeenCalled();
  });
});

describe("explanation request projection", () => {
  it("removes undeclared fields from every level before the model adapter", async () => {
    const generateExplanation = vi.fn().mockResolvedValue(explanation);
    const body = {
      ...explainBody,
      hidden: "untrusted extra payload",
      snapshot: { ...explainBody.snapshot, hidden: "extra", rt60S: { ...explainBody.snapshot.rt60S, hidden: "extra" } },
    };
    const response = await handleExplainRequest(post("explain", body), explainerDependencies({ generateExplanation }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(generateExplanation.mock.calls[0][0].request).toEqual(explainBody);
  });
});
