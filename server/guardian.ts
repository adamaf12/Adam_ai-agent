export type GuardianStatus = 'healthy' | 'degraded' | 'critical';

export interface GuardianInput {
  geminiConfigured: boolean;
  gatewayConfigured: boolean;
  sessionSecretConfigured: boolean;
  vercel: boolean;
  production: boolean;
  model: string;
}

export interface GuardianFinding {
  code: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  remediation: string;
  autoRepairable: boolean;
}

export interface GuardianReport {
  status: GuardianStatus;
  checkedAt: number;
  environment: {
    vercel: boolean;
    production: boolean;
    model: string;
  };
  findings: GuardianFinding[];
  recovery: {
    mode: 'safe-auto' | 'operator-required';
    steps: string[];
  };
}

/**
 * Safe self-healing decision layer.
 *
 * It never exposes secrets and never pretends to repair infrastructure that the
 * running server does not have permission to mutate. Infrastructure mutations
 * (Vercel env vars, GitHub secrets, etc.) must be performed by an explicitly
 * authorized deployment identity.
 */
export function buildGuardianReport(input: GuardianInput): GuardianReport {
  const findings: GuardianFinding[] = [];

  if (!input.geminiConfigured && !input.gatewayConfigured) {
    findings.push({
      code: 'AI_RUNTIME_NOT_CONFIGURED',
      severity: 'critical',
      message: 'The production runtime has no direct Gemini provider key and no explicitly configured Vercel AI Gateway API key.',
      remediation: 'Configure GEMINI_API_KEY for the Production environment of this Vercel project, then redeploy. AI Gateway OIDC is intentionally not used as an implicit fallback.',
      autoRepairable: false,
    });
  }

  if (input.production && !input.sessionSecretConfigured) {
    findings.push({
      code: 'SESSION_SECRET_MISSING',
      severity: 'warning',
      message: 'SESSION_SECRET is not explicitly configured for Production.',
      remediation: 'Set a strong random SESSION_SECRET in the Production environment.',
      autoRepairable: false,
    });
  }

  if (findings.some(f => f.severity === 'critical')) {
    return {
      status: 'critical',
      checkedAt: Date.now(),
      environment: { vercel: input.vercel, production: input.production, model: input.model },
      findings,
      recovery: {
        mode: 'operator-required',
        steps: findings.map(f => f.remediation),
      },
    };
  }

  if (findings.length) {
    return {
      status: 'degraded',
      checkedAt: Date.now(),
      environment: { vercel: input.vercel, production: input.production, model: input.model },
      findings,
      recovery: { mode: 'operator-required', steps: findings.map(f => f.remediation) },
    };
  }

  return {
    status: 'healthy',
    checkedAt: Date.now(),
    environment: { vercel: input.vercel, production: input.production, model: input.model },
    findings: [],
    recovery: { mode: 'safe-auto', steps: [] },
  };
}
