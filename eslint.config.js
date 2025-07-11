import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import json from "@eslint/json";
import unusedImports from "eslint-plugin-unused-imports";
import { defineConfig } from "eslint/config";

const reactConfig = pluginReact.configs.flat.recommended;

// Nadpisujemy reguły Reacta, wyłączając react/react-in-jsx-scope
const reactRules = {
  ...reactConfig.rules,
  "react/react-in-jsx-scope": "off",
};

export default defineConfig([
  { 
    files: ["**/*.{js,mjs,cjs,jsx}"], 
    plugins: { js }, 
    extends: ["js/recommended"] 
  },
  { 
    files: ["**/*.{js,mjs,cjs,jsx}"], 
    languageOptions: { globals: globals.browser } 
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: {
      ...reactConfig.plugins,
      "unused-imports": unusedImports,
    },
    languageOptions: reactConfig.languageOptions,
    rules: {
      ...reactRules,
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
  { 
    files: ["**/*.json"], 
    plugins: { json }, 
    language: "json/json", 
    extends: ["json/recommended"] 
  },
  { 
    files: ["**/*.jsonc"], 
    plugins: { json }, 
    language: "json/jsonc", 
    extends: ["json/recommended"] 
  },
  { 
    files: ["**/*.json5"], 
    plugins: { json }, 
    language: "json/json5", 
    extends: ["json/recommended"] 
  },
]);
