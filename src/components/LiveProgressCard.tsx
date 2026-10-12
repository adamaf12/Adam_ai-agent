import React from 'react';
import {
  Sparkles,
  Film,
  Image as ImageIcon,
  Gamepad2,
  Globe,
  Square,
  Loader2,
  Clock,
  Layers,
  Cpu,
} from 'lucide-react';
import { useGeneration, type GenerationTaskType } from '../core/generation';
import type { Language } from '../core/domain';

interface LiveProgressCardProps {
  language: Language;
  onCancel?: () => void;
  className?: string;
  compact?: boolean;
}

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}s`;
}

function getTaskDetails(taskType: GenerationTaskType, isAr: boolean) {
  switch (taskType) {
    case 'image':
      return {
        icon: ImageIcon,
        colorClass: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
        progressBarClass: 'from-rose-500 via-pink-500 to-amber-500',
        defaultTitle: isAr ? 'توليد مشهد فني احترافي' : 'Synthesizing Visual Art',
        defaultStage: isAr ? 'جاري معالجة المشهد وتطبيق خوارزميات الانتشار…' : 'Processing scene & diffusion rendering…',
      };
    case 'video':
      return {
        icon: Film,
        colorClass: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
        progressBarClass: 'from-purple-500 via-indigo-500 to-cyan-500',
        defaultTitle: isAr ? 'توليد فيديو سينمائي وديناميكية الكاميرا' : 'Rendering Cinematic Video',
        defaultStage: isAr ? 'جاري معالجة الإطارات الحركية ومسار الكاميرا…' : 'Synthesizing motion frames & camera path…',
      };
    case 'game':
    case 'app':
      return {
        icon: Gamepad2,
        colorClass: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
        progressBarClass: 'from-emerald-500 via-teal-500 to-cyan-500',
        defaultTitle: isAr ? 'بناء وتشغيل لعبة / تطبيق ويب تفاعلي' : 'Compiling Interactive Sandbox App',
        defaultStage: isAr ? 'جاري بناء بيئة اللعبة وتجهيز الأكواد والمحركات…' : 'Architecting game environment & injecting runtime logic…',
      };
    case 'search':
      return {
        icon: Globe,
        colorClass: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
        progressBarClass: 'from-cyan-500 via-blue-500 to-emerald-500',
        defaultTitle: isAr ? 'بحث Google الحي وفحص المصادر' : 'Live Google Grounding Search',
        defaultStage: isAr ? 'جاري استرجاع النتائج وفحص المصادر الموثوقة…' : 'Fetching indexed sources & verifying live data…',
      };
    case 'chat':
    default:
      return {
        icon: Sparkles,
        colorClass: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
        progressBarClass: 'from-cyan-500 via-blue-500 to-purple-500',
        defaultTitle: isAr ? 'معالجة وتنفيذ طلب الذكاء الاصطناعي' : 'Executing Autonomous AI Task',
        defaultStage: isAr ? 'جاري التفكير وصياغة الاستجابة بدقة…' : 'Reasoning & constructing verified response…',
      };
  }
}

export function LiveProgressCard({
  language,
  onCancel,
  className = '',
  compact = false,
}: LiveProgressCardProps) {
  const {
    isGenerating,
    taskType,
    taskTitle,
    stage,
    progress,
    currentStep,
    totalSteps,
    elapsedSeconds,
    cancelGeneration,
  } = useGeneration();

  const isAr = language === 'ar';
  const meta = getTaskDetails(taskType, isAr);
  const IconComponent = meta.icon;

  if (!isGenerating) return null;

  const handleAbort = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCancel) {
      onCancel();
    } else {
      cancelGeneration(isAr ? 'تم إلغاء التوليد بواسطة المستخدم' : 'Generation cancelled by user');
    }
  };

  const displayTitle = taskTitle || meta.defaultTitle;
  const displayStage = stage || meta.defaultStage;

  if (compact) {
    return (
      <div
        className={`live-progress-compact flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg text-xs backdrop-blur-md animate-fadeIn ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${meta.colorClass}`}>
            <IconComponent size={14} className="animate-pulse" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-slate-200 text-[11px] truncate">{displayTitle}</span>
            <span className="text-[10px] text-slate-400 truncate">{displayStage}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-500/20">
            <Clock size={11} className="animate-spin text-cyan-400" />
            <span>{formatElapsed(elapsedSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={handleAbort}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-[11px] transition-all cursor-pointer active:scale-95"
            title={isAr ? 'إلغاء العملية وتحرير الإدخال' : 'Cancel operation & unlock input'}
          >
            <Square size={10} fill="currentColor" />
            <span>{isAr ? 'إلغاء' : 'Cancel'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`live-progress-card p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl animate-fadeIn transition-all ${className}`}
      role="status"
      aria-live="polite"
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${meta.colorClass}`}>
            <IconComponent size={17} className="animate-pulse" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-xs sm:text-sm truncate">
                {displayTitle}
              </span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {isAr ? `خطوة ${currentStep} من ${totalSteps}` : `Step ${currentStep} of ${totalSteps}`}
              </span>
            </div>
            <span className="text-[11px] sm:text-xs text-slate-400 truncate flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin text-cyan-400 shrink-0" />
              <span>{displayStage}</span>
            </span>
          </div>
        </div>

        {/* Right Action: Elapsed Timer & Cancel Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 bg-cyan-950/70 px-2.5 py-1 rounded-xl border border-cyan-500/30 shadow-inner">
            <Clock size={12} className="text-cyan-400 animate-pulse" />
            <span>{formatElapsed(elapsedSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={handleAbort}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-white font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95"
            title={isAr ? 'إلغاء العملية وتحرير الإدخال فوراً' : 'Cancel task & immediately unlock input'}
          >
            <Square size={11} fill="currentColor" />
            <span>{isAr ? 'إلغاء' : 'Cancel'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Animated Progress Bar */}
      <div className="w-full bg-slate-950/80 rounded-full h-2 p-0.5 border border-slate-800 shadow-inner overflow-hidden relative">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${meta.progressBarClass} transition-all duration-500 ease-out relative`}
          style={{ width: `${Math.max(8, Math.min(100, progress))}%` }}
        >
          {/* Shimmer light sweep */}
          <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
        </div>
      </div>

      {/* Bottom Subtitle / Info */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1.5 px-0.5">
        <span className="flex items-center gap-1">
          <Cpu size={10} className="text-cyan-400" />
          <span>{isAr ? 'قفل الإدخال نشط لحماية تماسك العمليات' : 'Input locked for execution integrity'}</span>
        </span>
        <span className="font-bold text-slate-300">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}
