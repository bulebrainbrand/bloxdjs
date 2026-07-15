import * as t from "@babel/types";
import pkg, { type FileSystem } from "enhanced-resolve";
import { GLOBALTHIS_MODULE_INTERNAL_PROPERTY_NAME } from "./constants";
import path from "path";

const { ResolverFactory } = pkg;
export const getNameFromIdentifierOrStringLiteral = (
  node: t.Identifier | t.StringLiteral,
): string => (t.isStringLiteral(node) ? node.value : node.name);

export const resolvePath = (
  exporter: string,
  importer: string,
  fs: FileSystem,
  tsconfigPath?: string,
): string | false => {
  const resolver = ResolverFactory.createResolver({
    fileSystem: fs,
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    tsconfig: tsconfigPath,
    useSyncFileSystemCalls: true,
  });

  return resolver.resolveSync(path.dirname(importer), exporter);
};

export const resolvePathOrThrowError = (
  exporter: string,
  importer: string,
  fs: FileSystem,
  tsconfigPath?: string,
): string => {
  const result = resolvePath(exporter, importer, fs, tsconfigPath);
  if (result === false)
    throw new TypeError(`can't resolved import "${exporter}" on ${importer}`);
  return result;
};
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
  fs: FileSystem,
  tsconfigPath?: string,
): string | null => {
  if (isNodePackage(source)) return null;
  const exporterPath = resolvePathOrThrowError(
    source,
    fileName,
    fs,
    tsconfigPath,
  );
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
