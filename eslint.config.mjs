import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // CLI & Automation Scripts configuration
  {
    files: ["scripts/**/*.{js,mjs,ts}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Archived historical phase snapshots and artifacts (isolated from active src)
    "phase-1/**",
    "phase-2/**",
    "phase-3/**",
    "phase-4/**",
    "backups/**",
    "scratch/**",
    "reports/**",
    "src/generated/**",
  ]),
]);

export default eslintConfig;
