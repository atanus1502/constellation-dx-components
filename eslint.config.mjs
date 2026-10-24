import { globalIgnores } from 'eslint/config';
import { fileURLToPath } from 'node:url';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
// eslint.config.js
import { defineConfig } from 'eslint/config';

const __filename = fileURLToPath(import.meta.url);

export default defineConfig([
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  globalIgnores([
    '**/node_modules',
    'packages/*/lib',
    '!**/.storybook',
    '.storybook/public',
    '**/demo.stories.jsx',
    '**/mock.stories.js',
    '**/demo.stories.tsx',
    '**/demo.test.tsx',
    '**/*.test.tsx',
    '**/mock.stories.ts',
    '**/*.mdx',
    '**/webpack.config.js',
    'src/helpers/config_access.js',
    '**/*.html',
    '**/*.css',
    '**/*.json',
    '**/*.md',
    '**/*.svg',
    '**/*.zip',
    '**/*.d.ts',
    '*.storybook/*',
    '**/*.cjs',
    '**/*.mjs',
    '**/paths.js',
    'dist/*',
    'lib/*',
    'constellation-ui-gallery/**',
    'Claude_*/**',
    'storybook-static/**',
    'store/**'
  ]),
  {
    languageOptions: {
      globals: {
        PCore: 'readonly',
        window: true,
        console: true,
        document: true,
        fetch: true
      },

      ecmaVersion: 13,
      sourceType: 'script',

      parserOptions: {
        project: 'tsconfig.json',
        ecmaFeatures: {
          jsx: true
        }
      }
    },

    settings: {
      'import/resolver': {
        typescript: {},
        react: {
          version: 'detect'
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx']
        }
      },

      react: {
        version: 'detect'
      }
    },

    plugins: { sonarjs, import: importPlugin, react, 'react-hooks': reactHooks },
    rules: {
      'prettier/prettier': 'off',
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/no-identical-functions': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-nested-template-literals': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      'import/extensions': ['off', 'never'],
      'import/named': 'off',
      'import/no-cycle': 'off',
      'import/no-duplicates': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-self-import': 'off',
      'import/no-unresolved': 'off',
      'import/no-useless-path-segments': 'off',
      'import/order': 'off',
      'no-else-return': 'off',
      'no-restricted-syntax': 'off',
      'no-underscore-dangle': 'off',
      'jsx-a11y/alt-text': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'react/jsx-fragments': 'off',
      'react/jsx-no-bind': 'off',
      'react/self-closing-comp': 'off',
      'sonarjs/prefer-immediate-return': 'off',
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/ban-types': 'off',
      eqeqeq: 'off',
      'no-alert': 'off',
      'no-console': 'error',
      'no-fallthrough': 'error',
      'no-unused-vars': 'off',
      'no-var': 'off',
      yoda: 'error',
      'no-irregular-whitespace': 'off',
      'no-empty': 'off',
      'no-new-object': 'off',
      'import/no-relative-packages': 'off',
      'import/no-mutable-exports': 'error',
      'sonarjs/max-switch-cases': 'error',
      'sonarjs/no-collapsible-if': 'error',
      'sonarjs/no-all-duplicated-branches': 'error',
      'sonarjs/no-duplicated-branches': 'error',
      'sonarjs/no-gratuitous-expressions': 'off',
      'sonarjs/no-ignored-return': 'error',
      'sonarjs/no-small-switch': 'error',
      'sonarjs/prefer-object-literal': 'error',
      'sonarjs/prefer-single-boolean-return': 'error',
      '@typescript-eslint/no-shadow': 'error',
      'react/default-props-match-prop-types': 'error',
      'react/no-unescaped-entities': 'error',
      'react/no-unused-prop-types': 'error',
      'react/static-property-placement': 'error',
      'array-callback-return': 'error',
      'func-names': 'error',
      'no-case-declarations': 'error',
      'no-lonely-if': 'error',
      'no-nested-ternary': 'error',
      'no-plusplus': 'error',
      'no-restricted-globals': 'error',
      'no-restricted-properties': 'error',
      'no-shadow': 'error',
      radix: 'error',
      'spaced-comment': 'error',
      'import/newline-after-import': 'error',
      'sonarjs/no-nested-switch': 'error',
      '@typescript-eslint/no-array-constructor': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-useless-constructor': 'error',
      'react/button-has-type': 'error',
      'react/jsx-curly-brace-presence': 'error',
      'react/jsx-boolean-value': 'error',
      'react/no-array-index-key': 'error',
      'class-methods-use-this': 'error',
      'guard-for-in': 'error',
      'no-unneeded-ternary': 'error',
      'no-unused-expressions': 'error',
      'operator-assignment': 'error',
      'prefer-template': 'error',
      'vars-on-top': 'error',
      'prefer-regex-literals': 'off',
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': 'error'
    }
  },
  {
    files: ['**/*.@(ts|tsx)'],

    rules: {
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      quotes: 'off',
      '@typescript-eslint/quotes': 'off'
    }
  },
  {
    files: ['**/*.@(jsx|tsx|mdx)'],

    rules: {
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off'
    }
  },
  {
    files: ['**/*.@(ts|tsx)'],
    rules: {
      'no-console': 'off',
      'import/prefer-default-export': 'off',
      'import/no-relative-packages': 'off',
      'react/jsx-fragments': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'sonarjs/cognitive-complexity': ['warn', 45]
    }
  },
  {
    files: ['**/*.@(js|jsx|ts|tsx|mdx)'],
    rules: {}
  },

  {
    files: ['*/**/mocks/**.@(mocks|styles).@(tsx|ts)'],

    rules: {
      'import/prefer-default-export': ['off']
    }
  }
]);
