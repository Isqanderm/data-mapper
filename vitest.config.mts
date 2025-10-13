import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'bench/**/*.bench.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', '**/*.bench.ts'],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 30,
        statements: 50,
      },
    },
    benchmark: {
      outputFile: {
        json: './bench-results.json',
      },
    },
  },
});

