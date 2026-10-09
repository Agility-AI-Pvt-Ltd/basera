import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: {
      // monorepo root so @basera/assets image files resolve
      allow: [rootDir],
    },
  },
});
