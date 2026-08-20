import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    // Mirror the tsconfig path alias `@/*` -> project root.
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
});
