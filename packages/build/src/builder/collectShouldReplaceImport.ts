import traverse, { type Visitor } from "@babel/traverse";
import * as t from "@babel/types";
import { getNameFromIdentifierOrStringLiteral, resolvePath } from "./utils";
import { getFileInfo } from "./getFileInfo";
import { isErr, unwrap } from "../result";

/**
 * must replace import with globalThis
 */
export const collectShouldReplaceImports = (astMap: Map<string, t.File>) => {
  const shouldReplaceExportFiles: Partial<
    Record<string, { type: "part"; member: Set<string> } | { type: "all" }>
  > = {};
  const shouldReplaceImportFiles: Set<string> = new Set();
  for (const [filePath, ast] of astMap) {
    const info = getFileInfo(ast);
    if (isErr(info)) {
      const err = info.error;
      throw new TypeError(`${filePath} is not valid. file mode error:${err}`);
    }
    if (unwrap(info).type === "worldcode") continue;
    const result = collectShouldReplaceImport(ast, filePath);
    for (const [exporter, obj] of result) {
      if (shouldReplaceExportFiles[exporter] == null || obj.type === "all") {
        shouldReplaceExportFiles[exporter] = obj;
        continue;
      }
      if (shouldReplaceExportFiles[exporter].type === "all") {
        continue;
      }
      shouldReplaceExportFiles[exporter].member = shouldReplaceExportFiles[
        exporter
      ].member.union(obj.member);
    }
    if (result.size !== 0) {
      shouldReplaceImportFiles.add(filePath);
    }
  }
  return { shouldReplaceImportFiles, shouldReplaceExportFiles };
};

export const collectShouldReplaceImport = (ast: t.File, filePath: string) => {
  /**
   * keyはimport時の識別子
   */
  const importMap: Map<
    string,
    { type: "part"; member: Set<string> } | { type: "all" }
  > = new Map();

  const visitor: Visitor = {
    ImportDeclaration(importPath) {
      const result = extractImportMember(importPath.node);

      if (result.type === "package") {
        return;
      }
      const id = resolvePath(result.path, filePath);
      const value = importMap.get(id);
      if (value?.type === "all") {
        return;
      }
      if (result.type === "every") {
        importMap.set(id, { type: "all" });
        return;
      }
      importMap.set(id, {
        type: "part",
        member: result.member.union(value?.member ?? new Set()),
      });
    },
  };
  traverse(ast, visitor);
  return importMap;
};

export const extractImportMember = (
  node: t.ImportDeclaration,
):
  | { type: "some"; path: string; member: Set<string> }
  | { type: "package" }
  | { type: "every"; path: string } => {
  const exporter = node.source.value;
  if (!exporter.startsWith(".")) return { type: "package" };
  const member = [];

  for (const spec of node.specifiers) {
    switch (spec.type) {
      case "ImportSpecifier": {
        member.push(getNameFromIdentifierOrStringLiteral(spec.imported));
        break;
      }
      case "ImportDefaultSpecifier": {
        member.push("default");
        break;
      }
      case "ImportNamespaceSpecifier": {
        return { type: "every", path: exporter };
      }
    }
  }
  return { type: "some", path: exporter, member: new Set(member) };
};
