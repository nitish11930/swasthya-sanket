import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    include: ["tests/unit/**/*.test.ts", "tests/security/**/*.test.ts", "src/**/*.test.ts"],
    coverage: {
      reporter: ["text", "lcov"],
      include: ["src/domain/**", "src/lib/validations/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
