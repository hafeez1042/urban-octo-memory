import { config as reactInternalConfig } from "@repo/eslint-config/react-internal";

export default [
  ...reactInternalConfig,
  {
    ignores: ["dist/**", "coverage/**"],
  },
  {
    files: ["src/components/**/*.{ts,tsx}", "src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "axios",
              message: "Components and features must use a query or mutation hook.",
            },
          ],
          patterns: [
            {
              group: ["**/services/**"],
              message: "Components and features must use a query or mutation hook.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/queries/**/*.{ts,tsx}", "src/mutations/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "axios",
              message: "Query and mutation hooks must call a service module.",
            },
          ],
        },
      ],
    },
  },
];
