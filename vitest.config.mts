import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  // 渲染測試用：tsconfig 的 jsx 是 preserve（交給 Next），測試時改用 React 自動 runtime
  esbuild: { jsx: "automatic" },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
