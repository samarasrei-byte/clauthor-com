import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // WCAG AA — block low-opacity text tokens. See docs/dashboard-typography.md.
      // Forbidden: text-{white,foreground,muted-foreground}/(30|40|50) and placeholder:text-*/(20|30|40).
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value=/\\btext-(white|foreground|muted-foreground)\\/(30|40|50)\\b/]",
          message:
            "Contraste insuficiente (WCAG AA). Use opacidade ≥/60 para texto — ver docs/dashboard-typography.md.",
        },
        {
          selector: "TemplateElement[value.raw=/\\btext-(white|foreground|muted-foreground)\\/(30|40|50)\\b/]",
          message:
            "Contraste insuficiente (WCAG AA). Use opacidade ≥/60 para texto — ver docs/dashboard-typography.md.",
        },
        {
          selector: "Literal[value=/placeholder:text-[a-z-]+\\/(20|30|40)\\b/]",
          message:
            "Placeholder com contraste insuficiente. Use placeholder:text-muted-foreground/60 no mínimo.",
        },
      ],
    },
  },
);
