import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
      // docs/process.md: core modules must keep >= 80% coverage.
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
