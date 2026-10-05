/**
 * Vercel serverless adapter for the compiled Express application.
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Enforce Vercel serverless flag to prevent accidental port listening or Vite boot
process.env.VERCEL = '1';
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let appPromise: Promise<any> | null = null;

async function loadApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const candidates = [
        path.join(process.cwd(), 'dist', 'server.cjs'),
        path.resolve(__dirname, '../dist/server.cjs'),
        '../dist/server.cjs',
      ];

      let lastError: any = null;
      for (const candidate of candidates) {
        try {
          const fileUrl = candidate.startsWith('.') ? candidate : pathToFileURL(candidate).href;
          // @ts-ignore
          const mod = await import(fileUrl);
          const app = mod?.app ?? mod?.default?.app ?? mod?.default;
          if (typeof app === 'function') {
            return app;
          }
        } catch (err) {
          lastError = err;
        }
      }

      throw lastError || new Error('Vercel server bundle loaded, but no Express app export was found.');
    })().catch((error) => {
      appPromise = null;
      throw error;
    });
  }
  return appPromise;
}

export default async function handler(req: any, res: any) {
  const requestId = req.headers?.['x-vercel-id'] || req.headers?.['x-request-id'] || `v-${Date.now()}`;

  // Preserve and restore original API URL if rewritten by Vercel rewrites
  const currentUrl = typeof req.url === 'string' ? req.url : '';
  const matchedPath = req.headers?.['x-matched-path'] || req.headers?.['x-forwarded-uri'];

  if (typeof matchedPath === 'string' && matchedPath.startsWith('/api') && !matchedPath.includes('index.ts') && !matchedPath.includes('index.js')) {
    req.url = matchedPath;
  } else if (req.query?.path) {
    const cleanPath = Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path);
    const searchIdx = currentUrl.indexOf('?');
    const rawSearch = searchIdx !== -1 ? currentUrl.slice(searchIdx) : '';
    req.url = `/api/${cleanPath.replace(/^\/+/, '')}${rawSearch}`;
  } else if (req.query?.['0']) {
    const cleanPath = Array.isArray(req.query['0']) ? req.query['0'].join('/') : String(req.query['0']);
    req.url = `/api/${cleanPath.replace(/^\/+/, '')}`;
  }

  // Parse body if Vercel serverless provided it as a raw string
  if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
    try {
      req.body = JSON.parse(req.body);
    } catch {}
  }

  try {
    const app = await loadApp();
    return app(req, res);
  } catch (error: any) {
    const message = String(error?.message || error || 'Unknown server bootstrap error');
    const stack = String(error?.stack || '');
    console.error('[ADEM Vercel adapter] Failed to load Express application', {
      requestId,
      name: error?.name,
      code: error?.code,
      message,
      stack,
    });

    if (!res.headersSent) {
      return res.status(500).json({
        ok: false,
        code: 'SERVER_BOOT_ERROR',
        message: 'ADEM AI server failed to initialize on Vercel.',
        details: message,
        requestId,
      });
    }

    try {
      return res.end();
    } catch {
      return undefined;
    }
  }
}
