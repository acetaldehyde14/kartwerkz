import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
    // Playwright owns e2e/** (see playwright.config.ts) — without this,
    // vitest's default include glob also matches *.spec.ts there and tries
    // to run Playwright's test.describe() outside a Playwright runner.
    exclude: ['**/node_modules/**', 'e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
