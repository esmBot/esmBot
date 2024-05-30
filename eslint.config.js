import babelParser from "@babel/eslint-parser";
import eslintPluginJS from "@eslint/js";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import globals from "globals";

export default [
  eslintPluginJS.configs.recommended,
  eslintPluginUnicorn.configs["flat/recommended"],
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: babelParser,
      globals: {
        ...globals.node,
      },
      parserOptions: {
        "sourceType": "module",
        "ecmaVersion": 12,
        requireConfigFile: false,
        babelOptions: {
          "plugins": [
            "@babel/plugin-transform-class-properties",
            "@babel/plugin-syntax-import-attributes",
          ]
        },
      },
    },
    "rules": {
      "no-console": "off",
      "indent": [
        "error",
        2,
        {
          "SwitchCase": 1
        }
      ],
      "linebreak-style": [
        "error",
        "unix"
      ],
      //"unicorn/prefer-module": "error",
      "quotes": [
        "warn",
        "double"
      ],
      "semi": [
        "warn",
        "always"
      ],
      "keyword-spacing": [
        "error", {
          "before": true,
          "after": true
        }
      ],
      "space-before-blocks": [
        "error", {
          "functions": "always",
          "keywords": "always",
          "classes": "always"
        }
      ],
      "space-before-function-paren": [
        "error", {
          "anonymous": "never",
          "named": "never",
          "asyncArrow": "always"
        }
      ],
      "prefer-const": [
        "error", {
          "destructuring": "any",
          "ignoreReadBeforeAssign": false
        }
      ],
      "prefer-template": "error",
      "no-unneeded-ternary": "error",
      "no-useless-return": "error",
      "no-process-exit": "off",

      "unicorn/prevent-abbreviations": "off",
      "unicorn/no-null": "off",
      "unicorn/process-exit": "off",
      "unicorn/catch-error-name": "off",
      "unicorn/prefer-ternary": "off",
      "unicorn/numeric-separators-style": "off",
      "unicorn/no-negated-condition": "off",
      "unicorn/no-process-exit": "off",
      "unicorn/no-hex-escape": "off",
      "unicorn/escape-case": "off",
      "unicorn/import-style": "off",
      "unicorn/no-anonymous-default-export": "off",
      "unicorn/no-nested-ternary": "off",
      "unicorn/no-array-reduce": "off",
      "unicorn/no-await-expression-member": "off",
      "unicorn/prefer-top-level-await": "off",
      "unicorn/prefer-event-target": "off",


      "unicorn/no-useless-undefined": [
        "error",
        {
          checkArrowFunctionBody: false,
        },
      ],
      "unicorn/filename-case": [
        "error",
        {
          "cases": {
            "camelCase": true,
            "kebabCase": true,
          }
        }
      ]
    }
  }
];
