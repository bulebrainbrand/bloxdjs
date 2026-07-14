import { describe, it, expect } from "vite-plus/test";
import * as t from "@babel/types";
import {
  collectShouldReplaceExporter,
  extractImportMember,
} from "./collectShouldReplaceImport";
import { parse } from "@babel/parser";
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
