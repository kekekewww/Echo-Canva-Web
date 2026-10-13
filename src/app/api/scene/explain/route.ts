import { createHash } from "node:crypto";

import OpenAI from "openai";

import {
  ACOUSTIC_EXPLAINER_MODEL,
  type ExplainAcousticsRequest,
  type ExplainDependencies,
  type ExplainSchemaPrompt,
} from "@/ai/contracts";
import { getAiProviderConfig, type AiProviderConfig } from "@/ai/provider";
import { acousticExplanationJsonSchema, explainAcoustics } from "@/ai/acoustic-explainer";
import { createSlidingWindowLimiter, type SlidingWindowLimiter } from "@/ai/rate-limit";
import { aiJsonResponse, getProcessAiRequestBudget, readBoundedJson, type AiRequestBudget } from "@/ai/request-security";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const DEFAULT_TIMEOUT_MS = 30_000;

class ModelRefusalError extends Error {
  constructor() {
    super("The model did not return a structured explanation.");
    this.name = "ModelRefusalError";
  }
}

export type ExplainRouteDependencies = ExplainDependencies & {
  available: boolean;
  limiter: SlidingWindowLimiter;
  clientKey(request: Request): string;
  budget?: AiRequestBudget;
};

type FailureCode =
  | "AI_UNAVAILABLE"
  | "AI_TIMEOUT"
  | "AI_REFUSED"
  | "AI_REQUEST_FAILED"
  | "INVALID_JSON"
  | "INVALID_REQUEST"
  | "RATE_LIMITED";

function jsonFailure(code: FailureCode, message: string, status: number): Response {
  return aiJsonResponse({ ok: false, error: { code, message } }, { status });
}

function requestTimeoutMs(): number {
  const configured = Number.parseInt(process.env.AI_REQUEST_TIMEOUT_MS ?? "", 10);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TIMEOUT_MS;
}

function hasRefusal(response: { output: Array<{ type: string }> }): boolean {
  return response.output.some((item) => item.type === "refusal");
}

function createOpenAIAdapter(config: AiProviderConfig): ExplainDependencies["generateExplanation"] {
  const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL, timeout: requestTimeoutMs(), maxRetries: 0 });

  return async (schemaPrompt: ExplainSchemaPrompt): Promise<unknown> => {
    const response = await client.responses.create({
      model: config.explainerModel,
      reasoning: { effort: "low" },
      tools: [],
      input: [
        { role: "developer", content: schemaPrompt.instructions },
        { role: "user", content: JSON.stringify(schemaPrompt.request) },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "acoustic_explanation",
          strict: true,
          schema: acousticExplanationJsonSchema,
        },
      },
    });

    if (hasRefusal(response) || !response.output_text) {
      throw new ModelRefusalError();
    }

    return JSON.parse(response.output_text) as unknown;
  };
}

function derivedClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const userAgent = request.headers.get("user-agent") ?? "";
  return createHash("sha256").update(`${forwardedFor}\n${userAgent}`).digest("hex");
}

function createDefaultDependencies(): ExplainRouteDependencies {
  const config = getAiProviderConfig();
  return {
    available: Boolean(config),
    model: config?.explainerModel ?? ACOUSTIC_EXPLAINER_MODEL,
    generateExplanation: config
      ? createOpenAIAdapter(config)
      : async () => {
          throw new Error("OpenAI is unavailable.");
        },
    limiter: createSlidingWindowLimiter(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS),
    clientKey: derivedClientKey,
    budget: getProcessAiRequestBudget(),
  };
}

const defaultDependencies = createDefaultDependencies();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isExplainRequestBody(value: Record<string, unknown>): value is ExplainAcousticsRequest {
  if (typeof value.sceneName !== "string" || typeof value.sourceName !== "string" || !isRecord(value.snapshot)) {
    return false;
  }
  const { snapshot } = value;
  return (
    (snapshot.routeType === "direct" || snapshot.routeType === "portal" || snapshot.routeType === "blocked") &&
    isFiniteNumber(snapshot.effectiveDistanceM) &&
    isFiniteNumber(snapshot.dryGainDb) &&
    isFiniteNumber(snapshot.lowpassHz) &&
    isFiniteNumber(snapshot.portalCount) &&
    isRecord(snapshot.rt60S) &&
    isFiniteNumber(snapshot.rt60S.low) &&
    isFiniteNumber(snapshot.rt60S.mid) &&
    isFiniteNumber(snapshot.rt60S.high)
  );
}

async function parseRequestBody(request: Request): Promise<Record<string, unknown> | Response> {
  const result = await readBoundedJson(request);
  if (!result.ok) {
    if (result.reason === "too_large") {
      return jsonFailure("INVALID_REQUEST", "Request body must be 256 KiB or smaller.", 413);
    }
    return jsonFailure("INVALID_JSON", "Request body must be valid JSON.", 400);
  }
  return isRecord(result.value)
    ? result.value
    : jsonFailure("INVALID_REQUEST", "Request body must be a JSON object.", 400);
}

/** Pass only the documented projection to the provider, never hidden JSON fields. */
function projectExplainRequest(body: ExplainAcousticsRequest): ExplainAcousticsRequest {
  return {
    sceneName: body.sceneName,
    sourceName: body.sourceName,
    snapshot: {
      routeType: body.snapshot.routeType,
      effectiveDistanceM: body.snapshot.effectiveDistanceM,
      dryGainDb: body.snapshot.dryGainDb,
      lowpassHz: body.snapshot.lowpassHz,
      portalCount: body.snapshot.portalCount,
      rt60S: { low: body.snapshot.rt60S.low, mid: body.snapshot.rt60S.mid, high: body.snapshot.rt60S.high },
    },
  };
}

function isTimeout(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || error.name === "APIConnectionTimeoutError");
}

function isModelRefusal(error: unknown): boolean {
  return error instanceof Error && error.name === "ModelRefusalError";
}

export async function handleExplainRequest(
  request: Request,
  dependencies: ExplainRouteDependencies = defaultDependencies,
): Promise<Response> {
  if (request.method !== "POST") {
    return jsonFailure("INVALID_REQUEST", "Only POST is supported.", 405);
  }

  const body = await parseRequestBody(request);
  if (body instanceof Response) {
    return body;
  }

  if (!isExplainRequestBody(body)) {
    return jsonFailure("INVALID_REQUEST", "Explanation request must contain a finite acoustic snapshot.", 400);
  }

  const rateLimit = dependencies.limiter.check(dependencies.clientKey(request), Date.now());
  if (!rateLimit.allowed) {
    return aiJsonResponse(
      {
        ok: false,
        error: { code: "RATE_LIMITED", message: "Too many explanation requests. Try again shortly." },
        retryAfterMs: rateLimit.retryAfterMs,
      },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1_000)) } },
    );
  }

  if (!dependencies.available) {
    return jsonFailure("AI_UNAVAILABLE", "AI explanations are unavailable. Keep editing manually.", 503);
  }

  const budget = dependencies.budget?.acquire(Date.now());
  if (budget && !budget.allowed) {
    return aiJsonResponse(
      {
        ok: false,
        error: { code: "RATE_LIMITED", message: "AI request capacity is busy. Try again shortly." },
        retryAfterMs: budget.retryAfterMs,
      },
      { status: 429, headers: { "Retry-After": String(Math.ceil(budget.retryAfterMs / 1_000)) } },
    );
  }

  try {
    const result = await explainAcoustics(projectExplainRequest(body), dependencies);
    return aiJsonResponse(result, { status: result.ok ? 200 : 422 });
  } catch (error) {
    if (isTimeout(error)) {
      return jsonFailure("AI_TIMEOUT", "The acoustic explanation timed out. Try again.", 504);
    }
    if (isModelRefusal(error)) {
      return jsonFailure("AI_REFUSED", "The acoustic explanation could not be completed.", 422);
    }
    return jsonFailure("AI_REQUEST_FAILED", "The acoustic explanation is temporarily unavailable.", 502);
  } finally {
    if (budget?.allowed) budget.release();
  }
}

export async function POST(request: Request): Promise<Response> {
  return handleExplainRequest(request);
}
