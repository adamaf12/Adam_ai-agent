import path from 'node:path';
import type { Request, Response, NextFunction } from 'express';

/**
 * Validates and safely resolves paths preventing Directory / Path Traversal attacks (../)
 */
export function safePathResolve(baseDir: string, relativePath: string): string {
  // Reject null-byte injection
  if (relativePath.includes('\0')) {
    throw new Error('Security Alert: Null-byte detected in path');
  }

  // Normalize and resolve path
  const safeRelative = relativePath.replace(/^(\.\.(\/|\\|$))+/, '');
  const resolved = path.resolve(baseDir, safeRelative);

  // Enforce boundary containment
  const base = path.resolve(baseDir);
  const relative = path.relative(base, resolved);
  if (relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative)) {
    throw new Error('Security Alert: Path traversal attempt blocked');
  }

  return resolved;
}

/**
 * Validates allowed MIME types and file sizes
 */
export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'audio/mpeg',
  'audio/webm',
]);

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function validateFileSecurity(file: { mimetype?: string; size?: number; originalname?: string }): { valid: boolean; error?: string } {
  if (!file) return { valid: false, error: 'No file provided' };

  if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `File exceeds maximum allowed size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB` };
  }

  if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
    return { valid: false, error: `Disallowed file type: ${file.mimetype}` };
  }

  if (file.originalname) {
    // Check filename for path traversal or executable extensions
    const dangerousExts = ['.exe', '.bat', '.cmd', '.sh', '.php', '.phtml', '.vbs', '.scr'];
    const lowerName = file.originalname.toLowerCase();
    if (dangerousExts.some(ext => lowerName.endsWith(ext)) || lowerName.includes('..') || lowerName.includes('/')) {
      return { valid: false, error: 'Dangerous or malformed filename detected' };
    }
  }

  return { valid: true };
}

/**
 * Production Security Headers Middleware (Helmet grade)
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=*, microphone=*, display-capture=*, geolocation=*, payment=*, usb=()');

  // HSTS in production or HTTPS
  let isHttps = false;
  try {
    isHttps = req.header?.('x-forwarded-proto') === 'https' || req.headers?.['x-forwarded-proto'] === 'https' || Boolean(req.secure);
  } catch {
    isHttps = Boolean(req.headers?.['x-forwarded-proto'] === 'https');
  }
  if (isHttps || process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Content-Security-Policy
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://image.pollinations.ai https://pollinations.ai https://lh3.googleusercontent.com https://*.googleusercontent.com https://picsum.photos https://images.unsplash.com https://i.pinimg.com",
      "media-src 'self' data: blob: https://pollinations.ai https://image.pollinations.ai",
      "connect-src 'self' http: https: ws: wss: capacitor: ionic: data: blob:",
      "frame-src 'self' https://accounts.google.com https://apis.google.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ')
  );

  next();
}

const TRUSTED_ORIGIN_PATTERNS: Array<string | RegExp> = [
  'https://adam-ai-agent.vercel.app',
  /^https:\/\/[a-z0-9-]+-263913895850\.[a-z0-9-]+\.run\.app$/,
  /^https:\/\/[a-z0-9-]+-ademfeidat\.vercel\.app$/,
  /^https:\/\/[a-z0-9-]+-adam-ai-agent\.vercel\.app$/,
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

if (process.env.ALLOWED_ORIGINS) {
  for (const item of process.env.ALLOWED_ORIGINS.split(',')) {
    const trimmed = item.trim();
    if (trimmed) TRUSTED_ORIGIN_PATTERNS.push(trimmed);
  }
}

export function isOriginAllowed(origin: string): boolean {
  if (!origin) return false;
  return TRUSTED_ORIGIN_PATTERNS.some((pattern) => {
    if (typeof pattern === 'string') {
      return origin === pattern;
    }
    return pattern.test(origin);
  });
}

/**
 * Strict CORS Middleware
 * Validates origin whitelist, blocks wildcard with credentials, protects sensitive API routes
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  if (origin) {
    if (isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    } else {
      // Disallow unauthorized cross-origin access to API routes
      if (req.path.startsWith('/api/')) {
        if (req.method === 'OPTIONS') {
          return res.status(403).json({ ok: false, error: 'CORS_ORIGIN_DENIED' });
        }
        return res.status(403).json({
          ok: false,
          code: 'CORS_FORBIDDEN',
          messageAr: 'تم حظر الطلب: المصدر غير مصرح به للوصول إلى واجهة برمجة التطبيقات.',
          messageEn: 'Request blocked: Unauthorized origin for API access.',
        });
      }
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id, X-Session-Id, X-User-Uid, X-Admin-Key, Accept, Origin, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
}
