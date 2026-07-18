import { defineConfig } from 'vitest/config';

const planetaryEnginePath = new URL(
  '../../packages/planetary-engine/src/index.ts',
  import.meta.url,
).pathname
  .replace(/^\/([A-Za-z]:)/, '$1')
  .replace(/%20/g, ' ');

export default defineConfig({
  resolve: {
    alias: {
      '@planetary-hours/planetary-engine': planetaryEnginePath,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
