import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*'],
    // packages/om-data-mapper/tests/memory-leak.test.ts compares heapUsed
    // before and after an operation, which only measures retention if a
    // collection actually happens in between — so the workers need a callable
    // global.gc(). `pool`/`poolOptions` are root-only in Vitest; setting them
    // in the project config has no effect. Without this the memory suite still
    // passes, while measuring nothing.
    pool: 'forks',
    poolOptions: { forks: { execArgv: ['--expose-gc'] } },
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'lcov', 'json', 'json-summary', 'html'],
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/*.d.ts', '**/types.ts', '**/interfaces.ts', 'packages/om-data-mapper/src/**'],
      all: true,
      thresholds: { lines: 70, functions: 80, branches: 70, statements: 70 },
    },
  },
});
