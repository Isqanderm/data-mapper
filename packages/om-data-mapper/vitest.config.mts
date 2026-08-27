import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const p = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@tech-pioneer/data-mapper-core': p('../core/src'),
      '@tech-pioneer/data-mapper-class-transformer': p('../class-transformer/src'),
      '@tech-pioneer/data-mapper-class-validator': p('../class-validator/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
