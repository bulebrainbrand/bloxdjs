import { describe, expect, it } from "vite-plus/test";
import { convertPathToTemp, getTempDir } from "./createTempDir";

describe("convertPathToTemp test", () => {
  it("return inner temp path", () => {
    expect(convertPathToTemp("./src/index.ts", "/root/workspace")).toBe(
      "/root/workspace/.bloxd/src/index.ts",
    );
  });
});

describe("getTempDir test", () => {
  it("return temp dir", () => {
    expect(getTempDir("/root/workspace")).toBe("/root/workspace/.bloxd");
  });
});
