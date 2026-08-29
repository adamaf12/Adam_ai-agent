export type ExecutionStepKind = 'context' | 'tool' | 'response';
export type ExecutionStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ExecutionPlanStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ExecutionStep {
  id: string;
  kind: ExecutionStepKind;
  label: string;
  dependsOn: string[];
  status: ExecutionStepStatus;
  error?: string;
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
    return {
      ...step,
      dependsOn: [...new Set(step.dependsOn ?? [])],
      status: 'pending' as const,
    };
  });

  for (const step of normalized) {
    if (step.dependsOn.some((dependency) => !ids.has(dependency) || dependency === step.id)) {
      throw new Error(`Invalid execution dependency for step: ${step.id}`);
    }
  }

  const stepsById = new Map(normalized.map((step) => [step.id, step]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (stepId: string): void => {
    if (visited.has(stepId)) return;
    if (visiting.has(stepId)) throw new Error(`Execution dependency cycle detected at step: ${stepId}`);
    visiting.add(stepId);
    for (const dependency of stepsById.get(stepId)?.dependsOn ?? []) visit(dependency);
    visiting.delete(stepId);
    visited.add(stepId);
  };
  for (const step of normalized) visit(step.id);

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

function updateStep(plan: ExecutionPlan, stepId: string, status: ExecutionStepStatus, error?: string): ExecutionPlan {
  const step = plan.steps.find((candidate) => candidate.id === stepId);
  if (!step) throw new Error(`Execution step not found: ${stepId}`);
  const allowed = (step.status === 'pending' && (status === 'running' || status === 'failed' || status === 'cancelled'))
    || (step.status === 'running' && (status === 'completed' || status === 'failed' || status === 'cancelled'));
  if (!allowed) throw new Error(`Cannot transition execution step ${stepId} from ${step.status} to ${status}.`);
  return {
    ...plan,
    steps: plan.steps.map((candidate) => candidate.id === stepId
      ? { ...candidate, status, ...(error ? { error } : { error: undefined }) }
      : candidate),
  };
}

export function startExecutionStep(plan: ExecutionPlan, stepId: string): ExecutionPlan {
  const check = canExecuteStep(plan, stepId);
  if (check.ok === false) throw new Error(`Cannot start execution step: ${check.reason}`);
  return updateStep(plan, stepId, 'running');
}

export function completeExecutionStep(plan: ExecutionPlan, stepId: string): ExecutionPlan {
  const step = plan.steps.find((candidate) => candidate.id === stepId);
  if (!step) throw new Error(`Execution step not found: ${stepId}`);
  if (step.status === 'pending') {
    const check = canExecuteStep(plan, stepId);
    if (check.ok === false) throw new Error(`Cannot complete execution step: ${check.reason}`);
    return updateStep(updateStep(plan, stepId, 'running'), stepId, 'completed');
  }
  if (step.status !== 'running') throw new Error(`Cannot complete execution step from ${step.status}.`);
  return updateStep(plan, stepId, 'completed');
}

export function failExecutionStep(plan: ExecutionPlan, stepId: string, error = 'Execution step failed.'): ExecutionPlan {
  return updateStep(plan, stepId, 'failed', error);
}

export function cancelExecutionStep(plan: ExecutionPlan, stepId: string): ExecutionPlan {
  return updateStep(plan, stepId, 'cancelled');
}

export function getExecutionPlanStatus(plan: ExecutionPlan): ExecutionPlanStatus {
  if (plan.steps.length === 0) return 'pending';
  if (plan.steps.some((step) => step.status === 'failed')) return 'failed';
  if (plan.steps.some((step) => step.status === 'cancelled')) return 'cancelled';
  if (plan.steps.every((step) => step.status === 'completed')) return 'completed';
  if (plan.steps.some((step) => step.status === 'running')) return 'running';
  return 'pending';
}
