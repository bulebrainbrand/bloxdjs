import { formatMessages, transform } from "esbuild";
import type { FullFsClient } from "../types/fs";

export const transfromTS = async (
  tscode: string,
): Promise<{ code: string; messages: string[] }> => {
  const result = await transform(tscode, {
    minify: false,
    platform: "neutral",
    loader: "ts",
  });

  return {
    code: result.code,
    messages: await formatMessages(result.warnings, { kind: "warning" }),
  };
};

export const transfromTSFiles = async (
  files: string[],
  fs: FullFsClient,
): Promise<
  {
    path: string;
    messages: string[];
  }[]
> => {
  return await Promise.all(
    files.map(async (filePath) => {
      try {
        const content = (await fs.promises.readFile(filePath)).toString();
        const transfromed = await transfromTS(content);
        await fs.promises.writeFile(filePath, transfromed.code);
        return { path: filePath, messages: transfromed.messages };
      } catch (error) {
        console.error(`failed convert ${filePath}`, error);
        throw new Error("failed convert to JS", { cause: error });
      }
    }),
  );
};
