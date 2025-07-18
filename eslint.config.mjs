import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Extend Next.js recommended rules
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Project-level overrides to prevent build failures on non-critical issues.
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // Temporarily disable unused-vars while we refactor components
      "@typescript-eslint/no-unused-vars": "off",
      // Disable exhaustive deps rule for now; we will revisit hooks later
      "react-hooks/exhaustive-deps": "off",
      // Allow native <img> elements until we migrate to next/image
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
