import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['benchmarks/**/*.bench.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'lcov', 'json', 'json-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        '**/*.bench.ts',
        'src/**/*.d.ts',
        'src/**/types.ts',
        'src/**/interfaces.ts',
        'src/compat/class-transformer/**/*',  // class-transformer compat tested via integration tests
        // class-validator compat is now included for 100% coverage goal
      ],
      all: true,
      thresholds: {
        lines: 70,
        functions: 80,
        branches: 70,
        statements: 70,
      },
    },
    benchmark: {
      include: ['benchmarks/suites/**/*.bench.ts'],
      exclude: ['tests/**/*.test.ts'],
      outputFile: {
        json: './bench-results.json',
      },
    },
  },
});

