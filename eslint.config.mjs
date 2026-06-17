import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  eslintConfigPrettier,
  // ─── Project-wide overrides ────────────────────────────────────────────────
  {
    rules: {
      // react-hooks v5 enforces React Compiler-compatible patterns (sync setState
      // in effects, static component definitions). These are known pre-existing
      // patterns that don't affect runtime correctness; flagged as warn to remain
      // visible without blocking CI.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
    },
  },
  // ─── Type declaration files ────────────────────────────────────────────────
  {
    files: ['src/types/**/*.ts', 'src/types/**/*.d.ts'],
    rules: {
      // Prisma's GetPayload generics intentionally use {} to mean "default
      // selection". The empty-object-type rule doesn't apply here.
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
]);

export default eslintConfig;
