import React, { useState } from 'react';
import {
  Boxes,
  Workflow,
  ShieldCheck,
  Code2,
  Globe,
  Cpu,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Flame,
  ArrowRight,
} from 'lucide-react';
import type { MultiAgentExecutionPlan } from '../../core/adk-agent/adkTypes';

interface AdkOrchestratorCardProps {
  plan: MultiAgentExecutionPlan;
  language: 'ar' | 'en';
}

export function AdkOrchestratorCard({ plan, language }: AdkOrchestratorCardProps) {
  const isAr = language === 'ar';
  const [isExpanded, setIsExpanded] = useState(false);

  const getAgentIcon = (role: string) => {
    switch (role) {
      case 'coder':
        return <Code2 size={13} className="text-cyan-400" />;
      case 'security':
        return <ShieldCheck size={13} className="text-emerald-400" />;
      case 'researcher':
        return <Globe size={13} className="text-amber-400" />;
      case 'hardware':
        return <Cpu size={13} className="text-rose-400" />;
      case 'evaluator':
        return <CheckCircle2 size={13} className="text-indigo-400" />;
      default:
        return <Workflow size={13} className="text-purple-400" />;
    }
  };

  return (
    <div
      className="quick-liquid-glass my-3 rounded-2xl border border-[var(--border)] bg-slate-950/70 p-3.5 sm:p-4 text-[var(--text)] shadow-xl overflow-hidden transition-all text-start"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--border)]/60">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Boxes size={18} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100">
                {isAr ? 'تنسيق الوكلاء المتعددين (Google ADK)' : 'Google ADK Multi-Agent Orchestration'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase">
                {plan.mode === 'parallel' ? (isAr ? 'سرب متزامن' : 'Parallel Swarm') : (isAr ? 'تسلسلي' : 'Sequential')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-sm">
              {isAr ? `تنسيق ${plan.agentsInvolved.length} وكلاء متخصصين لحل المهمة` : `Orchestrating ${plan.agentsInvolved.length} specialized agents for task execution`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 transition-all cursor-pointer"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Active Agents Flow Ribbon */}
      <div className="pt-3 flex flex-wrap items-center gap-2">
        {plan.agentsInvolved.map((agent, idx) => (
          <div
            key={agent.name}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-medium"
          >
            {getAgentIcon(agent.role)}
            <span className="text-slate-200 font-mono font-bold text-[10px]">{agent.name}</span>
            {idx < plan.agentsInvolved.length - 1 && (
              <span className="text-slate-600 ml-1">→</span>
            )}
          </div>
        ))}
      </div>

      {/* Expanded Step-by-Step Breakdown */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[var(--border)]/50 space-y-2 animate-in fade-in duration-200">
          <span className="text-[11px] font-bold text-slate-400">
            {isAr ? 'مخطط التنفيذ والأدوار (ADK Execution Plan):' : 'ADK Multi-Agent Execution Plan:'}
          </span>
          <div className="space-y-1.5">
            {plan.steps.map(step => (
              <div
                key={step.stepNumber}
                className="p-2 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-slate-800 text-slate-400 font-mono text-[10px] flex items-center justify-center font-bold">
                    {step.stepNumber}
                  </span>
                  <span className="text-slate-300 text-[11px]">{step.description}</span>
                </div>
                <span className="font-mono text-[10px] text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/50">
                  {step.assignedAgent}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
