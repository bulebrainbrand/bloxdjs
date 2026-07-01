import { parse } from "@babel/parser";
import { describe, it, expect, vi } from "vite-plus/test";
import {
  addGlobalThisExport,
  generateGlobalThisAssignmentExpressionsFromDeclaration,
  handleExportAll,
  handleSourcedReExport,
} from "./exportAdder";
import { generate } from "@babel/generator";
import * as t from "@babel/types";
import traverse, { NodePath } from "@babel/traverse";

describe("addGlobalThisExport test", () => {
  it("should add globalThis export when ast include of NamedExport has variable declatarion with shouldReplaceExport has exported name", () => {
    const ast = parse(`export const variable = 1`, { sourceType: "module" });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([["src/a", "a"]]),
          new Set(["variable"]),
        ),
      ).code,
    ).toBe(`export const variable = 1;
globalThis.__b_m__["a"]["variable"] = variable`);
  });

  it("should add globalThis export when ast include of NamedExport has function declatarion with shouldReplaceExport has exported name", () => {
    const ast = parse(
      `export function fn() {
  console.log("hi!");
}`,
      { sourceType: "module" },
    );
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([["src/a", "a"]]),
          new Set(["fn"]),
        ),
      ).code,
    ).toBe(`export function fn() {
  console.log("hi!");
}
globalThis.__b_m__["a"]["fn"] = fn`);
  });

  it("should add globalThis export when ast include of NamedExport has variable declatarion with shouldReplaceExport is 'All'", () => {
    const ast = parse(`export const variable = 1`, { sourceType: "module" });
    expect(
      generate(
        addGlobalThisExport(ast, "src/a", new Map([["src/a", "a"]]), "All"),
      ).code,
    ).toBe(`export const variable = 1;
globalThis.__b_m__["a"]["variable"] = variable`);
  });

  it("should add globalThis export when ast include of NamedExport has class declatarion", () => {
    const ast = parse(`export class a {};`, { sourceType: "module" });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([["src/a", "a"]]),
          new Set(["a"]),
        ),
      ).code,
    ).toBe(`export class a {}
globalThis.__b_m__["a"]["a"] = a
;`);
  });

  it("should add globalThis export when ast include of NamedExport has multi variableDeclarator", () => {
    const ast = parse(`export const a = 1,b = 2`, { sourceType: "module" });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([["src/a", "a"]]),
          new Set(["a", "b"]),
        ),
      ).code,
    ).toBe(`export const a = 1,
  b = 2;
globalThis.__b_m__["a"]["a"] = a
globalThis.__b_m__["a"]["b"] = b`);
  });

  it("should add globalThis export when ast include of ExportSpecifier", () => {
    const ast = parse(`const a = 1;export {a}`, { sourceType: "module" });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([["src/a", "a"]]),
          new Set(["a"]),
        ),
      ).code,
    ).toBe(`const a = 1;
export { a };
globalThis.__b_m__["a"].a = a`);
  });

  it("should not add globalThis export when ast include of renamed-ExportSpecifier", () => {
    const ast = parse(`const a = 1;export {a as b}`, { sourceType: "module" });
    expect(
      generate(
        addGlobalThisExport(ast, "src/a", new Map([["src/a", "a"]]), new Set()),
      ).code,
    ).toBe(`const a = 1;
export { a as b };`);
  });

  it("should add globalThis export when ast include of renamed-ExportSpecifier and shouldReplaceExport has name", () => {
    const ast = parse(`const a = 1;export {a as b}`, { sourceType: "module" });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([["src/a", "a"]]),
          new Set(["b"]),
        ),
      ).code,
    ).toBe(`const a = 1;
export { a as b };
globalThis.__b_m__["a"].b = a`);
  });

  it("should add globalThis export when ast include of invalid-idenfitier renamed-ExportSpecifier and shouldReplaceExport has name", () => {
    const ast = parse(`const a = 1;export {a as "0"}`, {
      sourceType: "module",
    });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([["src/a", "a"]]),
          new Set(["0"]),
        ),
      ).code,
    ).toBe(`const a = 1;
export { a as "0" };
globalThis.__b_m__["a"]["0"] = a`);
  });

  it("should not add globalThis export when ast include of invalid-idenfitier renamed-ExportSpecifier without shouldReplaceExport", () => {
    const ast = parse(`const a = 1;export {a as "0"}`, {
      sourceType: "module",
    });
    expect(
      generate(
        addGlobalThisExport(ast, "src/a", new Map([["src/a", "a"]]), new Set()),
      ).code,
    ).toBe(`const a = 1;
export { a as "0" };`);
  });

  it("should add globalThis export when ast include of renamed-ExportSpecifier", () => {
    const ast = parse(`export { a } from "./b"`, { sourceType: "module" });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([
            ["src/a", "a"],
            ["src/b", "b"],
          ]),
          new Set(["a"]),
        ),
      ).code,
    ).toBe(`export { a } from "./b";
globalThis.__b_m__["a"].a = globalThis.__b_m__["b"].a`);
  });

  it("should not add globalThis export when ast include of renamed-ExportSpecifier without shouldReplaceExport", () => {
    const ast = parse(`export { a } from "./b"`, { sourceType: "module" });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([
            ["src/a", "a"],
            ["src/b", "b"],
          ]),
          new Set(),
        ),
      ).code,
    ).toBe(`export { a } from "./b";`);
  });
  it("should add globalThis export when ast include of renamed-ExportDefaultSpecifier", () => {
    const ast = parse(`export * as a from "./b"`, { sourceType: "module" });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([
            ["src/a", "a"],
            ["src/b", "b"],
          ]),
          new Set(["a"]),
        ),
      ).code,
    ).toBe(`export * as a from "./b";
globalThis.__b_m__["a"].a = globalThis.__b_m__["b"]`);
  });
  it("should add globalThis export when ast include of All re-export", () => {
    const ast = parse(`export * from "./b"`, { sourceType: "module" });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([
            ["src/a", "a"],
            ["src/b", "b"],
          ]),
          new Set(),
        ),
      ).code,
    ).toBe(`export * from "./b";
Object.assign(globalThis.__b_m__["a"], globalThis.__b_m__["b"])`);
  });
});

describe("generateGlobalThisAssignmentExpressionsFromDeclaration test", () => {
  it("if get invalid node,throw error", () => {
    expect(() =>
      generateGlobalThisAssignmentExpressionsFromDeclaration(
        t.interfaceDeclaration(
          t.identifier("a"),
          null,
          [],
          t.objectTypeAnnotation([]),
        ),
        "a",
        new Set(),
      ),
    ).throw();
  });
});

describe("handleSourcedReExport test", () => {
  it("when get null module key, fast return", () => {
    const path = getExportNamedDeclarationPath(`export { foo } from "b";`);
    const insertAfterSpy = vi.spyOn(path, "insertAfter");
    handleSourcedReExport(path, "moduleA", null, new Set());

    expect(insertAfterSpy).not.toHaveBeenCalled();
  });
});

describe("handleExportAll test", () => {
  it("when get null module key, fast return", () => {
    const path = getExportAllDeclarationPath(`export * from "b";`);
    const insertAfterSpy = vi.spyOn(path, "insertAfter");
    handleExportAll(path, "moduleA", null);
    expect(insertAfterSpy).not.toHaveBeenCalled();
  });
});

function getExportNamedDeclarationPath(
  code: string,
): NodePath<t.ExportNamedDeclaration> {
  const ast = parse(code, { sourceType: "module" });
  let result: NodePath<t.ExportNamedDeclaration> | undefined;

  traverse(ast, {
    ExportNamedDeclaration(path) {
      result = path;
      path.stop();
    },
  });

  if (!result) throw new Error("ExportNamedDeclaration not found");
  return result;
}

function getExportAllDeclarationPath(
  code: string,
): NodePath<t.ExportAllDeclaration> {
  const ast = parse(code, { sourceType: "module" });
  let result: NodePath<t.ExportAllDeclaration> | undefined;

  traverse(ast, {
    ExportAllDeclaration(path) {
      result = path;
      path.stop();
    },
  });

  if (!result) throw new Error("ExportNamedDeclaration not found");
  return result;
}
