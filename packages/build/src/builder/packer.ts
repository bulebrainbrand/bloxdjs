import { build } from "esbuild";

export const pack = async (
  entryCodeBlock: Map<string, string>,
  entryWorldcode: string,
  minify: boolean,
) => {
  const buildOptions: Parameters<typeof build>[0] = {
    entryPoints: [entryWorldcode],
    bundle: true,
    format: "iife",
    platform: "neutral",
    outfile: "dist/worldcode.js",
    minify,
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
