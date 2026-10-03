import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,
  {
    ignores: ["dist/**", "**/*.d.ts"]
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      globals: {
        clearInterval: "readonly",
        clearTimeout: "readonly",
        console: "readonly",
        document: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        File: "readonly",
        FileReader: "readonly",
        HTMLButtonElement: "readonly",
        HTMLDivElement: "readonly",
        HTMLFormElement: "readonly",
        HTMLInputElement: "readonly",
        HTMLTextAreaElement: "readonly",
        HTMLLinkElement: "readonly",
        HTMLImageElement: "readonly",
        HTMLElement: "readonly",
        Blob: "readonly",
        React: "readonly",
        HTMLSelectElement: "readonly",
        HTMLCanvasElement: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        navigator: "readonly",
        KeyboardEvent: "readonly",
        MouseEvent: "readonly",
        Event: "readonly",
        CustomEvent: "readonly",
        URL: "readonly",
        setInterval: "readonly",
        setTimeout: "readonly",
        URLSearchParams: "readonly",
        window: "readonly",
        alert: "readonly"
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],
      "@typescript-eslint/no-explicit-any": "off"
    }
  },
  {
    files: ["vite.config.js"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        process: "readonly"
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    }
  }
];
