import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const requireFromNext = createRequire(require.resolve("next/package.json"));
const requireFromStyledJsx = createRequire(requireFromNext.resolve("styled-jsx/package.json"));
const markers = [
  { label: "Next vendored marker", directory: path.dirname(require.resolve("next/dist/compiled/client-only")) },
  { label: "styled-jsx dependency marker", directory: path.dirname(requireFromStyledJsx.resolve("client-only")) },
];

describe.each(markers)("$label", ({ directory }) => {
  it("allows the default Client Component environment without exports or side effects", () => {
    const result = spawnSync(process.execPath, [
      "--input-type=module", "--eval",
      'import marker from "@echo-canvas/client-only-marker"; console.log(JSON.stringify(Object.keys(marker)));',
    ], { cwd: directory, encoding: "utf8", timeout: 10_000 });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("[]");
    expect(result.stderr).toBe("");
  });

  it("rejects react-server evaluation through the actual conditional export", () => {
    const result = spawnSync(process.execPath, [
      "--conditions=react-server", "--input-type=module", "--eval",
      'import "@echo-canvas/client-only-marker";',
    ], { cwd: directory, encoding: "utf8", timeout: 10_000 });
    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("A client-only module cannot run in a React Server Component.");
    expect(result.stdout).toBe("");
  });

  it("ships its own complete MIT notice under an explicit replacement identity", () => {
    const metadata = JSON.parse(readFileSync(path.join(directory, "package.json"), "utf8"));
    expect(metadata.name).toBe("@echo-canvas/client-only-marker");
    expect(metadata.private).toBe(true);
    expect(metadata.version).toBe("1.0.0");
    expect(readFileSync(path.join(directory, "LICENSE"), "utf8").replaceAll("\r\n", "\n"))
      .toBe(readFileSync(path.join(process.cwd(), "LICENSE"), "utf8").replaceAll("\r\n", "\n"));
  });
});

it("preserves Next's actual server/client alias targets and rejection behavior", () => {
  const aliases = require("next/dist/build/create-compiler-aliases");
  const serverTarget = aliases.createServerOnlyClientOnlyAliases(true)["client-only$"];
  const clientTarget = aliases.createServerOnlyClientOnlyAliases(false)["client-only$"];
  expect(require.resolve(serverTarget)).toBe(path.join(markers[0].directory, "error.js"));
  expect(require.resolve(clientTarget)).toBe(path.join(markers[0].directory, "index.js"));
  expect(() => require(serverTarget)).toThrow("A client-only module cannot run in a React Server Component.");
  expect(require(clientTarget)).toEqual({});
});
