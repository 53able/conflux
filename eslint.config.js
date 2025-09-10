import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript固有のルール
      '@typescript-eslint/no-unused-vars': ['error', { 
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'caughtErrorsIgnorePattern': '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'error', // any型の使用を禁止
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-var-requires': 'error',
      
      // 一般的なルール
      'no-console': 'off', // CLIアプリケーションなのでconsole.logを許可
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': 'off', // TypeScriptのルールを使用
      'no-case-declarations': 'off', // case文での変数宣言を許可
    },
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.js',
      '*.mjs',
    ],
  }
);
