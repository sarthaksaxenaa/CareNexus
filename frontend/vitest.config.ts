import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests cover pure logic only (no DOM, no WebGL), so the default node
// environment is enough and keeps the suite fast and dependency-free.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: { include: ["src/**/*.test.ts"] },
});
