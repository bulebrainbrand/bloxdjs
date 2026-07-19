import { build } from "esbuild";
import { GLOBALTHIS_MODULE_INTERNAL_PROPERTY_NAME } from "./constants";

export const pack = async (
  entryCodeBlock: Map<string, string>,
  entryWorldcode: string,
  minify: boolean,
  tsconfigPath?: string,
) => {
  const buildOptions: Parameters<typeof build>[0] = {
    entryPoints: [entryWorldcode],
    bundle: true,
    format: "iife",
    platform: "neutral",
    outfile: "dist/worldcode.js",
    minify,
    tsconfig: tsconfigPath,
    banner: {
      js: `globalThis.${GLOBALTHIS_MODULE_INTERNAL_PROPERTY_NAME} = {}`,
    },
  };
  await build(buildOptions);
  for (const [entryPath, name] of entryCodeBlock) {
    const options: Parameters<typeof build>[0] = {
      entryPoints: [entryPath],
      bundle: true,
      format: "iife",
      platform: "neutral",
      outfile: `dist/codeblock/${name}.js`,
      minify,
    };
    await build(options);
  }
};
