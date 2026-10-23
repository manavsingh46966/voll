import js from "@eslint/js";
import expoConfig from "eslint-config-expo/flat.js";
import prettierConfig from "eslint-config-prettier";
import jsdocPlugin from "eslint-plugin-jsdoc";
import prettierPlugin from "eslint-plugin-prettier";
import reactPlugin from "eslint-plugin-react";
import reactNativePlugin from "eslint-plugin-react-native";
import reactNativeA11yPlugin from "eslint-plugin-react-native-a11y";
import simpleImportSortPlugin from "eslint-plugin-simple-import-sort";
import tailwindPlugin from "eslint-plugin-tailwindcss";
import unusedImportsPlugin from "eslint-plugin-unused-imports";
import { configs as tseslintConfigs } from "typescript-eslint";

export default [
  // 1. Base Configurations
  js.configs.recommended,
  ...tseslintConfigs.strict,
  ...tseslintConfigs.stylistic,
  ...expoConfig,
  prettierConfig,

  // 2. Plugins Setup
  {
    plugins: {
      react: reactPlugin,
      "react-native": reactNativePlugin,
      "react-native-a11y": reactNativeA11yPlugin,
      "unused-imports": unusedImportsPlugin,
      "simple-import-sort": simpleImportSortPlugin,
      tailwindcss: tailwindPlugin,
      jsdoc: jsdocPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      react: { version: "detect" },
      // NativeWind / Tailwind Configuration
      tailwindcss: {
        callees: ["className", "tw", "styled"],
        config: "tailwind.config.js",
      },
    },
    rules: {
      // ----------------------------------------------------------------------
      // A. STRICTNESS & SAFETY
      // ----------------------------------------------------------------------
      "no-console": ["warn", { allow: ["warn", "error"] }], // Production logs are banned
      "@typescript-eslint/no-explicit-any": "error", // The "Big Tech" Non-Negotiable
      "@typescript-eslint/no-unused-vars": "off", // Use the plugin below instead

      "react-hooks/exhaustive-deps": "error",

      // ----------------------------------------------------------------------
      // B. PERFORMANCE & STANDARDS (React Native)
      // ----------------------------------------------------------------------
      "react-native/no-inline-styles": "warn", // "Big Tech" apps use Design Systems, not inline styles
      "react-native/no-unused-styles": "error",
      "react-native/no-color-literals": "off", // We use NativeWind, so this is fine

      // Accessibility (A11y) - Mandatory for Big Tech (Legal Requirement)
      ...reactNativeA11yPlugin.configs.all.rules,

      // ----------------------------------------------------------------------
      // C. CLEAN CODE & AUTOMATION
      // ----------------------------------------------------------------------
      // 1. Max Lines per File (Forces Component Splitting)
      "max-lines": [
        "error",
        { max: 200, skipBlankLines: true, skipComments: true },
      ],

      // 2. Import Sorting (React -> External -> Internal)
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // Side effect imports.
            ["^\\u0000"],
            // React comes first.
            ["^react", "^react-native", "^expo"],
            // External packages.
            ["^@?\\w"],
            // Internal packages.
            ["^@/"],
            // Parent imports. Put `..` last.
            ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
            // Other relative imports. Put same-folder imports and `.` last.
            ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
            // Style imports.
            ["^.+\\.s?css$"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",

      // 3. Unused Import Auto-Cleanup
      "unused-imports/no-unused-imports": "error",

      // 4. Prettier Enforcement
      "prettier/prettier": "error",

      // ----------------------------------------------------------------------
      // D. DOCUMENTATION (TSDoc)
      // ----------------------------------------------------------------------
      // Only require JSDoc for EXPORTED functions (Public API)
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: true,
            FunctionExpression: true,
          },
        },
      ],
      "jsdoc/require-description": "error",
      "jsdoc/require-param": "error",
      "jsdoc/require-returns": "error",

      // ----------------------------------------------------------------------
      // E. TAILWIND STRICTNESS
      // ----------------------------------------------------------------------
      "tailwindcss/classnames-order": "warn", // Enforces "layout -> spacing -> color" order
      "tailwindcss/no-custom-classname": "error", // Typos in class names are errors
    },
  },
  // 3. IGNORES (Files that don't need strict rules)
  {
    ignores: [
      "node_modules/",
      "babel.config.js",
      "metro.config.js",
      "tailwind.config.js",
      "**/*.d.ts",
      "**/*.config.js",
    ],
  },
];
