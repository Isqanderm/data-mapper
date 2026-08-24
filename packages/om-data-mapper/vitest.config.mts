import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const p = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@om-data-mapper/core': p('../core/src'),
      '@om-data-mapper/class-transformer': p('../class-transformer/src'),
      '@om-data-mapper/class-validator': p('../class-validator/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
