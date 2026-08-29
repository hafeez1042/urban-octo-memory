import { backendConfig } from "@repo/eslint-config/backend";

/**
 * `@repo/backend` has never had a flat-config file (ESLint v9 requires one; the pre-existing
 * `packages/eslint-config/backend.js` config array was already flat-config-shaped and just
 * needed wiring in here — noticed while building P0-14's CI pipeline, which is the first task to
 * run `pnpm lint` across the whole workspace and fail on it).
 */
export default [
  ...backendConfig,
  // Build output (`tsconfig.json`'s `outDir`) — compiled JS, not source.
  { ignores: ["lib/**"] },
];
