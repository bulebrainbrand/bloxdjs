import { describe, it, expect } from "vite-plus/test";
import { generateFileNameMap } from "./generateFileNameMap";
describe("generateFileNameMap test", () => {
  it("generate file map", () => {
    expect(
      generateFileNameMap(
        new Map([
          ["./src/index.ts", { type: "part", member: new Set(["foo"]) }],
          ["./src/foo.ts", { type: "all" }],
        ]),
      ),
    ).toStrictEqual(
      new Map([
        ["./src/index.ts", "0"],
        ["./src/foo.ts", "1"],
      ]),
    );
  });
});
