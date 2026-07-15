import { describe, it, expect, beforeEach } from "vite-plus/test";
import {
  generateGlobalThisModuleMemberExpression,
  getModuleKeyOrThrow,
  getNameFromIdentifierOrStringLiteral,
  isNodePackage,
  resolvePath,
} from "./utils";
import { identifier, stringLiteral } from "@babel/types";
import { generate } from "@babel/generator";
import { fs, vol } from "memfs";

describe("test resolvePath", () => {
  beforeEach(() => {
    vol.reset();
  });
  it("should return resolved path", () => {
    vol.fromJSON({
      "src/a": `export const bar = 1`,
      "src/b": `import {bar} from "./b"`,
    });
    // @ts-ignore
    expect(resolvePath("./b", "src/a", fs)).toBe("src/b");
  });
  it("should return resolved path", () => {
    vol.fromJSON({
      "src/c": `export const bar = 1`,
      "src/dir/a": `import {bar} from "../c"`,
    });
    // @ts-ignore
    expect(resolvePath("../c", "src/dir/a", fs)).toBe("src/c");
  });
});

describe("test getNameFromIdentifierOrStringLiteral", () => {
  it("should return name if input is identifier", () => {
    expect(getNameFromIdentifierOrStringLiteral(identifier("aaa"))).toBe("aaa");
  });
  it("should return value if input is stringLiteral", () => {
    expect(getNameFromIdentifierOrStringLiteral(stringLiteral("aaa"))).toBe(
      "aaa",
    );
  });
});

describe("test getModuleKeyOrThrow", () => {
  it("when input path is exists,return value", () => {
    expect(getModuleKeyOrThrow(new Map([["name", "1"]]), "name")).toBe("1");
  });
  it("when input path is not exists, throw", () => {
    expect(() =>
      getModuleKeyOrThrow(new Map([["name", "1"]]), "non_exists_name"),
    ).throw();
  });
});

describe("test isNodepackage", () => {
  it("when input node package name,return true", () => {
    expect(isNodePackage("typescript")).toBe(true);
    expect(isNodePackage("@bloxdjs/build")).toBe(true);
  });
  it("when input file path,return false", () => {
    expect(isNodePackage("./foo.ts")).toBe(false);
    expect(isNodePackage("../foo/bar.tsx")).toBe(false);
  });
});
describe("test generateGlobalThisModuleMemberExpression", () => {
  it("return globalThis member expression", () => {
    expect(generate(generateGlobalThisModuleMemberExpression("1")).code).toBe(
      'globalThis.__b_m__["1"]',
    );
  });
});
