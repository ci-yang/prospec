// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Global ignores
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', '*.config.*'],
  },

  // Layer constraint: cli/ cannot import from lib/
  {
    files: ['src/cli/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../lib/*', '../../lib/*', '../lib', '../../lib'],
              message:
                'CLI layer cannot import from lib/ directly. Use services/ layer instead.',
            },
          ],
        },
      ],
    },
  },

  // Layer constraint: services/ cannot import from cli/
  {
    files: ['src/services/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../cli/*', '../../cli/*', '../cli', '../../cli'],
              message:
                'Services layer cannot import from cli/. Services must remain CLI-framework agnostic.',
            },
          ],
        },
      ],
    },
  },

  // Layer constraint: lib/ cannot import from services/ or cli/
  {
    files: ['src/lib/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '../services/*',
                '../../services/*',
                '../services',
                '../../services',
                '../cli/*',
                '../../cli/*',
                '../cli',
                '../../cli',
              ],
              message:
                'Lib layer cannot import from services/ or cli/. Lib must contain stateless pure functions only.',
            },
          ],
        },
      ],
    },
  },

  // Layer constraint: types/ cannot import from any other layer
  {
    files: ['src/types/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '../cli/*',
                '../../cli/*',
                '../cli',
                '../../cli',
                '../services/*',
                '../../services/*',
                '../services',
                '../../services',
                '../lib/*',
                '../../lib/*',
                '../lib',
                '../../lib',
              ],
              message:
                'Types layer cannot import from any other layer. Types must have zero dependencies.',
            },
          ],
        },
      ],
    },
  },
);
