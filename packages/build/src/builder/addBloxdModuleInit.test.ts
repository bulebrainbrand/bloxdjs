import generate from "@babel/generator";
import { file, program } from "@babel/types";
import { describe, it, expect } from "vite-plus/test";
import { addBloxdModuleInit } from "./addBloxdModuleInit";

describe("test addBloxdModuleInit", () => {
  it("add init", () => {
    const ast = file(program([]));
    addBloxdModuleInit(ast);
    expect(generate(ast).code).toBe(`globalThis.__b_m__ = {};`);
  });
});
