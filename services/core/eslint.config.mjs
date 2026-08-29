import { backendConfig } from "@repo/eslint-config/backend";

export default [
  ...backendConfig,
  {
    ignores: ["migrations/**", "seeders/**", "src/config/sequelize-cli.cjs"],
  },
  {
    files: ["src/**/*.ts"],
    ignores: ["src/config/env.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name='sync'][callee.object.name='sequelize']",
          message: "Use a migration instead of sequelize.sync().",
        },
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message: "Read environment variables through src/config/env.ts.",
        },
      ],
    },
  },
  {
    files: ["src/controllers/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["**/models/**", "**/repositories/**", "sequelize", "sequelize/*"],
        },
      ],
    },
  },
  {
    files: ["src/services/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["**/models/**", "sequelize", "sequelize/*"],
        },
      ],
    },
  },
  {
    files: ["src/routes/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["**/models/**", "**/repositories/**", "**/services/**", "sequelize", "sequelize/*"],
        },
      ],
    },
  },
];
