import { randomUUID } from 'node:crypto';

export type AuditOutcome = 'SUCCESS' | 'DENIED' | 'BLOCKED' | 'WARNING' | 'ERROR';

export interface AuditEvent {
  id: string;
  timestamp: number;
  userId: string;
  ip: string;
  action: string;
  resource: string;
  outcome: AuditOutcome;
  riskScore: number; // 0 - 100
  metadata?: Record<string, any>;
}

class AuditLogger {
  private events: AuditEvent[] = [];
  private maxEvents = 2000;

  public log(eventData: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const event: AuditEvent = {
      id: `audit_${randomUUID()}`,
      timestamp: Date.now(),
      ...eventData,
    };

    this.events.unshift(event);
    if (this.events.length > this.maxEvents) {
      this.events.length = this.maxEvents;
    }

    // Also output warning for high risk
    if (event.riskScore >= 60 || event.outcome === 'BLOCKED') {
      console.warn(`[AUDIT SECURITY ALERT] [Risk: ${event.riskScore}] [${event.outcome}] ${event.action} by ${event.userId} on ${event.resource}`, event.metadata);
    }

    return event;
  }

  public getEvents(options?: { limit?: number; minRisk?: number; userId?: string }): AuditEvent[] {
    const limit = Math.min(options?.limit ?? 100, 500);
    let filtered = this.events;

    if (options?.minRisk !== undefined) {
      filtered = filtered.filter(e => e.riskScore >= (options.minRisk ?? 0));
    }
    if (options?.userId) {
      filtered = filtered.filter(e => e.userId === options.userId);
    }

    return filtered.slice(0, limit);
  }

  public getStats() {
    const now = Date.now();
    const oneHourAgo = now - 3600_000;
    const recent = this.events.filter(e => e.timestamp >= oneHourAgo);

    return {
      totalLogged: this.events.length,
      lastHourEvents: recent.length,
      blockedThreats: this.events.filter(e => e.outcome === 'BLOCKED').length,
      highRiskEvents: this.events.filter(e => e.riskScore >= 70).length,
    };
  }
}

export const auditLogger = new AuditLogger();
