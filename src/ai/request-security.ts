import { createSlidingWindowLimiter } from "@/ai/rate-limit";

export const MAX_AI_REQUEST_BYTES = 256 * 1024;
export const AI_REQUESTS_PER_MINUTE = 20;
export const AI_MAX_CONCURRENT_REQUESTS = 2;

type JsonReadResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: "invalid_json" | "too_large" };

/** Bound bytes while reading, including requests without a trustworthy length header. */
export async function readBoundedJson(request: Request): Promise<JsonReadResult> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_AI_REQUEST_BYTES) {
    await request.body?.cancel().catch(() => undefined);
    return { ok: false, reason: "too_large" };
  }

  if (!request.body) return { ok: false, reason: "invalid_json" };
  const reader = request.body.getReader();
  const bytes = new Uint8Array(MAX_AI_REQUEST_BYTES);
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (totalBytes + value.byteLength > MAX_AI_REQUEST_BYTES) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, reason: "too_large" };
      }
      bytes.set(value, totalBytes);
      totalBytes += value.byteLength;
    }
    const json = new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, totalBytes));
    return { ok: true, value: JSON.parse(json) as unknown };
  } catch {
    return { ok: false, reason: "invalid_json" };
  } finally {
    reader.releaseLock();
  }
}

export type AiRequestBudget = Readonly<{
  acquire(now: number):
    | { allowed: true; release(): void }
    | { allowed: false; retryAfterMs: number };
}>;

/** Independent of client-controlled forwarding/address headers; shared by both routes. */
export function createAiRequestBudget(
  requestsPerMinute = AI_REQUESTS_PER_MINUTE,
  maxConcurrent = AI_MAX_CONCURRENT_REQUESTS,
): AiRequestBudget {
  const limiter = createSlidingWindowLimiter(requestsPerMinute, 60_000, 1);
  let activeRequests = 0;
  return {
    acquire(now) {
      if (activeRequests >= maxConcurrent) return { allowed: false, retryAfterMs: 1_000 };
      const result = limiter.check("server", now);
      if (!result.allowed) return result;
      activeRequests += 1;
      let released = false;
      return {
        allowed: true,
        release() {
          if (released) return;
          released = true;
          activeRequests -= 1;
        },
      };
    },
  };
}

// Next route bundles can load separate module instances. A process singleton keeps
// their aggregate budget shared; this is intentionally not a distributed quota.
const processState = globalThis as typeof globalThis & { echoCanvasAiBudget?: AiRequestBudget };
export function getProcessAiRequestBudget(): AiRequestBudget {
  return processState.echoCanvasAiBudget ??= createAiRequestBudget();
}

export function aiJsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(body, { ...init, headers });
}
