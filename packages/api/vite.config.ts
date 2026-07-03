import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: { ignorePatterns: ["./src/**/*.ts"] },
  lint: { ignorePatterns: ["./src/**/*.ts"] },
});
