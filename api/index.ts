/**
 * Vercel Serverless Function adapter for ADEM AI Express Application.
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Ensure Vercel serverless flag is set before any server components inspect it
process.env.VERCEL = '1';
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Static import guarantees Vercel's bundler (@vercel/node) traces and bundles all server dependencies
// into the serverless function deployment artifact.
// Load the self-contained server bundle generated during the build. This avoids
// Vercel's runtime tracer missing dependencies referenced by dist/server.cjs.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let appPromise: Promise<any> | null = null;

async function loadApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const candidates = [
        path.join(process.cwd(), 'dist', 'server.cjs'),
        path.resolve(__dirname, '../dist/server.cjs'),
      ];
      let lastError: any = null;
      for (const candidate of candidates) {
        try {
          const mod = await import(pathToFileURL(candidate).href);
          const app = mod?.app ?? mod?.default?.app ?? mod?.default;
          if (typeof app === 'function') return app;
          if (app && typeof app.handle === 'function') {
            return (req: any, res: any) => app.handle(req, res);
          }
          lastError = new Error(`Server bundle did not export an Express app (type=${typeof app}).`);
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError || new Error('Vercel serverless adapter: server bundle could not be loaded.');
    })().catch((error) => {
      appPromise = null;
      throw error;
    });
  }
  return appPromise;
}

export default async function handler(req: any, res: any) {
  const requestId = req.headers?.['x-vercel-id'] || req.headers?.['x-request-id'] || `v-${Date.now()}`;

  // Preserve and restore original API URL when routed by Vercel rewrites
  const currentUrl = typeof req.url === 'string' ? req.url : '';
  const forwardedUri = req.headers?.['x-forwarded-uri'] || req.headers?.['x-real-url'];
  const matchedPath = req.headers?.['x-matched-path'];

  if (typeof forwardedUri === 'string' && forwardedUri.startsWith('/api') && !forwardedUri.includes('index.ts') && !forwardedUri.includes('index.js')) {
    req.url = forwardedUri;
  } else if (typeof matchedPath === 'string' && matchedPath.startsWith('/api') && !matchedPath.includes('index.ts') && !matchedPath.includes('index.js')) {
    req.url = matchedPath;
  } else if (typeof req.query?.path !== 'undefined') {
    const rawPath = Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path);
    const cleanPath = rawPath.replace(/^\/+/, '');

    // Extract actual query parameters excluding the internal 'path' rewrite param
    let querySuffix = '';
    const qIndex = currentUrl.indexOf('?');
    if (qIndex !== -1) {
      try {
        const searchParams = new URLSearchParams(currentUrl.slice(qIndex + 1));
        searchParams.delete('path');
        const filtered = searchParams.toString();
        if (filtered) querySuffix = `?${filtered}`;
      } catch {}
    }
    req.url = `/api/${cleanPath}${querySuffix}`;
  } else if (typeof req.query?.['0'] !== 'undefined') {
    const rawPath = Array.isArray(req.query['0']) ? req.query['0'].join('/') : String(req.query['0']);
    req.url = `/api/${rawPath.replace(/^\/+/, '')}`;
  } else if (typeof req.url === 'string' && (req.url.startsWith('/api/index.ts') || req.url.startsWith('/api/index.js'))) {
    req.url = req.url.replace(/^\/api\/index\.(ts|js)/, '/api');
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
