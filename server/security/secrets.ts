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
      'HUGGINGFACE_API_KEY',
      'HF_TOKEN',
      'HUGGINGFACE_TOKEN',
      'HUGGING_FACE_HUB_TOKEN',
      'POLLINATIONS_API_KEY',
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
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
      'CREDENTIAL',
      'AUTH',
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
    // Hugging Face Tokens (hf_...)
    sanitized = sanitized.replace(/hf_[A-Za-z0-9]{25,}/g, '[REDACTED_HF_TOKEN]');

    // Google Gemini / Cloud API keys: AIza...
    sanitized = sanitized.replace(/AIza[A-Za-z0-9_-]{35}/g, '[REDACTED_GOOGLE_KEY]');

    // Bearer tokens
    sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9\-_.~+/]+=*/gi, 'Bearer [REDACTED_TOKEN]');

    // OpenAI / Third-party / Anthropic style keys (sk-..., ant-...)
    sanitized = sanitized.replace(/(?:sk|ant)-[A-Za-z0-9_-]{20,}/g, '[REDACTED_API_KEY]');

    // GitHub tokens
    sanitized = sanitized.replace(/(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}/g, '[REDACTED_GITHUB_TOKEN]');
    sanitized = sanitized.replace(/github_pat_[A-Za-z0-9_]{50,}/g, '[REDACTED_GITHUB_PAT]');

    // Database connection strings: postgres://user:pass@host/db
    sanitized = sanitized.replace(/(postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^:]+:([^@]+)@/gi, '$1://[REDACTED_USER]:[REDACTED_PASS]@');

    return sanitized;
  }

  /**
   * Recursively sanitize any object/array to ensure no keys or tokens leak into JSON responses
   */
  public redactObject<T>(input: T): T {
    if (input === null || input === undefined) return input;
    if (typeof input === 'string') return this.redactSecrets(input) as unknown as T;
    if (typeof input !== 'object') return input;

    if (Array.isArray(input)) {
      return input.map((item) => this.redactObject(item)) as unknown as T;
    }

    const forbiddenKeys = new Set([
      'apikey', 'api_key', 'token', 'secret', 'password', 'privatekey', 'private_key',
      'gemini_api_key', 'hf_token', 'huggingface_api_key', 'authorization', 'cookie'
    ]);

    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(input)) {
      const lowerKey = k.toLowerCase().replace(/[-_]/g, '');
      if (forbiddenKeys.has(lowerKey) && typeof v === 'string' && v.length > 0) {
        result[k] = '[REDACTED_VALUE]';
      } else {
        result[k] = this.redactObject(v);
      }
    }
    return result as T;
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
