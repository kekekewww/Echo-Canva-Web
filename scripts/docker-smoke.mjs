import assert from "node:assert/strict";

const baseUrl = new URL(process.argv[2] ?? "http://127.0.0.1:3000");
const timeout = 5_000;

async function request(path, options) {
  return fetch(new URL(path, baseUrl), {
    ...options,
    signal: AbortSignal.timeout(timeout),
  });
}

let healthy = false;
for (let attempt = 0; attempt < 60; attempt += 1) {
  try {
    const response = await request("/api/health");
    if (response.ok && (await response.json()).status === "ok") {
      healthy = true;
      break;
    }
  } catch {
    // Docker build/start and the first development compilation are asynchronous.
  }
  await new Promise((resolve) => setTimeout(resolve, 1_000));
}
assert.ok(healthy, "Server did not become healthy within the smoke-test deadline");

for (const path of ["/", "/classic", "/lab"]) {
  const response = await request(path);
  assert.equal(response.status, 200, `${path} should remain available without AI keys`);
  const html = await response.text();
  assert.match(html, /Echo Canvas/i, `${path} should render the application`);
  if (path === "/") {
    const staticAsset = html.match(/(?:src|href)="(\/_next\/static\/[^"?]+\.js)(?:\?[^" ]*)?"/);
    assert.ok(staticAsset, "HTML should reference a packaged Next.js JavaScript asset");
    assert.equal((await request(staticAsset[1])).status, 200, "Standalone static assets should be served");
  }
}

const audioResponse = await request("/audio/LICENSE.md");
assert.equal(audioResponse.status, 200, "Public audio files and their license should be packaged");

const cases = [
  ["/api/scene/compile", { prompt: "A small room", targetMode: "classic-2d5d" }],
  ["/api/scene/explain", {
    sceneName: "Smoke scene",
    sourceName: "Smoke source",
    snapshot: {
      routeType: "direct",
      effectiveDistanceM: 2,
      dryGainDb: -6,
      lowpassHz: 20_000,
      portalCount: 0,
      rt60S: { low: 0.5, mid: 0.4, high: 0.3 },
    },
  }],
];
for (const [path, body] of cases) {
  const response = await request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assert.equal(response.status, 503, `${path} should return its safe unavailable response with AI disabled`);
  assert.equal((await response.json()).error.code, "AI_UNAVAILABLE", `${path} should preserve its API contract`);
}

console.log("Docker HTTP smoke passed: health, Classic/Hybrid routes, static/public assets, and both disabled AI APIs.");
