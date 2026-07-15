import traverse, { type Visitor } from "@babel/traverse";
import * as t from "@babel/types";
import {
  getNameFromIdentifierOrStringLiteral,
  isNpmPackage,
  resolvePathOrThrowError,
} from "./utils";
import { getFileInfo } from "./getFileInfo";
import { isErr, unwrap } from "../result";
import type { ExportedMemberOfShouldReplace } from "./exportAdder";
import type { FileSystem } from "enhanced-resolve";
/**
 * must replace import with globalThis
 */
export const collectShouldReplaceImportExports = (
  astMap: Map<string, t.File>,
  fs: FileSystem,
  tsconfigPath?: string,
) => {
  const importedExporters: Map<string, ExportedMemberOfShouldReplace> =
    new Map();
  const shouldReplaceImportFiles: Set<string> = new Set();
  for (const [filePath, ast] of astMap) {
    const info = getFileInfo(ast);
    if (isErr(info)) {
      const err = info.error;
      throw new TypeError(`${filePath} is not valid. file mode error:${err}`);
    }
    // worldcode do not need to edit import/export
    if (unwrap(info).type === "worldcode") continue;

    const result = collectShouldReplaceExporter(ast);
    for (const [rawExporter, obj] of result) {
      const absolutedExporterPath = resolvePathOrThrowError(
        rawExporter,
        filePath,
        fs,
        tsconfigPath,
      );
      const value = importedExporters.get(absolutedExporterPath);
      if (value?.type === "all") continue;
      if (value === undefined || obj.type === "all") {
        importedExporters.set(absolutedExporterPath, obj);
        continue;
      }

      importedExporters.set(absolutedExporterPath, {
        type: "part",
        member: value.member.union(obj.member),
      });
    }
    if (result.size !== 0) {
      shouldReplaceImportFiles.add(filePath);
    }
  }
  return {
    shouldReplaceImportFiles,
    shouldReplaceExportFiles: importedExporters,
  };
};

export const collectShouldReplaceExporter = (
  ast: t.File,
): Map<string, ExportedMemberOfShouldReplace> => {
  /**
   * keyはimport時の識別子
   */
  const importMap = new Map<string, ExportedMemberOfShouldReplace>();

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
