import { beforeEach, describe, expect, it } from "vite-plus/test";
import {
  convertPathToInnerTempDirectory,
  getTempDirectory,
  copyFileToTempDirectory,
} from "./copyToTempDirectory";
import { fs, vol } from "memfs";

describe("convertPathToTemp test", () => {
  it("when path is relative,return inner temp path", () => {
    expect(
      convertPathToInnerTempDirectory("./src/index.ts", "/root/workspace"),
    ).toBe("/root/workspace/.bloxd/src/index.ts");
  });
  it("when path is absoluted, return inner temp path", () => {
    expect(
      convertPathToInnerTempDirectory(
        "/root/workspace/src/index.ts",
        "/root/workspace",
      ),
    ).toBe("/root/workspace/.bloxd/src/index.ts");
  });
});

describe("getTempDir test", () => {
  it("return temp dir", () => {
    expect(getTempDirectory("/root/workspace")).toBe("/root/workspace/.bloxd");
  });
});

describe("test copyFileToTempDirectory", () => {
  beforeEach(() => {
    vol.reset();
  });
  it("copy file", () => {
    vol.fromJSON({
      "src/index.ts": "file_content",
    });
    // @ts-ignore
    copyFileToTempDirectory("src/index.ts", fs, ".");
    expect(fs.readFileSync(".bloxd/src/index.ts").toString()).toBe(
      "file_content",
    );
  });
  it("copy file when absoluted path", () => {
    vol.fromJSON({
      "/src/index.ts": "file_content",
    });
    // @ts-ignore
    copyFileToTempDirectory("/src/index.ts", fs, "/");
    expect(fs.readFileSync("/.bloxd/src/index.ts").toString()).toBe(
      "file_content",
    );
  });
});
