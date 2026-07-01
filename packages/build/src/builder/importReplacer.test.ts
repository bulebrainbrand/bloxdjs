import { describe, it, expect } from "vite-plus/test";
import {
  generateImportData,
  generateObjectProprtyComputed,
  generateVariableDeclaratorFromNormalImportDataArray,
  getModuleKeyFromImportDeclaration,
  replaceImport,
} from "./importReplacer";
import { parse } from "@babel/parser";
import generate from "@babel/generator";
import * as t from "@babel/types";

describe("importReplacer test", () => {
  it("should replace import with globalThis", () => {
    const ast = parse(
      `
            import { a } from "./b"
            `,
      { sourceType: "module" },
    );
    expect(
      generate(replaceImport(ast, "src/a", new Map([["src/b", "b"]]))).code,
    ).toBe(`const {
  a
} = globalThis.__b_m__["b"];`);
  });
  it("should replace default import with globalThis", () => {
    const ast = parse(
      `
            import a from "./b"
            `,
      { sourceType: "module" },
    );
    expect(
      generate(replaceImport(ast, "src/a", new Map([["src/b", "b"]]))).code,
    ).toBe(`const {
  ["default"]: a
} = globalThis.__b_m__["b"];`);
  });
  it("should replace namespace import with globalThis", () => {
    const ast = parse(
      `
            import * as a from "./b"
            `,
      { sourceType: "module" },
    );
    expect(
      generate(replaceImport(ast, "src/a", new Map([["src/b", "b"]]))).code,
    ).toBe(`const a = globalThis.__b_m__["b"];`);
  });
  it("should replace rename import with globalThis", () => {
    const ast = parse(
      `
            import {a as b} from "./b"
            `,
      { sourceType: "module" },
    );
    expect(
      generate(replaceImport(ast, "src/a", new Map([["src/b", "b"]]))).code,
    ).toBe(`const {
  a: b
} = globalThis.__b_m__["b"];`);
  });
  it("should replace invalid indentifier import with globalThis", () => {
    const ast = parse(
      `
            import {"0" as b} from "./b"
            `,
      { sourceType: "module" },
    );
    expect(
      generate(replaceImport(ast, "src/a", new Map([["src/b", "b"]]))).code,
    ).toBe(`const {
  ["0"]: b
} = globalThis.__b_m__["b"];`);
  });
  it("should replace many import with globalThis", () => {
    const ast = parse(
      `
            import {a as b,c,default as d} from "./b"
            `,
      { sourceType: "module" },
    );
    expect(
      generate(replaceImport(ast, "src/a", new Map([["src/b", "b"]]))).code,
    ).toBe(`const {
  a: b,
  c,
  ["default"]: d
} = globalThis.__b_m__["b"];`);
  });
});

describe("generateImportData test", () => {
  it("should return namespace variable name", () => {
    const ast = t.importDeclaration(
      [t.importNamespaceSpecifier(t.identifier("importName"))],
      t.stringLiteral("./importFile"),
    );
    expect(generateImportData(ast)).toStrictEqual({
      namespace: ["importName"],
      other: [],
    });
  });
  it("should return multi namespace variable name", () => {
    const ast = t.importDeclaration(
      [
        t.importNamespaceSpecifier(t.identifier("importName")),
        t.importNamespaceSpecifier(t.identifier("importName2")),
      ],
      t.stringLiteral("./importFile"),
    );
    expect(generateImportData(ast)).toStrictEqual({
      namespace: ["importName", "importName2"],
      other: [],
    });
  });
  it("should return normal variable name", () => {
    const ast = t.importDeclaration(
      [
        t.importSpecifier(
          t.identifier("importName"),
          t.identifier("importTarget"),
        ),
      ],
      t.stringLiteral("./importFile"),
    );
    expect(generateImportData(ast)).toStrictEqual({
      namespace: [],
      other: [{ exportedName: "importTarget", importedName: "importName" }],
    });
  });
  it("should return default-import variable name", () => {
    const ast = t.importDeclaration(
      [t.importDefaultSpecifier(t.identifier("importName"))],
      t.stringLiteral("./importFile"),
    );
    expect(generateImportData(ast)).toStrictEqual({
      namespace: [],
      other: [{ exportedName: "default", importedName: "importName" }],
    });
  });
  it("should return normal variable and default variable name", () => {
    const ast = t.importDeclaration(
      [
        t.importSpecifier(
          t.identifier("importName"),
          t.identifier("importTarget"),
        ),
        t.importDefaultSpecifier(t.identifier("defaultImport")),
      ],
      t.stringLiteral("./importFile"),
    );
    expect(generateImportData(ast)).toStrictEqual({
      namespace: [],
      other: [
        { exportedName: "importTarget", importedName: "importName" },
        { exportedName: "default", importedName: "defaultImport" },
      ],
    });
  });
  it("should return multi imported variable name", () => {
    const ast = t.importDeclaration(
      [
        t.importDefaultSpecifier(t.identifier("defaultImport")),
        t.importSpecifier(
          t.identifier("importName"),
          t.identifier("importTarget"),
        ),
        t.importNamespaceSpecifier(t.identifier("namespaceImport")),
      ],
      t.stringLiteral("./importFile"),
    );
    expect(generateImportData(ast)).toStrictEqual({
      namespace: ["namespaceImport"],
      other: [
        { exportedName: "default", importedName: "defaultImport" },
        { exportedName: "importTarget", importedName: "importName" },
      ],
    });
  });
});

describe("generateObjectProprtyComputed test", () => {
  it("return objectProprty", () => {
    expect(generateObjectProprtyComputed("target", "local")).toStrictEqual(
      t.objectProperty(t.stringLiteral("target"), t.identifier("local"), true),
    );
  });
});

describe("getModuleKeyFromImportDeclaration test", () => {
  it("when not found,throw error", () => {
    expect(() =>
      getModuleKeyFromImportDeclaration(
        t.importDeclaration([], t.stringLiteral("./file")),
        new Map(),
        "src/imFile",
      ),
    ).throw();
  });
});

describe("generateVariableDeclaratorFromNormalImportDataArray test", () => {
  it("when received empty array,return null", () => {
    expect(
      generateVariableDeclaratorFromNormalImportDataArray([], "b"),
    ).toStrictEqual(null);
  });
});
