import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {},
  lint: {
    ignorePatterns: ["dist/**", "node_modules/**"],
    categories: {
      correctness: "error",
    },
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    plugins: ["typescript"],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
      "typescript/adjacent-overload-signatures": "error",
      "typescript/array-type": ["error", { default: "array" }],

      "typescript/no-misused-promises": "error",
      "typescript/no-namespace": "error",
      "typescript/no-unnecessary-condition": [
        "error",
        { allowConstantLoopConditions: true },
      ],
      "typescript/no-unsafe-argument": "error",
      "typescript/no-unsafe-assignment": "error",
      "typescript/no-unsafe-call": "error",
      "typescript/no-unsafe-declaration-merging": "error",
      "typescript/no-unsafe-function-type": "error",
      "typescript/no-unsafe-member-access": "error",
      "typescript/no-unsafe-return": "error",
      "typescript/no-unsafe-type-assertion": "error",
      "typescript/only-throw-error": "error",
      "typescript/require-await": "error",
      "no-unused-vars": "warn",
    },
    options: { typeAware: true, typeCheck: true },
  },
  test: {
    include: ["packages/*/src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.git/**"],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.ts"],
      exclude: ["packages/*/src/**/*.test.ts"],
      reporter: ["text"],
    },
  },
  staged: {
    "*.{js,ts,tsx,vue}": "vp check --fix",
  },
  run: {
    cache: true,
  },
});
