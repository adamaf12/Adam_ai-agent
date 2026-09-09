import { createHash } from 'node:crypto';

/**
 * Secrets Manager & Redaction Engine
 * Ensures zero secrets leakage in logs, responses, and stack traces.
 */
class SecretsManager {
  private secretsToMask: Set<string> = new Set();
  private initialized = false;

  constructor() {
    this.refreshSecrets();
  }

  public refreshSecrets() {
    // Collect all sensitive environment variables
    const sensitiveKeys = [
      'GEMINI_API_KEY',
      'API_KEY',
      'ADMIN_SECRET_KEY',
      'SESSION_SECRET',
      'FIREBASE_API_KEY',
      'FIREBASE_PRIVATE_KEY',
      'DATABASE_URL',
      'PASSWORD',
      'SECRET',
      'TOKEN',
      'PRIVATE_KEY',
    ];

    for (const key of Object.keys(process.env)) {
      const val = process.env[key]?.trim();
      if (!val || val.length < 6) continue;

      const upper = key.toUpperCase();
      if (sensitiveKeys.some(sk => upper.includes(sk))) {
        this.secretsToMask.add(val);
      }
    }
    this.initialized = true;
  }

  /**
   * Register a dynamic secret (e.g. an ephemeral token) to be masked
   */
  public registerSecret(secret: string) {
    if (secret && secret.trim().length >= 6) {
      this.secretsToMask.add(secret.trim());
    }
  }

  /**
   * Redact known secrets, Bearer tokens, and common API key formats from any string
   */
  public redactSecrets(text: string): string {
    if (!text || typeof text !== 'string') return text;

    let sanitized = text;

    // 1. Redact explicitly registered secrets
    for (const secret of this.secretsToMask) {
      if (secret.length > 5 && sanitized.includes(secret)) {
        sanitized = sanitized.split(secret).join('[REDACTED_SECRET]');
      }
    }

    // 2. Generic API Key & Token patterns
    // Google Gemini API keys: AIzaSy...
    sanitized = sanitized.replace(/AIzaSy[A-Za-z0-9_-]{33}/g, '[REDACTED_GEMINI_KEY]');

    // Bearer tokens
    sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9\-_.~+/]+=*/gi, 'Bearer [REDACTED_TOKEN]');

    // Generic OpenAI / Third-party style keys (sk-...)
    sanitized = sanitized.replace(/sk-[A-Za-z0-9_-]{20,}/g, '[REDACTED_API_KEY]');

    // Database connection strings: postgres://user:pass@host/db
    sanitized = sanitized.replace(/(postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^:]+:([^@]+)@/gi, '$1://[REDACTED_USER]:[REDACTED_PASS]@');

    return sanitized;
  }

  /**
   * Safe getter for GEMINI_API_KEY
   */
  public getGeminiApiKey(): string {
    return process.env.GEMINI_API_KEY?.trim() ?? '';
  }

  /**
   * Safe getter for session secret with stable fallback
   */
  public getSessionSecret(): string {
    const raw = process.env.SESSION_SECRET || process.env.GEMINI_API_KEY || 'adam-secure-fallback-salt-2026';
    return createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Safe getter for admin secret
   */
  public getAdminSecret(): string {
    return process.env.ADMIN_SECRET_KEY?.trim() || '';
  }

  /**
   * Validate secrets configuration status without exposing values
   */
  public getStatus() {
    const hasGemini = Boolean(this.getGeminiApiKey());
    const hasAdmin = Boolean(this.getAdminSecret());
    return {
      geminiConfigured: hasGemini,
      adminConfigured: hasAdmin,
      maskedSecretsCount: this.secretsToMask.size,
      secretsShieldActive: true,
    };
  }
}

export const secretsManager = new SecretsManager();
export const redactSecrets = (text: string) => secretsManager.redactSecrets(text);
