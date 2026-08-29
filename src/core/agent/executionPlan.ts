export type ExecutionStepKind = 'context' | 'tool' | 'response';
export type ExecutionStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ExecutionStep {
  id: string;
  kind: ExecutionStepKind;
  label: string;
  dependsOn: string[];
  status: ExecutionStepStatus;
}

export interface ExecutionPlan {
  id: string;
  steps: ExecutionStep[];
  createdAt: number;
}

export type ExecutionCheck = { ok: true } | { ok: false; reason: 'STEP_NOT_FOUND' | 'STEP_NOT_PENDING' | 'DEPENDENCIES_PENDING' };

const planId = (): string => `plan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;

export function createExecutionPlan(
  steps: Array<Pick<ExecutionStep, 'id' | 'kind' | 'label'> & { dependsOn?: string[] }>,
  createdAt = Date.now(),
): ExecutionPlan {
  const ids = new Set<string>();
  const normalized = steps.map((step) => {
    if (!step.id.trim() || ids.has(step.id)) throw new Error(`Invalid execution step id: ${step.id}`);
    ids.add(step.id);
    return { ...step, dependsOn: [...(step.dependsOn ?? [])], status: 'pending' as const };
  });

  for (const step of normalized) {
    if (step.dependsOn.some((dependency) => !ids.has(dependency) || dependency === step.id)) {
      throw new Error(`Invalid execution dependency for step: ${step.id}`);
    }
  }

  return { id: planId(), steps: normalized, createdAt };
}

export function canExecuteStep(plan: ExecutionPlan, stepId: string): ExecutionCheck {
  const step = plan.steps.find((candidate) => candidate.id === stepId);
  if (!step) return { ok: false, reason: 'STEP_NOT_FOUND' };
  if (step.status !== 'pending') return { ok: false, reason: 'STEP_NOT_PENDING' };
  const dependenciesPending = step.dependsOn.some((dependency) =>
    plan.steps.find((candidate) => candidate.id === dependency)?.status !== 'completed',
  );
  return dependenciesPending ? { ok: false, reason: 'DEPENDENCIES_PENDING' } : { ok: true };
}

export function completeExecutionStep(plan: ExecutionPlan, stepId: string): ExecutionPlan {
  const check = canExecuteStep(plan, stepId);
  if (!check.ok) throw new Error(`Cannot complete execution step: ${check.reason}`);
  return {
    ...plan,
    steps: plan.steps.map((step) => step.id === stepId ? { ...step, status: 'completed' } : step),
  };
}
