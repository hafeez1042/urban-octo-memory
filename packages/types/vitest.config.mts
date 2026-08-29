import { defineConfig } from "vitest/config";

/**
 * `@repo/types` has no I/O — every `*.spec.ts` here is a pure unit test (schemas, enum tables).
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
    clearMocks: true,
  },
});
