import { randomUUID } from 'node:crypto';
import { auditLogger } from './auditLog';

export interface PendingAction {
  id: string;
  userId: string;
  actionType: string;
  description: string;
  payload: Record<string, any>;
  createdAt: number;
  expiresAt: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
}

class HumanApprovalManager {
  private pendingActions = new Map<string, PendingAction>();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Request human approval for a high-risk operation
   */
  public requestApproval(userId: string, actionType: string, description: string, payload: Record<string, any>): PendingAction {
    const action: PendingAction = {
      id: `appr_${randomUUID()}`,
      userId,
      actionType,
      description,
      payload,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.TTL_MS,
      status: 'PENDING',
    };

    this.pendingActions.set(action.id, action);

    auditLogger.log({
      userId,
      ip: '0.0.0.0',
      action: 'HUMAN_APPROVAL_REQUESTED',
      resource: actionType,
      outcome: 'WARNING',
      riskScore: 60,
      metadata: { approvalId: action.id, description },
    });

    return action;
  }

  /**
   * User or Admin confirms or rejects the pending action
   */
  public resolveApproval(
    approvalId: string,
    userId: string,
    decision: 'APPROVED' | 'REJECTED',
    ip = '0.0.0.0'
  ): { success: boolean; action?: PendingAction; error?: string } {
    const action = this.pendingActions.get(approvalId);
    if (!action) {
      return { success: false, error: 'Approval request not found or already consumed' };
    }

    if (Date.now() > action.expiresAt) {
      action.status = 'EXPIRED';
      this.pendingActions.delete(approvalId);
      return { success: false, error: 'Approval request expired' };
    }

    // Ensure the approving user matches the requesting user or is admin
    if (action.userId !== userId) {
      auditLogger.log({
        userId,
        ip,
        action: 'HUMAN_APPROVAL_TAMPERING',
        resource: action.actionType,
        outcome: 'BLOCKED',
        riskScore: 90,
        metadata: { targetApprovalId: approvalId, originalUser: action.userId },
      });
      return { success: false, error: 'Unauthorized: cannot resolve approvals for another user' };
    }

    action.status = decision;
    this.pendingActions.delete(approvalId);

    auditLogger.log({
      userId,
      ip,
      action: decision === 'APPROVED' ? 'HUMAN_APPROVAL_GRANTED' : 'HUMAN_APPROVAL_REJECTED',
      resource: action.actionType,
      outcome: decision === 'APPROVED' ? 'SUCCESS' : 'DENIED',
      riskScore: 20,
      metadata: { approvalId },
    });

    return { success: true, action };
  }

  public getPendingForUser(userId: string): PendingAction[] {
    const now = Date.now();
    const list: PendingAction[] = [];
    for (const action of this.pendingActions.values()) {
      if (action.userId === userId && action.status === 'PENDING') {
        if (now > action.expiresAt) {
          action.status = 'EXPIRED';
        } else {
          list.push(action);
        }
      }
    }
    return list;
  }
}

export const humanApprovalManager = new HumanApprovalManager();
