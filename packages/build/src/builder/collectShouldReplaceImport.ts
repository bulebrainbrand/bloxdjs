import traverse, { type Visitor } from "@babel/traverse";
import * as t from "@babel/types";
import {
  getNameFromIdentifierOrStringLiteral,
  isNpmPackage,
  resolvePath,
} from "./utils";
import { getFileInfo } from "./getFileInfo";
import { isErr, unwrap } from "../result";

/**
 * must replace import with globalThis
 */
export const collectShouldReplaceImportExports = (
  astMap: Map<string, t.File>,
) => {
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
    const result = collectShouldReplaceExporter(ast);
    for (const [exporter, obj] of result) {
      const resolvedExporter = resolvePath(exporter, filePath);
      if (
        shouldReplaceExportFiles[resolvedExporter] == null ||
        obj.type === "all"
      ) {
        shouldReplaceExportFiles[resolvedExporter] = obj;
        continue;
      }
      if (shouldReplaceExportFiles[resolvedExporter].type === "all") {
        continue;
      }
      shouldReplaceExportFiles[resolvedExporter].member =
        shouldReplaceExportFiles[resolvedExporter].member.union(obj.member);
    }
    if (result.size !== 0) {
      shouldReplaceImportFiles.add(filePath);
    }
  }
  return { shouldReplaceImportFiles, shouldReplaceExportFiles };
};
export type ImportedMemberData =
  | { type: "part"; member: Set<string> }
  | { type: "all" };
export const collectShouldReplaceExporter = (
  ast: t.File,
): Map<string, ImportedMemberData> => {
  /**
   * keyはimport時の識別子
   */
  const importMap = new Map<string, ImportedMemberData>();

  const visitor: Visitor = {
    ImportDeclaration(importPath) {
      const result = extractImportMember(importPath.node);

      if (isNpmPackage(result.path)) {
        return;
      }
      const value = importMap.get(result.path);
      if (value?.type === "all") {
        return;
      }
      if (result.type === "all") {
        importMap.set(result.path, { type: "all" });
        return;
      }
      importMap.set(result.path, {
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
  | { type: "all"; path: string } => {
  const exporter = node.source.value;
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
        return { type: "all", path: exporter };
      }
    }
  }
  return { type: "some", path: exporter, member: new Set(member) };
};
