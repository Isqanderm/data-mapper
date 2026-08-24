import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'lcov', 'json', 'json-summary', 'html'],
      include: ['packages/*/src/**/*.ts'],
      exclude: [
        '**/*.d.ts',
        '**/types.ts',
        '**/interfaces.ts',
        'packages/om-data-mapper/src/**',
      ],
      all: true,
      thresholds: { lines: 70, functions: 80, branches: 70, statements: 70 },
    },
  },
});
