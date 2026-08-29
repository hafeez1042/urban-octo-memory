import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import { config as baseConfig } from "./base.js";

/**
 * Base ESLint config for Node.js/Express backend packages.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const backendConfig = [
  ...baseConfig,
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/**"],
  },
];
