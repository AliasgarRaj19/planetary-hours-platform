import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const planetaryEnginePath = new URL(
  '../../packages/planetary-engine/src/index.ts',
  import.meta.url,
).pathname
  .replace(/^\/([A-Za-z]:)/, '$1')
  .replace(/%20/g, ' ');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@planetary-hours/planetary-engine': planetaryEnginePath,
    },
  },
});
