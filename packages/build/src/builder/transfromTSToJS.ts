import { transform } from "@swc/core";
import type { FullFsClient } from "../types/fs";

export const transfromTS = async (
  tscode: string,
  tsconfig: { baseUrl?: string; paths?: Record<string, string[]> },
  filePath: string,
): Promise<{ code: string; messages: string[] }> => {
  const result = await transform(tscode, {
    minify: false,
    filename: filePath,
    jsc: {
      parser: {
        syntax: "typescript",
        tsx: filePath.endsWith(".tsx"),
      },
      target: "es2020",
      baseUrl: tsconfig.baseUrl,
      paths: tsconfig.paths,
    },
    module: {
      type: "es6",
    },
  });

  return { code: result.code, messages: result.extractedComments ?? [] };
};

export const transfromTSFiles = async (
  files: string[],
  fs: FullFsClient,
  tsconfig: { baseUrl?: string; paths?: Record<string, string[]> },
): Promise<
  {
    path: string;
    messages: string[];
  }[]
> => {
  return await Promise.all(
    files.map(async (filePath) => {
      const content = (await fs.promises.readFile(filePath)).toString();
      const transfromed = await transfromTS(content, tsconfig, filePath);
      await fs.promises.writeFile(filePath, transfromed.code);
      return { path: filePath, messages: transfromed.messages };
    }),
  );
};
