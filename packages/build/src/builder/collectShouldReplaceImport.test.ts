import { describe, it, expect } from "vite-plus/test";
import * as t from "@babel/types";
import {
  collectShouldReplaceExporter,
  collectShouldReplaceImportExports,
  extractImportMember,
} from "./collectShouldReplaceImport";
import { parse } from "@babel/parser";
import { fs, vol } from "memfs";
import { beforeEach } from "node:test";
describe("test extractImportMember", () => {
  it("when only ImportNamespaceSpecifier, return type:all", () => {
    const ast = t.importDeclaration(
      [t.importNamespaceSpecifier(t.identifier("foo"))],
      t.stringLiteral("./foo.ts"),
    );
    expect(extractImportMember(ast)).toStrictEqual({
      type: "all",
      path: "./foo.ts",
    });
  });

  it("when include ImportNamespaceSpecifier, return type:all", () => {
    const ast = t.importDeclaration(
      [
        t.importSpecifier(t.identifier("variable"), t.identifier("variable")),
        t.importNamespaceSpecifier(t.identifier("foo")),
      ],
      t.stringLiteral("./foo.ts"),
    );
    expect(extractImportMember(ast)).toStrictEqual({
      type: "all",
      path: "./foo.ts",
    });
  });

  it("when not include ImportNamespaceSpecifier, return type:some", () => {
    const ast = t.importDeclaration(
      [t.importSpecifier(t.identifier("variable"), t.identifier("variable"))],
      t.stringLiteral("./foo.ts"),
    );
    expect(extractImportMember(ast)).toStrictEqual({
      type: "some",
      path: "./foo.ts",
      member: new Set(["variable"]),
    });
  });

  it("when not include ImportNamespaceSpecifier, return type:some. if include default, return as 'default'", () => {
    const ast = t.importDeclaration(
      [t.importDefaultSpecifier(t.identifier("defaultVariable"))],
      t.stringLiteral("./foo.ts"),
    );
    expect(extractImportMember(ast)).toStrictEqual({
      type: "some",
      path: "./foo.ts",
      member: new Set(["default"]),
    });
  });
});

describe("test collectShouldReplaceExporter", () => {
  it("when non import,return empty map", () => {
    const ast = parse(`cosole.log("hello world")`, { sourceType: "module" });
    expect(collectShouldReplaceExporter(ast)).toStrictEqual(new Map());
  });
  it("when namespace import,return type:all", () => {
    const ast = parse(`import * as name from "./foo.ts";`, {
      sourceType: "module",
    });
    expect(collectShouldReplaceExporter(ast)).toStrictEqual(
      new Map([["./foo.ts", { type: "all" }]]),
    );
  });
  it("when normal import,return type:part and set has identifier", () => {
    const ast = parse(`import {name} from "./foo.ts";`, {
      sourceType: "module",
    });
    expect(collectShouldReplaceExporter(ast)).toStrictEqual(
      new Map([["./foo.ts", { type: "part", member: new Set(["name"]) }]]),
    );
  });
  it("when default import,return type:part and identifer as 'default'", () => {
    const ast = parse(`import defaultVariable from "./foo.ts";`, {
      sourceType: "module",
    });
    expect(collectShouldReplaceExporter(ast)).toStrictEqual(
      new Map([["./foo.ts", { type: "part", member: new Set(["default"]) }]]),
    );
  });
  it("when already name-space import,return type:all", () => {
    const ast = parse(
      `import * as foo from "./foo.ts";import {bar} from "./foo.ts"`,
      { sourceType: "module" },
    );
    expect(collectShouldReplaceExporter(ast)).toStrictEqual(
      new Map([["./foo.ts", { type: "all" }]]),
    );
  });
  it("when already import,return type:part and merging it", () => {
    const ast = parse(
      `import {foo} from "./foo.ts";import {bar} from "./foo.ts"`,
      { sourceType: "module" },
    );
    expect(collectShouldReplaceExporter(ast)).toStrictEqual(
      new Map([
        ["./foo.ts", { type: "part", member: new Set(["foo", "bar"]) }],
      ]),
    );
  });
  it("when multi import,return multi import data", () => {
    const ast = parse(
      `import {foo} from "./foo.ts";import {bar} from "./bar.ts"`,
      { sourceType: "module" },
    );
    expect(collectShouldReplaceExporter(ast)).toStrictEqual(
      new Map([
        ["./foo.ts", { type: "part", member: new Set(["foo"]) }],
        ["./bar.ts", { type: "part", member: new Set(["bar"]) }],
      ]),
    );
  });
});

describe("test collectShouldReplaceImportExports", () => {
  beforeEach(() => {
    vol.reset();
  });
  it("When import codeblock, collect that", () => {
    const fooText = `"use codeblock{foo}";import { bar } from "./bar.ts"`;
    const fooAst = parse(fooText, {
      sourceType: "module",
    });
    const barText = `"use worldcode";export const bar = "baz"`;
    const bar = parse(barText, {
      sourceType: "module",
    });
    vol.fromJSON({
      "src/foo.ts": fooText,
      "src/bar.ts": barText,
    });
    expect(
      // @ts-ignore
      collectShouldReplaceImportExports(
        new Map([
          ["src/foo.ts", fooAst],
          ["src/bar.ts", bar],
        ]),
        // @ts-ignore
        fs,
      ),
    ).toStrictEqual({
      shouldReplaceImportFiles: new Set(["src/foo.ts"]),
      shouldReplaceExportFiles: new Map([
        [
          "src/bar.ts",
          {
            member: new Set(["bar"]),
            type: "part",
          },
        ],
      ]),
    });
  });
  it("when import codeblock even diffient directory level, collect that", () => {
    const fooText = `"use codeblock{foo}";import { bar } from "../bar.ts"`;
    const fooAst = parse(fooText, {
      sourceType: "module",
    });
    const barText = `"use worldcode";export const bar = "baz"`;
    const barAst = parse(barText, {
      sourceType: "module",
    });
    vol.fromJSON({
      "src/dir/foo.ts": fooText,
      "src/bar.ts": barText,
    });
    expect(
      collectShouldReplaceImportExports(
        new Map([
          ["src/dir/foo.ts", fooAst],
          ["src/bar.ts", barAst],
        ]),
        // @ts-expect-error
        fs,
      ),
    ).toStrictEqual({
      shouldReplaceImportFiles: new Set(["src/dir/foo.ts"]),
      shouldReplaceExportFiles: new Map([
        [
          "src/bar.ts",
          {
            member: new Set(["bar"]),
            type: "part",
          },
        ],
      ]),
    });
  });
  it("when import codeblock even diffient directory level, collect that", () => {
    const fooText = `"use codeblock{foo}";import { bar } from "./dir/bar.ts"`;
    const fooAst = parse(fooText, {
      sourceType: "module",
    });
    const barText = `"use worldcode";export const bar = "baz"`;
    const barAst = parse(barText, {
      sourceType: "module",
    });
    vol.fromJSON({
      "src/foo.ts": fooText,
      "src/dir/bar.ts": barText,
    });
    expect(
      collectShouldReplaceImportExports(
        new Map([
          ["src/foo.ts", fooAst],
          ["src/dir/bar.ts", barAst],
        ]),
        // @ts-ignore
        fs,
      ),
    ).toStrictEqual({
      shouldReplaceImportFiles: new Set(["src/foo.ts"]),
      shouldReplaceExportFiles: new Map([
        [
          "src/dir/bar.ts",
          {
            member: new Set(["bar"]),
            type: "part",
          },
        ],
      ]),
    });
  });
  it("when worldcode import, does not collect that", () => {
    const fooText = `"use worldcode";import { bar } from "./bar.ts"`;
    const foo = parse(fooText, {
      sourceType: "module",
    });
    const barText = `"use worldcode";export const bar = "baz"`;
    const bar = parse(barText, {
      sourceType: "module",
    });
    vol.fromJSON({
      "src/foo.ts": fooText,
      "src/bar.ts": barText,
    });
    expect(
      collectShouldReplaceImportExports(
        new Map([
          ["src/foo.ts", foo],
          ["src/bar.ts", bar],
        ]),
        // @ts-ignore
        fs,
      ),
    ).toStrictEqual({
      shouldReplaceImportFiles: new Set([]),
      shouldReplaceExportFiles: new Map(),
    });
  });
  it("when one module is imported by 2 module, collect all member name which imported modules", () => {
    const fooText = `"use codeblock{foo}";import { bar } from "./bar.ts"`;
    const foo = parse(fooText, {
      sourceType: "module",
    });
    const bartext = `"use worldcode";export const bar = "baz";export const qux = "corge";`;
    const bar = parse(bartext, {
      sourceType: "module",
    });
    const piyoText = `"use codeblock{piyo}";import {qux} from "./bar.ts"`;
    const piyo = parse(piyoText, {
      sourceType: "module",
    });
    vol.fromJSON({
      "src/foo.ts": fooText,
      "src/bar.ts": bartext,
      "src/piyo.ts": piyoText,
    });
    expect(
      collectShouldReplaceImportExports(
        new Map([
          ["src/foo.ts", foo],
          ["src/bar.ts", bar],
          ["src/piyo.ts", piyo],
        ]),
        // @ts-ignore
        fs,
      ),
    ).toStrictEqual({
      shouldReplaceImportFiles: new Set(["src/foo.ts", "src/piyo.ts"]),
      shouldReplaceExportFiles: new Map([
        [
          "src/bar.ts",
          {
            member: new Set(["bar", "qux"]),
            type: "part",
          },
        ],
      ]),
    });
  });
});
