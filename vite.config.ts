import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import {
  executeHighThinkingAnalysis,
  executeSearchGrounding,
  executeImageGeneration,
  executeGeneralTask,
  executeFastTask,
} from './src/server/geminiService.ts';

dotenv.config();

function geminiApiPlugin(): Plugin {
  return {
    name: 'gemini-api-server-routes',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/gemini')) {
          return next();
        }

        // Parse JSON body
        let bodyRaw = '';
        req.on('data', (chunk) => {
          bodyRaw += chunk;
        });

        req.on('end', async () => {
          let body: Record<string, any> = {};
          try {
            if (bodyRaw) body = JSON.parse(bodyRaw);
          } catch {
            body = {};
          }

          res.setHeader('Content-Type', 'application/json; charset=utf-8');

          try {
            if (req.url === '/api/gemini/thinking' && req.method === 'POST') {
              const text = await executeHighThinkingAnalysis(body.prompt || '', body.csmSummary);
              res.statusCode = 200;
              res.end(JSON.stringify({ text, success: true }));
            } else if (req.url === '/api/gemini/search' && req.method === 'POST') {
              const result = await executeSearchGrounding(body.query || '');
              res.statusCode = 200;
              res.end(JSON.stringify({ ...result, success: true }));
            } else if (req.url === '/api/gemini/image' && req.method === 'POST') {
              const result = await executeImageGeneration(body.prompt || '', body.size || '1K', body.aspectRatio || '16:9');
              res.statusCode = 200;
              res.end(JSON.stringify({ ...result, success: true }));
            } else if (req.url === '/api/gemini/general' && req.method === 'POST') {
              const text = await executeGeneralTask(body.prompt || '');
              res.statusCode = 200;
              res.end(JSON.stringify({ text, success: true }));
            } else if (req.url === '/api/gemini/fast' && req.method === 'POST') {
              const text = await executeFastTask(body.prompt || '');
              res.statusCode = 200;
              res.end(JSON.stringify({ text, success: true }));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Endpoint not found' }));
            }
          } catch (err: any) {
            console.error('API Route Error:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({
              error: err.message || 'Internal Server Error',
              success: false,
            }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geminiApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
