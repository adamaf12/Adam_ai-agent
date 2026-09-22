import type { RequestContract } from './requestUnderstanding';

export type ExecutionStepKind = 'understand' | 'research' | 'plan' | 'execute' | 'verify' | 'respond';
export interface ExecutionStep { id:string; kind:ExecutionStepKind; required:boolean; description:string; acceptance:string; }
export interface ExecutionPlan { route:RequestContract['executionRoute']; depth:RequestContract['recommendedModelDepth']; steps:ExecutionStep[]; acceptanceCriteria:string[]; }

export function buildExecutionPlan(contract: RequestContract): ExecutionPlan {
  const steps: ExecutionStep[] = [{
    id:'understand', kind:'understand', required:true,
    description:'Lock the goal, constraints, protected items, and expected deliverable.',
    acceptance:'Answer the requested goal without silently changing constraints.',
  }];
  if (contract.executionRoute === 'web_research' || contract.needsFreshKnowledge) steps.push({
    id:'research', kind:'research', required:true,
    description:'Collect current evidence only when freshness is required.',
    acceptance:'Time-sensitive claims are grounded or explicitly marked unverified.',
  });
  if (['agent_plan','external_execution'].includes(contract.executionRoute) ||
      ['create','modify','debug','execute','plan','continue'].includes(contract.taskType)) steps.push({
    id:'plan', kind:'plan', required:true,
    description:'Choose the smallest reliable sequence of actions with verification conditions.',
    acceptance:'Every action maps to the goal and has a verification condition.',
  });
  if (contract.needsExecution || contract.executionRoute === 'agent_plan') steps.push({
    id:'execute', kind:'execute', required:contract.needsExecution,
    description:'Use only real available tools; never claim an action that was not executed.',
    acceptance:'Execution claims have real tool evidence.',
  });
  steps.push(
    {id:'verify',kind:'verify',required:true,description:'Check the result against the original goal and constraints.',acceptance:'Result passes acceptance criteria or states what remains unverified.'},
    {id:'respond',kind:'respond',required:true,description:'Return the concise completed result.',acceptance:'Final answer is direct, truthful, and complete.'},
  );
  return {route:contract.executionRoute,depth:contract.recommendedModelDepth,steps,acceptanceCriteria:steps.map(s=>s.acceptance)};
}

export function formatExecutionPlan(plan: ExecutionPlan, language:'ar'|'en'): string {
  const label=language==='ar'?'خطة التنفيذ والتحقق':'EXECUTION & VERIFICATION PLAN';
  return `\n=== ${label} ===\n${plan.steps.map((s,i)=>language==='ar'
    ? `${i+1}. [${s.kind}] ${s.description} — معيار القبول: ${s.acceptance}`
    : `${i+1}. [${s.kind}] ${s.description} — Acceptance: ${s.acceptance}`).join('\n')}\n=== END PLAN ===`;
}
