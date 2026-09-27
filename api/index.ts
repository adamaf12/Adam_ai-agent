/**
 * Vercel serverless adapter for the compiled Express application.
 *
 * IMPORTANT: Do not import ../server directly here. Vercel compiles this
 * TypeScript entrypoint independently, while Node's ESM resolver does not
 * support extensionless directory imports. The production build already
 * creates dist/server.cjs, so load that compiled bundle instead.
 */
let appPromise: Promise<any> | null = null;

async function loadApp() {
  if (!appPromise) {
    // @ts-ignore - dist/server.cjs is generated during the Vercel build and included by vercel.json.
    appPromise = import('../dist/server.cjs')
      .then((module) => {
        const app = (module as any).app ?? (module as any).default?.app ?? (module as any).default;
        if (typeof app !== 'function') {
          throw new Error('Vercel server bundle loaded, but no Express app export was found.');
        }
        return app;
      })
      .catch((error) => {
        appPromise = null;
        throw error;
      });
  }
  return appPromise;
}

export default async function handler(req: any, res: any) {
  const requestId = req.headers?.['x-vercel-id'] || req.headers?.['x-request-id'] || 'unknown';

  try {
    const app = await loadApp();
    return app(req, res);
  } catch (error: any) {
    const message = String(error?.message || error || 'Unknown server bootstrap error');
    const stack = String(error?.stack || '');
    console.error('[Adam Vercel adapter] Failed to load Express application', {
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
        message: 'Adam AI server failed to initialize.',
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
