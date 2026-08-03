import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        __BUILD_ID__: 'readonly',
        window: 'readonly',
        document: 'readonly',
        globalThis: 'readonly',
        console: 'readonly',
        HTMLElement: 'readonly',
        CSS: 'readonly',
        matchMedia: 'readonly',
      },
    },
    rules: {
      // Regras que atacam defeitos medidos na auditoria de 2026-08-02.

      // A3: 316 addEventListener contra 62 removeEventListener.
      'no-restricted-syntax': [
        'warn',
        {
          selector: "CallExpression[callee.property.name='setInterval']",
          message:
            'Prefira estado reativo do hass. Se o timer for inevitável, guarde o id e limpe no disconnectedCallback.',
        },
      ],

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
);
