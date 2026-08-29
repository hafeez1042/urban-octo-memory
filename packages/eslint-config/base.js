import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
import onlyWarn from "eslint-plugin-only-warn";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
      "@typescript-eslint/no-empty-interface": "off",
      // `declare global { namespace Express { ... } }` is the standard TS pattern for
      // augmenting third-party ambient types (req.ctx, req.clientTimeZone, etc.) — there is no
      // ES module equivalent for it, so ambient `declare namespace` blocks are allowed.
      "@typescript-eslint/no-namespace": ["warn", { allowDeclarations: true }],
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ["dist/**"],
  },
];
