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
  if (!resolved.startsWith(path.resolve(baseDir))) {
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
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');

  // HSTS in production or HTTPS
  const isHttps = req.secure || req.header('x-forwarded-proto') === 'https';
  if (isHttps || process.env.NODE_ENV === 'production') {
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
      "img-src 'self' data: blob: https://image.pollinations.ai https://pollinations.ai https://lh3.googleusercontent.com https://*.googleusercontent.com https://picsum.photos https://images.unsplash.com",
      "media-src 'self' data: blob: https://pollinations.ai https://image.pollinations.ai",
      "connect-src 'self' https://generativelanguage.googleapis.com https://gen.pollinations.ai https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://apis.google.com https://accounts.google.com wss: ws:",
      "frame-src 'self' https://accounts.google.com https://apis.google.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ')
  );

  next();
}

/**
 * Strict CORS Middleware
 * Validates origin whitelist, blocks wildcard with credentials
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  // Allowed origin checks
  const isAllowed =
    !origin ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:') ||
    origin.includes('.run.app') ||
    origin.includes('.google.com') ||
    origin.includes('.googleusercontent.com') ||
    origin.includes('ai.studio');

  if (origin && isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (!origin) {
    // Same-origin request (direct browser navigation or curl)
  } else {
    // Disallowed origin: do not set Allow-Origin header with credentials
    res.setHeader('Access-Control-Allow-Origin', 'null');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id, X-Session-Id, X-User-Uid, X-Admin-Key, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
}
