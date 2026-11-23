import swc from "unplugin-swc";
import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    root: "./",
    exclude: ["**/*.e2e-spec.ts", "**/*.e2e.spec.ts", "node_modules"],
    coverage: {
      exclude: [
        ...coverageConfigDefaults.exclude,
        "src/domain/**/repositories/**",
        "src/domain/**/cryptography/**",
        "test/**",
      ],
    },
  },
  plugins: [
    swc.vite({
      module: { type: "es6" },
    }),
  ],
});
