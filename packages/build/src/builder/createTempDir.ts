import path from "node:path";
import type { FullFsClient } from "../types/fs";
import { zip } from "../utils/zip";
import { TEMP_DIR } from "./constants";

export const createTempDir = (
  filePaths: string[],
  cwd: string,
  fs: FullFsClient,
) => {
  const tempPaths = filePaths.map((path) => convertPathToTemp(path, cwd));
  for (const [filePath, tempPath] of zip(filePaths, tempPaths)) {
    const parentDirs = path.dirname(tempPath);
    fs.mkdirSync(parentDirs, { recursive: true });
    fs.copyFileSync(filePath, tempPath);
  }

  return tempPaths;
};

export const convertPathToTemp = (filePath: string, cwd: string) => {
  const relativePath = path.relative(cwd, path.resolve(cwd, filePath));
  const innerTempPath = path.join(path.join(cwd, TEMP_DIR), relativePath);
  return innerTempPath.replaceAll("\\", "/");
};

export const getTempDir = (cwd: string) => {
  const innerTempPath = path.join(cwd, TEMP_DIR);
  return innerTempPath.replaceAll("\\", "/");
};
