import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["src/index.ts", "src/.bin/index.ts"],
    platform: "node",
    exports: {
      bin: {
        "@bloxdjs/build": "src/.bin/index.ts",
      },
    },
  },
});
