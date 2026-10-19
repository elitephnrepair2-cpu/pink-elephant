import path from 'path';
import fs from 'node:fs';
import { parseEnv } from 'node:util';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss(), {
        name: 'local-intake-api',
        configureServer(server) {
          server.middlewares.use('/api/intake', async (req, res) => {
            // Loaded only by the dev server; server secrets never enter the browser.
            // Do not mutate process.env: loadEnv gives existing process values
            // precedence, which can resurrect an old key after a config reload.
            const localFile = path.resolve(__dirname, '.env.local');
            const current = fs.existsSync(localFile) ? parseEnv(fs.readFileSync(localFile, 'utf8')) : {};
            const { createIntakeHandler } = await import('./server/intakeHandler');
            const handler = createIntakeHandler({ env: { ...env, ...current } });
            await handler(req, res);
          });
        }
      }],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

