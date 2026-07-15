import path from "node:path";
import type { FullFsClient } from "../types/fs";
import { TEMP_DIR } from "./constants";
/**
 *
 * @param filePaths - absolutedPath[]
 * @param cwd
 * @param fs
 * @returns absolutedPath[] - inner temp path
 */
export const copyToTempDirectory = (
  filePaths: string[],
  cwd: string,
  fs: FullFsClient,
) => filePaths.map((path) => copyFileToTempDirectory(path, fs, cwd));

/**
 *
 * @param filePath - absoluted or relative path. out of temp dir
 * @param cwd - absoluted path
 * @returns - absoluted path which is in temp
 */
export const convertPathToInnerTempDirectory = (
  filePath: string,
  cwd: string,
) => {
  const relativePath = path.relative(cwd, path.resolve(cwd, filePath));
  const innerTempPath = path.join(path.join(cwd, TEMP_DIR), relativePath);
  return innerTempPath.replaceAll("\\", "/");
};
/**
 *
 * @param cwd - absoluted path
 * @returns - absoluted path which is temp dir.
 */
export const getTempDirectory = (cwd: string) => {
  const innerTempPath = path.join(cwd, TEMP_DIR);
  return innerTempPath.replaceAll("\\", "/");
};

export const copyFileToTempDirectory = (
  file: string,
  fs: FullFsClient,
  cwd: string,
): string => {
  const innetTempPath = convertPathToInnerTempDirectory(file, cwd);
  fs.mkdirSync(path.dirname(innetTempPath), { recursive: true });
  fs.copyFileSync(file, innetTempPath);
  return innetTempPath;
};
