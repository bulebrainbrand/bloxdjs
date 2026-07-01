import { loadConfig } from "unconfig";
import * as v from "valibot";
const schema = v.optional(
  v.object({
    includes: v.optional(v.array(v.string()), ["./src/**/*.ts"]),
    excludes: v.optional(v.array(v.string()), []),
    worldcode: v.optional(
      v.object({
        entry: v.string(),
      }),
      { entry: "src/index.ts" },
    ),
    codeblock: v.optional(v.object({}), {}),
    minify: v.optional(v.object({ enable: v.boolean() }), { enable: true }),
  }),
  {},
);

type UserConfig = v.InferInput<typeof schema>;
export type StrictConfig = v.InferOutput<typeof schema>;
/**
 *
 * @param { UserConfig } input - config for build
 * @returns { UserConfig }
 */
export const defineConfig = (input: UserConfig): UserConfig => {
  return input;
};

export const readBuildConfig = async (): Promise<StrictConfig> => {
  const { config } = await loadConfig.async({
    sources: [
      {
        files: "bloxdjs.config",
        extensions: ["ts", "mts", "cts", "js", "mjs", "cjs", "json", ""],
      },
    ],
    // if false, the only the first matched will be loaded
    // if true, all matched will be loaded and deep merged
    merge: false,
  });
  const result = v.safeParse(schema, config);
  if (result.success) {
    return result.output;
  }
  throw new TypeError(JSON.stringify(result.issues));
};
