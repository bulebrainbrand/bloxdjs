import { glob } from "glob";
import type { ReadonlyDirFsClient } from "../types/fs";

export const getIncludesFiles = async (
  includes: string[],
  excludes: string[],
  fs: ReadonlyDirFsClient,
): Promise<string[]> => {
  return glob(includes, { ignore: excludes, fs });
};
