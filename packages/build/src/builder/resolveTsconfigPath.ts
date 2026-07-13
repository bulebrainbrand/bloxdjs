// oxlint-disable typescript/no-unnecessary-condition
import * as path from "node:path";

export interface TsConfig {
  compilerOptions?: {
    paths?: Record<string, string[]>;
  };
}

export function resolveImportPath(
  tsconfig: TsConfig,
  tsconfigFilePath: string,
  targetFilePath: string,
  importString: string,
): string {
  if (importString.startsWith(".")) {
    return importString;
  }

  const { paths } = tsconfig.compilerOptions ?? {};
  if (!paths) return importString;
  const tsconfigDir = path.dirname(path.resolve(tsconfigFilePath));
  const baseUrlAbsolute = path.resolve(tsconfigDir);

  let resolvedAbsolutePath: string | null = null;
  for (const [pattern, targets] of Object.entries(paths)) {
    const wildcardIndex = pattern.indexOf("*");
    const hasWildcard = wildcardIndex !== -1;

    const prefix = hasWildcard ? pattern.slice(0, wildcardIndex) : pattern;
    const suffix = hasWildcard ? pattern.slice(wildcardIndex + 1) : "";

    let matchedPart: string | null = null;

    if (hasWildcard) {
      if (
        importString.startsWith(prefix) &&
        importString.endsWith(suffix) &&
        importString.length >= prefix.length + suffix.length
      ) {
        matchedPart = importString.slice(
          prefix.length,
          importString.length - suffix.length,
        );
      }
    } else if (importString === pattern) {
      matchedPart = "";
    }

    if (matchedPart === null) continue;
    const target: string | undefined = targets[0];
    if (target === undefined) continue;

    const resolvedTarget = hasWildcard
      ? target.replace("*", matchedPart)
      : target;

    resolvedAbsolutePath = path.resolve(baseUrlAbsolute, resolvedTarget);
    break;
  }

  if (!resolvedAbsolutePath) {
    return importString;
  }

  const targetDir = path.dirname(path.resolve(targetFilePath));
  let relativePath = path.relative(targetDir, resolvedAbsolutePath);

  if (!relativePath.startsWith(".")) {
    relativePath = "./" + relativePath;
  }

  relativePath = relativePath.split(path.sep).join("/");
  if (path.extname(relativePath) === "") relativePath += ".ts";
  return relativePath;
}

import * as t from "@babel/types";
import traverse, { NodePath } from "@babel/traverse";

export const resolveImportPathAst = (
  ast: t.File,
  tsconfig: TsConfig,
  tsconfigFilePath: string,
  targetFilePath: string,
): t.File => {
  traverse(ast, {
    ImportDeclaration(path) {
      replaceImportPath(path, tsconfig, tsconfigFilePath, targetFilePath);
    },
    ExportNamedDeclaration(path) {
      replaceImportPath(path, tsconfig, tsconfigFilePath, targetFilePath);
    },
    ExportAllDeclaration(path) {
      replaceImportPath(path, tsconfig, tsconfigFilePath, targetFilePath);
    },
  });
  return ast;
};

const replaceImportPath = (
  path: NodePath<
    t.ExportAllDeclaration | t.ExportNamedDeclaration | t.ImportDeclaration
  >,
  tsconfig: TsConfig,
  tsconfigFilePath: string,
  targetFilePath: string,
): void => {
  const node = path.node;
  if (node.source == null) return;
  const importString = node.source.value;
  const resolved = resolveImportPath(
    tsconfig,
    tsconfigFilePath,
    targetFilePath,
    importString,
  );
  console.log(`replace path from ${importString} to ${resolved}`);
  node.source = t.stringLiteral(resolved);
};

export const resolveImportPathAsts = (
  files: Map<string, t.File>,
  tsconfig: TsConfig,
  tsconfigFilePath: string,
): void => {
  for (const [filePath, ast] of files) {
    resolveImportPathAst(ast, tsconfig, tsconfigFilePath, filePath);
  }
};
