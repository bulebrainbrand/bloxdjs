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
import { beforeEach } from "node:test";
import { fs, vol } from "memfs";

describe("addGlobalThisExport test", () => {
  beforeEach(() => {
    vol.reset();
  });
  it("should add globalThis export when ast include of NamedExport has variable declatarion with shouldReplaceExport has exported name", () => {
    const text = `export const variable = 1`;
    const ast = parse(text, { sourceType: "module" });
    vol.fromJSON({
      "src/a": text,
    });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([["src/a", "a"]]),
          {
            type: "part",
            member: new Set(["variable"]),
          },
          // @ts-ignore
          fs,
        ),
      ).code,
    ).toBe(`export const variable = 1;
globalThis.__b_m__["a"]["variable"] = variable`);
  });

  it("should add globalThis export when ast include of NamedExport has function declatarion with shouldReplaceExport has exported name", () => {
    const text = `export function fn() {
  console.log("hi!");
}`;
    const ast = parse(text, { sourceType: "module" });
    vol.fromJSON({
      "src/a": text,
    });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([["src/a", "a"]]),
          {
            type: "part",
            member: new Set(["fn"]),
          },
          // @ts-ignore
          fs,
        ),
      ).code,
    ).toBe(`export function fn() {
  console.log("hi!");
}
globalThis.__b_m__["a"]["fn"] = fn`);
  });

  it("should add globalThis export when ast include of NamedExport has variable declatarion with shouldReplaceExport is 'all'", () => {
    const text = `export const variable = 1`;
    const ast = parse(text, { sourceType: "module" });
    vol.fromJSON({
      "src/a": text,
    });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([["src/a", "a"]]),
          {
            type: "all",
          },
          // @ts-ignore
          fs,
        ),
      ).code,
    ).toBe(`export const variable = 1;
globalThis.__b_m__["a"]["variable"] = variable`);
  });

  it("should add globalThis export when ast include of NamedExport has class declatarion", () => {
    const text = `export class a {};`;
    const ast = parse(text, { sourceType: "module" });
    vol.fromJSON({
      "src/a": text,
    });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([["src/a", "a"]]),
          {
            type: "part",
            member: new Set(["a"]),
          },
          // @ts-ignore
          fs,
        ),
      ).code,
    ).toBe(`export class a {}
globalThis.__b_m__["a"]["a"] = a
;`);
  });

  it("should add globalThis export when ast include of NamedExport has multi variableDeclarator", () => {
    const text = `export const a = 1,b = 2`;
    const ast = parse(text, { sourceType: "module" });
    vol.fromJSON({
      "src/a": text,
    });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([["src/a", "a"]]),
          {
            type: "part",
            member: new Set(["a", "b"]),
          },
          // @ts-ignore
          fs,
        ),
      ).code,
    ).toBe(`export const a = 1,
  b = 2;
globalThis.__b_m__["a"]["a"] = a
globalThis.__b_m__["a"]["b"] = b`);
  });

  it("should add globalThis export when ast include of ExportSpecifier", () => {
    const text = `const a = 1;export {a}`;
    const ast = parse(text, { sourceType: "module" });
    vol.fromJSON({
      "src/a": text,
    });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([["src/a", "a"]]),
          {
            type: "part",
            member: new Set(["a"]),
          },
          // @ts-ignore
          fs,
        ),
      ).code,
    ).toBe(`const a = 1;
export { a };
globalThis.__b_m__["a"].a = a`);
  });

  it("should not add globalThis export when ast include of renamed-ExportSpecifier", () => {
    const text = `const a = 1;export {a as b}`;
    const ast = parse(text, { sourceType: "module" });
    vol.fromJSON({
      "src/a": text,
    });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([["src/a", "a"]]),
          {
            type: "part",
            member: new Set(),
          },
          // @ts-ignore
          fs,
        ),
      ).code,
    ).toBe(`const a = 1;
export { a as b };`);
  });

  it("should add globalThis export when ast include of renamed-ExportSpecifier and shouldReplaceExport has name", () => {
    const text = `const a = 1;export {a as b}`;
    const ast = parse(text, { sourceType: "module" });
    vol.fromJSON({
      "src/a": text,
    });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([["src/a", "a"]]),
          {
            type: "part",
            member: new Set(["b"]),
          },
          // @ts-ignore
          fs,
        ),
      ).code,
    ).toBe(`const a = 1;
export { a as b };
globalThis.__b_m__["a"].b = a`);
  });

  it("should add globalThis export when ast include of invalid-idenfitier renamed-ExportSpecifier and shouldReplaceExport has name", () => {
    const text = `const a = 1;export {a as "0"}`;
    const ast = parse(text, {
      sourceType: "module",
    });
    vol.fromJSON({
      "src/a": text,
    });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([["src/a", "a"]]),
          {
            type: "part",
            member: new Set(["0"]),
          },
          // @ts-ignore
          fs,
        ),
      ).code,
    ).toBe(`const a = 1;
export { a as "0" };
globalThis.__b_m__["a"]["0"] = a`);
  });

  it("should not add globalThis export when ast include of invalid-idenfitier renamed-ExportSpecifier without shouldReplaceExport", () => {
    const text = `const a = 1;export {a as "0"}`;
    const ast = parse(text, {
      sourceType: "module",
    });
    vol.fromJSON({
      "src/a": text,
    });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([["src/a", "a"]]),
          {
            type: "part",
            member: new Set(),
          },
          // @ts-ignore
          fs,
        ),
      ).code,
    ).toBe(`const a = 1;
export { a as "0" };`);
  });

  it("should add globalThis export when ast include of renamed-ExportSpecifier", () => {
    const text = `export { a } from "./b"`;
    const ast = parse(text, { sourceType: "module" });
    vol.fromJSON({
      "src/a": text,
      "src/b": `export const a = 1;`,
    });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([
            ["src/a", "a"],
            ["src/b", "b"],
          ]),
          { type: "part", member: new Set(["a"]) },
          // @ts-ignore
          fs,
        ),
      ).code,
    ).toBe(`export { a } from "./b";
globalThis.__b_m__["a"].a = globalThis.__b_m__["b"].a`);
  });

  it("should not add globalThis export when ast include of renamed-ExportSpecifier without shouldReplaceExport", () => {
    const text = `export { a } from "./b"`;
    const ast = parse(text, { sourceType: "module" });
    vol.fromJSON({
      "src/a": text,
      "src/b": `export const a = 1;`,
    });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([
            ["src/a", "a"],
            ["src/b", "b"],
          ]),
          { type: "part", member: new Set() },
          // @ts-ignore
          fs,
        ),
      ).code,
    ).toBe(`export { a } from "./b";`);
  });

  it("should add globalThis export when ast include of renamed-ExportDefaultSpecifier", () => {
    const text = `export * as a from "./b"`;
    const ast = parse(text, { sourceType: "module" });
    vol.fromJSON({
      "src/a": text,
      "src/b": `export const a = 1;`,
    });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([
            ["src/a", "a"],
            ["src/b", "b"],
          ]),
          { type: "part", member: new Set(["a"]) },
          // @ts-ignore
          fs,
        ),
      ).code,
    ).toBe(`export * as a from "./b";
globalThis.__b_m__["a"].a = globalThis.__b_m__["b"]`);
  });

  it("should add globalThis export when ast include of All re-export", () => {
    const text = `export * from "./b"`;
    const ast = parse(text, { sourceType: "module" });
    vol.fromJSON({
      "src/a": text,
      "src/b": `export const a = 1;`,
    });
    expect(
      generate(
        addGlobalThisExport(
          ast,
          "src/a",
          new Map([
            ["src/a", "a"],
            ["src/b", "b"],
          ]),
          { type: "part", member: new Set() },
          // @ts-ignore
          fs,
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
        { type: "part", member: new Set() },
      ),
    ).throw();
  });
});

describe("handleSourcedReExport test", () => {
  it("when get null module key, fast return", () => {
    const path = getExportNamedDeclarationPath(`export { foo } from "b";`);
    const insertAfterSpy = vi.spyOn(path, "insertAfter");
    handleSourcedReExport(path, "moduleA", null, {
      type: "part",
      member: new Set(),
    });

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
