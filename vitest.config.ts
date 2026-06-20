import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    // src/** = app/pure TS logic; eval/** = the standalone proof-harness (.mjs ports, see eval/README.md).
    // supabase/functions/_shared/** = PURE edge-fn helpers (no Deno-only imports) — Deno isn't covered by
    // tsc/vitest, so the pure de-id logic is unit-tested here to lock its offset-preserving contract.
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'eval/**/*.{test,spec}.{mjs,ts}',
      'supabase/functions/_shared/**/*.{test,spec}.ts',
    ],
  },
});
