import { describe, it, expect } from "vite-plus/test";
import { resolveImportPath } from "./resolveTsconfigPath";

describe("resolveImportPath test", () => {
  it("if normal path,return as is", () => {
    expect(
      resolveImportPath(
        { compilerOptions: { paths: {} } },
        "./tsconfig.json",
        "./src/index.ts",
        "./foo.ts",
      ),
    ).toBe("./foo.ts");
  });
  it("if no config,return as is", () => {
    expect(
      resolveImportPath(
        { compilerOptions: {} },
        "./tsconfig.json",
        "./src/index.ts",
        "./foo.ts",
      ),
    ).toBe("./foo.ts");
  });
  it("if match path,return resolved", () => {
    expect(
      resolveImportPath(
        {
          compilerOptions: { paths: { "@/*": ["./src/*"] } },
        },
        "./tsconfig.json",
        "./src/index.ts",
        "@/foo.ts",
      ),
    ).toBe("./foo.ts");
  });
  it("if match path,return resolved 2", () => {
    expect(
      resolveImportPath(
        {
          compilerOptions: { paths: { "@foo/*": ["./src/foo/*"] } },
        },
        "./tsconfig.json",
        "./src/index.ts",
        "@foo/foo.ts",
      ),
    ).toBe("./foo/foo.ts");
  });
  it("if match path,return resolved 3", () => {
    expect(
      resolveImportPath(
        {
          compilerOptions: { paths: { "@foo": ["./src/foo.ts"] } },
        },
        "./tsconfig.json",
        "./src/index.ts",
        "@foo",
      ),
    ).toBe("./foo.ts");
  });
  it("if npm package,return as is", () => {
    expect(
      resolveImportPath(
        {
          compilerOptions: { paths: { "@foo/*": ["./src/foo/*"] } },
        },
        "./tsconfig.json",
        "./src/index.ts",
        "@package/name",
      ),
    ).toBe("@package/name");
  });
  it("if npm package,return as is 2", () => {
    expect(
      resolveImportPath(
        {
          compilerOptions: { paths: { "@foo/*": ["./src/foo/*"] } },
        },
        "./tsconfig.json",
        "./src/index.ts",
        "name",
      ),
    ).toBe("name");
  });
});
