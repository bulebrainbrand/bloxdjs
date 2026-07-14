import * as t from "@babel/types";
import path from "path";
import { GLOBALTHIS_MODULE_INTERNAL_PROPERTY_NAME } from "./constants";
export const getNameFromIdentifierOrStringLiteral = (
  node: t.Identifier | t.StringLiteral,
): string => (t.isStringLiteral(node) ? node.value : node.name);

export const resolvePath = (exporter: string, importer: string) =>
  path.join(path.dirname(importer), exporter).replaceAll("\\", "/");

export const generateGlobalThisModuleMemberExpression = (
  moduleKey: string,
): t.MemberExpression => {
  return t.memberExpression(
    t.memberExpression(
      t.identifier("globalThis"),
      t.identifier(GLOBALTHIS_MODULE_INTERNAL_PROPERTY_NAME),
    ),
    t.stringLiteral(moduleKey),
    true,
  );
};

export const isNodePackage = (name: string) => !name.startsWith(".");
export const getModuleKeyOrThrow = (
  nameMap: Map<string, string>,
  path: string,
): string => {
  const key = nameMap.get(path);
  if (key == null) {
    throw new TypeError(`${path} mapped name is not found. this is bug.`);
  }
  return key;
};

export const resolveTargetModuleKey = (
  source: string,
  fileName: string,
  nameMap: Map<string, string>,
): string | null => {
  if (isNodePackage(source)) return null;
  const exporterPath = resolvePath(source, fileName);
  return getModuleKeyOrThrow(nameMap, exporterPath);
};

export function assertNodeTypes<T extends t.Node>(
  nodes: t.Node[],
  guard: (n: t.Node) => n is T,
  message: string,
): asserts nodes is T[] {
  if (!nodes.every(guard)) throw new TypeError(message);
}

/**
 * use only  after resolved tsconfig path
 * @param exporter
 * @returns
 */
export const isNpmPackage = (exporter: string) => !exporter.startsWith(".");
