import type { Visitor } from "@babel/traverse";
import * as t from "@babel/types";
import traverse from "@babel/traverse";
import {
  generateGlobalThisModuleMemberExpression,
  getNameFromIdentifierOrStringLiteral,
  resolvePathOrThrowError,
} from "./utils";
import type { FileSystem } from "enhanced-resolve";

type NormalImportData = {
  exportedName: string;
  importedName: string;
};

export const replaceImport = (
  ast: t.File,
  fileName: string,
  nameMap: Map<string, string>,
  fs: FileSystem,
  tsconfigPath?: string,
): t.File => {
  const visitor: Visitor = {
    ImportDeclaration(path) {
      const moduleKey = getModuleKeyFromImportDeclaration(
        path.node,
        nameMap,
        fileName,
        fs,
        tsconfigPath,
      );
      const importData = generateImportData(path.node);
      const normalImportVariableDeclarator =
        generateVariableDeclaratorFromNormalImportDataArray(
          importData.other,
          moduleKey,
        );
      const namespaceImportVariableDeclarators =
        generateVariableDeclaratorsFromNamespaceImport(
          importData.namespace,
          moduleKey,
        );
      const variableDeclaration = t.variableDeclaration(
        "const",
        normalImportVariableDeclarator == null
          ? namespaceImportVariableDeclarators
          : namespaceImportVariableDeclarators.concat(
              normalImportVariableDeclarator,
            ),
      );
      path.replaceWith(variableDeclaration);
    },
  };
  traverse(ast, visitor);
  return ast;
};

export const generateImportData = (
  node: t.ImportDeclaration,
): { namespace: string[]; other: NormalImportData[] } => {
  const namespace: string[] = [];
  const other: NormalImportData[] = [];
  for (const spec of node.specifiers) {
    if (spec.type === "ImportDefaultSpecifier") {
      const name = spec.local.name;
      other.push({ exportedName: "default", importedName: name });
      continue;
    }
    if (spec.type === "ImportSpecifier") {
      other.push({
        exportedName: getNameFromIdentifierOrStringLiteral(spec.imported),
        importedName: spec.local.name,
      });
      continue;
    }
    namespace.push(spec.local.name);
  }
  return { namespace, other };
};

export const generateVariableDeclaratorFromNormalImportDataArray = (
  importDataArray: NormalImportData[],
  moduleKey: string,
): t.VariableDeclarator | null => {
  if (importDataArray.length === 0) return null;
  const props: t.ObjectProperty[] = [];
  for (const { exportedName, importedName } of importDataArray) {
    props.push(generateObjectProperty(exportedName, importedName));
  }
  const objectPattern = t.objectPattern(props);
  const variableDeclarator = t.variableDeclarator(
    objectPattern,
    generateGlobalThisModuleMemberExpression(moduleKey),
  );
  return variableDeclarator;
};

export const generateObjectProperty = (
  exportedName: string,
  importedName: string,
): t.ObjectProperty =>
  t.isValidIdentifier(exportedName)
    ? generateObjectProprtyNonComputed(exportedName, importedName)
    : generateObjectProprtyComputed(exportedName, importedName);

export const generateObjectProprtyComputed = (
  exportedName: string,
  importedName: string,
): t.ObjectPropertyComputed =>
  t.objectProperty(
    t.stringLiteral(exportedName),
    t.identifier(importedName),
    true,
    false,
  );

export const generateObjectProprtyNonComputed = (
  exportedName: string,
  importedName: string,
): t.ObjectPropertyNonComputed =>
  t.objectProperty(
    t.identifier(exportedName),
    t.identifier(importedName),
    false,
    exportedName === importedName,
  );

export const generateVariableDeclaratorsFromNamespaceImport = (
  importerNames: string[],
  moduleKey: string,
): t.VariableDeclarator[] => {
  return importerNames.map((name) =>
    generateVariableDeclaratorFromNamespaceImport(name, moduleKey),
  );
};

export const generateVariableDeclaratorFromNamespaceImport = (
  importerName: string,
  moduleKey: string,
) => {
  const nameIdentifier = t.identifier(importerName);
  return t.variableDeclarator(
    nameIdentifier,
    generateGlobalThisModuleMemberExpression(moduleKey),
  );
};

export const getModuleKeyFromImportDeclaration = (
  node: t.ImportDeclaration,
  nameMap: Map<string, string>,
  fileName: string,
  fs: FileSystem,
  tsconfigPath?: string,
): string => {
  const name = node.source.value;
  const replacedName = nameMap.get(
    resolvePathOrThrowError(name, fileName, fs, tsconfigPath),
  );
  if (replacedName == null)
    throw new TypeError(`${name} mapped name is not found. this is bug.`);
  return replacedName;
};
