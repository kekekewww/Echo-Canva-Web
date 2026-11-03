import { describe, expect, it } from "vitest";

import { assignReflectionSlots, classicReflectionKey } from "@/audio/reflection-slots";

const empty = (count = 6): (string | null)[] => Array.from({ length: count }, () => null);

describe("assignReflectionSlots", () => {
  it("fills empty slots in rank order on the first frame", () => {
    expect(assignReflectionSlots(empty(), ["a", "b", "c"])).toEqual(["a", "b", "c", null, null, null]);
  });

  it("keeps a continuing path in its slot when the ranking reorders", () => {
    const previous = ["a", "b", "c", null, null, null];
    expect(assignReflectionSlots(previous, ["c", "a", "b"])).toEqual(previous);
  });

  it("puts a new path into a quiet slot before reusing a released one", () => {
    const previous = ["a", "b", null, null, null, null];
    expect(assignReflectionSlots(previous, ["c", "a"])).toEqual(["a", null, "c", null, null, null]);
  });

  it("prefers a quiet slot over one that is still fading out", () => {
    const previous = ["a", null, null, null, null, null];
    const quiet = [false, false, true, true, true, true];
    expect(assignReflectionSlots(previous, ["a", "b"], quiet)).toEqual(["a", null, "b", null, null, null]);
  });

  it("reuses a released slot only when no idle slot remains", () => {
    const previous = ["a", "b", "c", "d", "e", "f"];
    expect(assignReflectionSlots(previous, ["a", "b", "c", "d", "e", "g"])).toEqual(["a", "b", "c", "d", "e", "g"]);
    expect(assignReflectionSlots(previous, ["g", "b", "c", "d", "e", "f"])).toEqual(["g", "b", "c", "d", "e", "f"]);
  });

  it("caps the audible set at the slot count by rank and ignores duplicates", () => {
    const ranked = ["a", "a", "b", "c", "d", "e", "f", "g"];
    expect(assignReflectionSlots(empty(), ranked)).toEqual(["a", "b", "c", "d", "e", "f"]);
  });

  it("is deterministic for the same inputs", () => {
    const previous = ["x", null, "y", null, "z", null];
    const ranked = ["q", "z", "r", "x"];
    expect(assignReflectionSlots(previous, ranked)).toEqual(assignReflectionSlots(previous, ranked));
    expect(assignReflectionSlots(previous, ranked)).toEqual(["x", "q", null, "r", "z", null]);
  });
});

describe("classicReflectionKey", () => {
  it("identifies first- and second-order Classic paths by wall sequence", () => {
    expect(classicReflectionKey({ wallId: "north" })).toBe("north");
    expect(classicReflectionKey({ wallId: "north", wallIds: ["north"] })).toBe("north");
    expect(classicReflectionKey({ wallId: "east", wallIds: ["north", "east"] })).toBe("north>east");
  });
});
