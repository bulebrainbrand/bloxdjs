import { defineConfig } from "@bloxdjs/build";
export default defineConfig({
    includes: ["src/**/*.ts"],
    excludes: [],
    worldcode: {
        entry: "./src/index.ts",
    },
    minify: {
        enable: true,
    },
});
