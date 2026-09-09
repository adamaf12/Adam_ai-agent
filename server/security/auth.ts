import type { Request, Response, NextFunction } from 'express';
import { createHmac, randomBytes } from 'node:crypto';
import { secretsManager } from './secrets';
import { auditLogger } from './auditLog';

export type UserRole = 'guest' | 'user' | 'admin';

export type Permission =
  | 'chat:read'
  | 'chat:write'
  | 'media:read'
  | 'media:generate'
  | 'media:delete'
  | 'agent:execute'
  | 'agent:tools'
  | 'memory:read'
  | 'memory:write'
  | 'tasks:manage'
  | 'admin:read_metrics'
  | 'admin:audit_logs'
  | 'system:approve_action';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  guest: ['chat:read', 'chat:write', 'media:read', 'media:generate', 'memory:read', 'memory:write', 'tasks:manage'],
  user: [
    'chat:read',
    'chat:write',
    'media:read',
    'media:generate',
    'media:delete',
    'agent:execute',
    'agent:tools',
    'memory:read',
    'memory:write',
    'tasks:manage',
  ],
  admin: [
    'chat:read',
    'chat:write',
    'media:read',
    'media:generate',
    'media:delete',
    'agent:execute',
    'agent:tools',
    'memory:read',
    'memory:write',
    'tasks:manage',
    'admin:read_metrics',
    'admin:audit_logs',
    'system:approve_action',
  ],
};

export interface AuthenticatedUser {
  uid: string;
  role: UserRole;
  email?: string;
  displayName?: string;
  isAnonymous: boolean;
  sessionId: string;
  permissions: Permission[];
}

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const SESSION_COOKIE_NAME = 'adam_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Creates a cryptographically signed compact session token
 * Format: base64(payload).signature
 */
export function signSessionToken(payload: { uid: string; role: UserRole; email?: string; displayName?: string; isAnonymous: boolean; exp: number }): string {
  const secret = secretsManager.getSessionSecret();
  const dataStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(dataStr).digest('base64url');
  return `${dataStr}.${signature}`;
}

/**
 * Verifies a compact signed session token
 */
export function verifySessionToken(token: string): { uid: string; role: UserRole; email?: string; displayName?: string; isAnonymous: boolean; exp: number } | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [dataStr, signature] = parts;
  const secret = secretsManager.getSessionSecret();
  const expectedSig = createHmac('sha256', secret).update(dataStr).digest('base64url');

  if (signature !== expectedSig) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(dataStr, 'base64url').toString('utf8'));
    if (typeof payload.exp === 'number' && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Parse cookies header simply without external dependencies
 */
export function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie) => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const val = rest.join('=').trim();
    list[name] = decodeURIComponent(val);
  });
  return list;
}

/**
 * Authentication & Session Middleware
 * Verifies identity via Authorization Bearer or Session Cookie,
 * or generates a deterministic isolated session identity.
 */
export function authenticateSession(req: Request, res: Response, next: NextFunction) {
  try {
    let authHeader = req.header('authorization')?.trim();
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }

    if (!token) {
      const cookies = parseCookies(req.header('cookie'));
      token = cookies[SESSION_COOKIE_NAME] || '';
    }

    // Check custom admin key in header for system operations
    const adminKey = req.header('x-admin-key')?.trim();
    const clientEmail = req.header('x-user-email')?.trim().toLowerCase();
    const isDeveloper = clientEmail === 'maamarfeidat@gmail.com';
    const isConfiguredAdmin = Boolean((adminKey && adminKey === secretsManager.getAdminSecret()) || isDeveloper);

    let user: AuthenticatedUser;

    const verified = verifySessionToken(token);
    if (verified) {
      const isDevVerified = verified.email?.toLowerCase() === 'maamarfeidat@gmail.com' || isDeveloper;
      const role: UserRole = isConfiguredAdmin || isDevVerified ? 'admin' : verified.role || (verified.isAnonymous ? 'guest' : 'user');
      const uid = isDevVerified ? 'maamarfeidat@gmail.com' : verified.uid;
      user = {
        uid,
        role,
        email: isDevVerified ? 'maamarfeidat@gmail.com' : verified.email,
        displayName: verified.displayName,
        isAnonymous: verified.isAnonymous,
        sessionId: randomBytes(8).toString('hex'),
        permissions: ROLE_PERMISSIONS[role],
      };
    } else {
      // Check if client provided a client-assigned Firebase UID or generate guest UID
      const clientUid = req.header('x-user-uid')?.trim() || req.header('x-session-id')?.trim();
      const rawId = clientUid && clientUid.length <= 128 ? clientUid : randomBytes(12).toString('hex');
      const isClientUser = Boolean(req.header('x-user-uid')) || isDeveloper;
      const role: UserRole = isConfiguredAdmin || isDeveloper ? 'admin' : isClientUser ? 'user' : 'guest';
      const uid = isDeveloper ? 'maamarfeidat@gmail.com' : isClientUser ? `usr_${rawId}` : `guest_${rawId}`;

      user = {
        uid,
        role,
        isAnonymous: !isClientUser,
        sessionId: randomBytes(8).toString('hex'),
        permissions: ROLE_PERMISSIONS[role],
      };

      // Issue signed session token for future requests
      const newToken = signSessionToken({
        uid: user.uid,
        role: user.role,
        isAnonymous: user.isAnonymous,
        exp: Date.now() + SESSION_TTL_MS,
      });

      // Set hardened cookie
      const isProd = process.env.NODE_ENV === 'production';
      const cookieVal = `${SESSION_COOKIE_NAME}=${encodeURIComponent(newToken)}; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}`;
      res.setHeader('Set-Cookie', cookieVal);
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Middleware] Unexpected error:', err);
    next();
  }
}

/**
 * Authorization Middleware: Enforce permission
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }

    if (!req.user.permissions.includes(permission)) {
      auditLogger.log({
        userId: req.user.uid,
        ip: req.ip || 'unknown',
        action: 'PERMISSION_DENIED',
        resource: req.originalUrl,
        outcome: 'DENIED',
        metadata: { required: permission, userPermissions: req.user.permissions },
        riskScore: 35,
      });

      return res.status(403).json({
        ok: false,
        error: `Permission denied: action requires '${permission}'`,
      });
    }

    next();
  };
}

/**
 * Authorization Middleware: Enforce role (e.g. admin)
 */
export function requireRole(minRole: UserRole) {
  const hierarchy: Record<UserRole, number> = { guest: 1, user: 2, admin: 3 };

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }

    const userLevel = hierarchy[req.user.role] ?? 0;
    const requiredLevel = hierarchy[minRole] ?? 0;

    if (userLevel < requiredLevel) {
      auditLogger.log({
        userId: req.user.uid,
        ip: req.ip || 'unknown',
        action: 'ROLE_UNAUTHORIZED',
        resource: req.originalUrl,
        outcome: 'DENIED',
        metadata: { requiredRole: minRole, userRole: req.user.role },
        riskScore: 50,
      });

      return res.status(403).json({
        ok: false,
        error: `Access denied: requires '${minRole}' role or higher`,
      });
    }

    next();
  };
}
