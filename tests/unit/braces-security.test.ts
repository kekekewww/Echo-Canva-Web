import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

type BraceNode = {
  type: string;
  nodes?: BraceNode[];
  parent?: BraceNode;
  value?: string;
};

type BraceOptions = { noempty?: boolean; nodupes?: boolean; expand?: boolean };
type BraceApi = {
  (input: string | string[], options?: BraceOptions): string[];
  parse(input: string): BraceNode;
  compile(input: string | BraceNode): string;
  expand(input: string | BraceNode, options?: BraceOptions): string[];
  stringify(input: string | BraceNode): string;
};

// Resolve the dependency actually consumed by Next's ESLint rules, rather than
// relying on a pnpm directory name or an unrelated hoisted package.
let dependencyRequire = createRequire(import.meta.url);
for (const name of [
  "eslint-config-next",
  "@next/eslint-plugin-next",
  "fast-glob",
  "micromatch",
]) {
  dependencyRequire = createRequire(dependencyRequire.resolve(name));
}
const braces = dependencyRequire("braces") as BraceApi;

function nestedAst(depth: number): BraceNode {
  const root: BraceNode = { type: "root", nodes: [] };
  let parent = root;
  for (let index = 0; index < depth; index += 1) {
    const child: BraceNode = { type: "paren", nodes: [], parent };
    parent.nodes!.push(child);
    parent = child;
  }
  parent.nodes!.push({ type: "text", value: "x", parent });
  return root;
}

function expectDepthRejection(action: () => unknown): void {
  let caught: unknown;
  try {
    action();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(SyntaxError);
  expect(caught).toMatchObject({ code: "BRACES_MAX_DEPTH" });
}

describe("locally patched braces dependency", () => {
  const exploit = "{".repeat(4998) + "a,b" + "}".repeat(4998);

  it.each(["parse", "compile", "expand", "stringify"] as const)(
    "%s rejects the 9,999-character stack-exhaustion pattern before recursive work",
    (api) => expectDepthRejection(() => braces[api](exploit)),
  );

  it.each([false, true])(
    "the default API rejects hostile patterns with expand=%s",
    (expand) => expectDepthRejection(() => braces(exploit, { expand })),
  );

  it("also rejects deeply nested parentheses and mixed groups", () => {
    expectDepthRejection(() => braces.compile("(".repeat(4998) + "x" + ")".repeat(4998)));
    expectDepthRejection(() => braces.parse("{(".repeat(65) + "a,b" + ")}".repeat(65)));
  });

  it.each(["compile", "expand", "stringify"] as const)(
    "%s guards caller-supplied ASTs that bypass the parser",
    (api) => expectDepthRejection(() => braces[api](nestedAst(4998))),
  );

  it.each(["compile", "expand", "stringify"] as const)(
    "%s accepts 128 nested groups and rejects the next level",
    (api) => {
      const pattern = "(".repeat(128) + "x" + ")".repeat(128);
      const output = braces[api](pattern);
      expect(output).toEqual(api === "expand" ? [pattern] : pattern);
      expectDepthRejection(() => braces[api]("(" + pattern + ")"));
      expect(braces[api](nestedAst(128))).toEqual(api === "expand" ? ["x"] : "x");
      expectDepthRejection(() => braces[api](nestedAst(129)));
    },
  );

  it.each(["compile", "expand", "stringify"] as const)(
    "%s preserves valid brace alternatives at the nesting boundary",
    (api) => {
      const pattern = "{".repeat(128) + "a,b" + "}".repeat(128);
      const literalPrefix = "{".repeat(127);
      const literalSuffix = "}".repeat(127);
      const expected = api === "expand"
        ? [literalPrefix + "a" + literalSuffix, literalPrefix + "b" + literalSuffix]
        : api === "compile"
          ? literalPrefix + "(a|b)" + literalSuffix
          : pattern;
      expect(braces[api](pattern)).toEqual(expected);
      expectDepthRejection(() => braces[api]("{" + pattern + "}"));
    },
  );

  it.each([
    {
      pattern: "src/{app,components}/**/*.{ts,tsx}",
      compiled: "src/(app|components)/**/*.(ts|tsx)",
      expanded: ["src/app/**/*.ts", "src/app/**/*.tsx", "src/components/**/*.ts", "src/components/**/*.tsx"],
    },
    { pattern: "{a,{b,c}}", compiled: "(a|(b|c))", expanded: ["a", "b", "c"] },
    { pattern: "file-{01..03}.ts", compiled: "file-(0[1-3]).ts", expanded: ["file-01.ts", "file-02.ts", "file-03.ts"] },
    { pattern: "${a,b}", compiled: "${a,b}", expanded: ["${a,b}"] },
    { pattern: "!({a,b})", compiled: "!((a|b))", expanded: ["!(a)", "!(b)"] },
    { pattern: "{a,b", compiled: "{a,b", expanded: ["{a,b"] },
  ])("preserves ordinary syntax for $pattern", ({ pattern, compiled, expanded }) => {
    expect(braces.compile(pattern)).toBe(compiled);
    expect(braces.expand(pattern)).toEqual(expanded);
    expect(braces.stringify(pattern)).toBe(pattern);
  });

  it.each([
    { pattern: "\\{".repeat(300) + "x", literal: "{".repeat(300) + "x" },
    { pattern: '"' + "{".repeat(300) + "x" + "}".repeat(300) + '"', literal: "{".repeat(300) + "x" + "}".repeat(300) },
    { pattern: "[" + "{".repeat(300) + "x" + "}".repeat(300) + "]", literal: "[" + "{".repeat(300) + "x" + "}".repeat(300) + "]" },
  ])("does not count escaped, quoted, or bracket literal braces", ({ pattern, literal }) => {
    expect(braces.compile(pattern)).toBe(literal);
    expect(braces.expand(pattern)).toEqual([literal]);
    expect(braces.stringify(pattern)).toBe(literal);
  });

  it("preserves duplicate and empty expansion options", () => {
    expect(braces.expand("{x,x,,y}", { noempty: true, nodupes: true })).toEqual(["x", "y"]);
    expect(braces(["{a,b}", "{b,c}"], { expand: true, nodupes: true })).toEqual(["a", "b", "c"]);
  });
});
