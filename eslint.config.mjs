// Flat ESLint config (ESLint v9+).
// Strict rules: errors only for things we want to block on; warnings kept to a minimum.
// Complexity guardrails are enforced here so that an agent (or a human) cannot land
// sprawling, deeply-nested, multi-hundred-line files into this repo.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'web/**', 'drizzle/**', '*.config.*', 'jest.config.ts'],
  },

  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // ---- Code-complexity guardrails (the headline rules) -------------------
      'max-lines': [
        'error',
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'error',
        { max: 50, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      complexity: ['error', { max: 10 }],
      'max-params': ['error', { max: 4 }],
      'max-depth': ['error', { max: 3 }],
      'max-nested-callbacks': ['error', { max: 3 }],
      'max-statements': ['error', { max: 20 }],

      // ---- Correctness / safety ---------------------------------------------
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-param-reassign': ['error', { props: true }],
      'no-implicit-coercion': 'error',
      'no-return-await': 'error',
      'no-throw-literal': 'error',
      'no-unused-expressions': 'error',
      'no-shadow': 'off', // handled by @typescript-eslint/no-shadow
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',

      // ---- Style consistency that affects readability -----------------------
      curly: ['error', 'all'],
      'no-else-return': ['error', { allowElseIf: false }],
      'prefer-template': 'error',
      'object-shorthand': ['error', 'always'],

      // ---- Things we tolerate (kept as warnings, very few) ------------------
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Allow a slightly looser config for tests (longer files, more statements).
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'tests/doubles/**'],
    rules: {
      'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': 'off',
      'max-statements': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  }
);
