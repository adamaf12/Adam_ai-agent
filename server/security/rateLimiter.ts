import type { Request, Response, NextFunction } from 'express';
import { auditLogger } from './auditLog';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export class SlidingWindowRateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private windowMs: number;
  private maxRequests: number;
  private maxRequestsAnonymous?: number;
  private name: string;

  constructor(options: { windowMs: number; maxRequests: number; maxRequestsAnonymous?: number; name: string }) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.maxRequestsAnonymous = options.maxRequestsAnonymous;
    this.name = options.name;

    // Periodic cleanup of expired records every 2 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.records.entries()) {
        if (now > record.resetTime) {
          this.records.delete(key);
        }
      }
    }, 120_000).unref();
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const isAuthenticated = Boolean(req.user?.uid);
      const effectiveMax = !isAuthenticated && this.maxRequestsAnonymous ? this.maxRequestsAnonymous : this.maxRequests;
      const key = req.user?.uid || req.ip || 'anonymous';
      const now = Date.now();

      let record = this.records.get(key);
      if (!record || now > record.resetTime) {
        record = { count: 1, resetTime: now + this.windowMs };
        this.records.set(key, record);
      } else {
        record.count++;
      }

      const remaining = Math.max(0, effectiveMax - record.count);
      const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

      res.setHeader('X-RateLimit-Limit', effectiveMax);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetSeconds);

      if (record.count > effectiveMax) {
        res.setHeader('Retry-After', resetSeconds);

        auditLogger.log({
          userId: key,
          ip: req.ip || 'unknown',
          action: 'RATE_LIMIT_EXCEEDED',
          resource: req.originalUrl,
          outcome: 'BLOCKED',
          riskScore: 40,
          metadata: { limiter: this.name, count: record.count, limit: effectiveMax, isAuthenticated },
        });

        return res.status(429).json({
          ok: false,
          code: 'RATE_LIMIT_EXCEEDED',
          error: `Rate limit exceeded for ${this.name}. Please wait ${resetSeconds} seconds before retrying.`,
          messageAr: `تم تجاوز الحد المسموح للطلبات (${this.name}). يرجى الانتظار ${resetSeconds} ثانية قبل إعادة المحاولة.`,
          messageEn: `Rate limit exceeded for ${this.name}. Please wait ${resetSeconds} seconds before retrying.`,
          retryAfter: resetSeconds,
        });
      }

      next();
    };
  }
}

// Pre-configured rate limiters
export const globalRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60_000,
  maxRequests: 120,
  name: 'Global API',
});

export const chatRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60_000,
  maxRequests: 30,
  maxRequestsAnonymous: 15,
  name: 'AI Chat Stream',
});

export const agentRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60_000,
  maxRequests: 30,
  maxRequestsAnonymous: 10,
  name: 'Autonomous Agent Engine',
});

export const mediaRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60_000,
  maxRequests: 15,
  maxRequestsAnonymous: 5,
  name: 'Media Generation',
});

export const authRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60_000,
  maxRequests: 20,
  name: 'Authentication & Sensitive Operations',
});

/**
 * Strict Brute-Force Rate Limiter for Login Routes:
 * Blocks IP after 5 failed/frequent attempts within a 5-minute sliding window.
 */
export const loginBruteForceLimiter = new SlidingWindowRateLimiter({
  windowMs: 5 * 60_000, // 5 minutes
  maxRequests: 5,
  name: 'Login Brute-Force Guard',
});
