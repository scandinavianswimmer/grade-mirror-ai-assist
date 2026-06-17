import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    // src/** = app/pure TS logic; eval/** = the standalone proof-harness (.mjs ports, see eval/README.md).
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'eval/**/*.{test,spec}.{mjs,ts}'],
  },
});
