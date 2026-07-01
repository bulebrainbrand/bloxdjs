import * as t from "@babel/types";
import { parse } from "@babel/parser";
import type { ReadonlyFsClient } from "../types/fs";
export const parseFile = (code: string): t.File => {
  return parse(code, { sourceType: "module" });
};

export const parseFileFromPath = (
  path: string,
  fs: ReadonlyFsClient,
): t.File => {
  const content = fs.readFileSync(path).toString();
  return parseFile(content);
};

export const parseFiles = (paths: string[], fs: ReadonlyFsClient): t.File[] => {
  return paths.map((path) => parseFileFromPath(path, fs));
};
