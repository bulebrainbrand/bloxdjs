import { describe, it, expect } from "vite-plus/test";
import { getNameFromIdentifierOrStringLiteral, resolvePath } from "./utils";
import { identifier, stringLiteral } from "@babel/types";

describe("test resolvePath", () => {
  it("should return resolved path", () => {
    expect(resolvePath("./b", "src/a")).toBe("src/b");
  });
  it("should return resolved path", () => {
    expect(resolvePath("../c", "src/dir/a")).toBe("src/c");
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
