import type { NodePath, Visitor } from "@babel/traverse";
import * as t from "@babel/types";
import {
  assertNodeTypes,
  generateGlobalThisModuleMemberExpression,
  getModuleKeyOrThrow,
  getNameFromIdentifierOrStringLiteral,
  resolveTargetModuleKey,
} from "./utils";
import traverse from "@babel/traverse";

export type ExportedMemberOfShouldReplace =
  | { type: "part"; member: Set<string> }
  | { type: "all" };

export const addGlobalThisExport = (
  ast: t.File,
  fileName: string,
  nameMap: Map<string, string>,
  shouldReplaceExport: ExportedMemberOfShouldReplace,
): t.File => {
  const moduleKey = getModuleKeyOrThrow(nameMap, fileName);
  const visitor: Visitor = {
    ExportNamedDeclaration(path) {
      const node = path.node;
      const declaration = node.declaration;
      const source = node.source;

      if (declaration) {
        handleDeclarationExport(
          path,
          declaration,
          moduleKey,
          shouldReplaceExport,
        );
        return;
      }

      if (source == null) {
        handleLocalReExport(path, moduleKey, shouldReplaceExport);
        return;
      }

      const targetModuleKey = resolveTargetModuleKey(
        source.value,
        fileName,
        nameMap,
      );
      handleSourcedReExport(
        path,
        moduleKey,
        targetModuleKey,
        shouldReplaceExport,
      );
    },
    ExportAllDeclaration(path) {
      const targetModuleKey = resolveTargetModuleKey(
        path.node.source.value,
        fileName,
        nameMap,
      );
      handleExportAll(path, moduleKey, targetModuleKey);
    },
  };
  traverse(ast, visitor);
  return ast;
};

export const handleDeclarationExport = (
  path: NodePath<t.ExportNamedDeclaration>,
  declaration: t.Declaration,
  moduleKey: string,
  shouldReplaceExport: ExportedMemberOfShouldReplace,
) => {
  path.insertAfter(
    generateGlobalThisAssignmentExpressionsFromDeclaration(
      declaration,
      moduleKey,
      shouldReplaceExport,
    ),
  );
};

export const handleLocalReExport = (
  path: NodePath<t.ExportNamedDeclaration>,
  moduleKey: string,
  shouldReplaceExport: ExportedMemberOfShouldReplace,
) => {
  const specifiers = path.node.specifiers;
  assertNodeTypes(
    specifiers,
    (node) => node.type === "ExportSpecifier",
    "can't have t.ExportDefaultSpecifier | t.ExportNamespaceSpecifier without t.ExportNamedDeclaration.source property",
  );
  path.insertAfter(
    generateGlobalThisAssignmentExpressionsFromExportSpecifiers(
      specifiers.filter((node) =>
        shouldExportFilter(
          getNameFromIdentifierOrStringLiteral(node.exported),
          shouldReplaceExport,
        ),
      ),
      moduleKey,
    ),
  );
};

export const handleSourcedReExport = (
  path: NodePath<t.ExportNamedDeclaration>,
  moduleKey: string,
  targetModuleKey: string | null,
  shouldReplaceExport: ExportedMemberOfShouldReplace,
) => {
  if (targetModuleKey == null) return;
  const specifiers = path.node.specifiers;

  assertNodeTypes(
    specifiers,
    (node) =>
      node.type === "ExportSpecifier" ||
      node.type === "ExportNamespaceSpecifier",
    "this builder is not support ExportDefaultSpecifier e.g. export a from 'b'",
  );

  path.insertAfter(
    generateGlobalThisAssignmentExpressionsFromReExportSpecifiers(
      specifiers.filter((node) =>
        shouldExportFilter(
          getNameFromIdentifierOrStringLiteral(node.exported),
          shouldReplaceExport,
        ),
      ),
      moduleKey,
      targetModuleKey,
    ),
  );
};
export const handleExportAll = (
  path: NodePath<t.ExportAllDeclaration>,
  moduleKey: string,
  targetModuleKey: string | null,
) => {
  if (targetModuleKey == null) return;
  path.insertAfter(
    t.callExpression(
      t.memberExpression(t.identifier("Object"), t.identifier("assign"), false),
      [
        generateGlobalThisModuleMemberExpression(moduleKey),
        generateGlobalThisModuleMemberExpression(targetModuleKey),
      ],
    ),
  );
};
export const generateGlobalThisAssignmentExpressionsFromDeclaration = (
  declaration: t.Declaration,
  moduleKey: string,
  shouldReplaceExport: ExportedMemberOfShouldReplace,
): t.AssignmentExpression[] => {
  if (
    !t.isVariableDeclaration(declaration) &&
    !t.isClassDeclaration(declaration) &&
    !t.isFunctionDeclaration(declaration)
  ) {
    throw new TypeError(`this builder does not support typescript`);
  }

  const names = Object.keys(t.getBindingIdentifiers(declaration));
  return names
    .filter((name) => shouldExportFilter(name, shouldReplaceExport))
    .map((name) =>
      generateGlobalThisAssignmentExpressionFromNames(name, name, moduleKey),
    );
};

export const generateGlobalThisAssignmentExpressionsFromExportSpecifiers = (
  nodes: t.ExportSpecifier[],
  moduleKey: string,
): t.AssignmentExpression[] => {
  return nodes.map((node) =>
    generateGlobalThisAssignmentExpression(
      node.exported,

      moduleKey,
      node.local,
    ),
  );
};

export const generateGlobalThisAssignmentExpressionFromNames = (
  exported: string,
  local: string,
  moduleKey: string,
) => {
  const leftSideMemberExpression = t.memberExpression(
    generateGlobalThisModuleMemberExpression(moduleKey),
    t.stringLiteral(exported),
    true,
  );
  const rightSideIdentifier = t.identifier(local);
  return t.assignmentExpression(
    "=",
    leftSideMemberExpression,
    rightSideIdentifier,
  );
};

export const generateGlobalThisAssignmentExpressionsFromReExportSpecifiers = (
  nodes: (t.ExportSpecifier | t.ExportNamespaceSpecifier)[],
  localModuleKey: string,
  exporterModuleKey: string,
): t.AssignmentExpression[] => {
  return nodes.map((node) => {
    if (t.isExportSpecifier(node))
      return generateGlobalThisAssignmentExpression(
        node.exported,
        localModuleKey,
        toComputedMemberExpression(
          generateGlobalThisModuleMemberExpression(exporterModuleKey),
          node.local,
        ),
      );
    return generateGlobalThisAssignmentExpressionForReExportNamespaceSpecifier(
      node.exported,
      localModuleKey,
      exporterModuleKey,
    );
  });
};

export const generateGlobalThisAssignmentExpressionForReExportNamespaceSpecifier =
  (
    exported: t.Identifier | t.StringLiteral,
    localModuleKey: string,
    exporterModuleKey: string,
  ) => {
    const leftSideMemberExpression = toComputedMemberExpression(
      generateGlobalThisModuleMemberExpression(localModuleKey),
      exported,
    );
    const rightSideIdentifier =
      generateGlobalThisModuleMemberExpression(exporterModuleKey);
    return t.assignmentExpression(
      "=",
      leftSideMemberExpression,
      rightSideIdentifier,
    );
  };

const toComputedMemberExpression = (
  object: t.Expression,
  key: t.Identifier | t.StringLiteral,
): t.MemberExpression =>
  t.memberExpression(object, key, t.isStringLiteral(key));

const generateGlobalThisAssignmentExpression = (
  exported: t.Identifier | t.StringLiteral,
  moduleKey: string,
  rightSide: t.Expression,
): t.AssignmentExpression =>
  t.assignmentExpression(
    "=",
    toComputedMemberExpression(
      generateGlobalThisModuleMemberExpression(moduleKey),
      exported,
    ),
    rightSide,
  );

const shouldExportFilter = (
  name: string,
  shouldReplaceExport: ExportedMemberOfShouldReplace,
): boolean =>
  shouldReplaceExport.type === "all" || shouldReplaceExport.member.has(name);
