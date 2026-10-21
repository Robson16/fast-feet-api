import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    root: "./",
    exclude: ["**/*.e2e-spec.ts", "**/*.e2e.spec.ts", "node_modules"],
  },
  plugins: [
    swc.vite({
      module: { type: "es6" },
    }),
  ],
});
