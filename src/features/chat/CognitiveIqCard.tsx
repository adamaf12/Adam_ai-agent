import { useState } from 'react';
import { Brain, CheckCircle2, ChevronDown, ChevronUp, HelpCircle, Lightbulb, Sparkles, Award } from 'lucide-react';
import type { ViewId } from '../../core/domain';

export interface CognitiveIqCardPayload {
  category: 'matrix' | 'logic' | 'spatial' | 'math_sequence' | 'deduction';
  difficulty: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  proof: string;
  cognitiveSkill?: string;
}

interface CognitiveIqCardProps {
  payload: CognitiveIqCardPayload;
  language: 'ar' | 'en';
  onNavigateView?: (view: ViewId) => void;
}

export function CognitiveIqCard({
  payload,
  language,
  onNavigateView,
}: CognitiveIqCardProps) {
  const isAr = language === 'ar';
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showProof, setShowProof] = useState(false);

  const isCorrect = selectedOption === payload.correctAnswer;

  return (
    <div className="my-3 rounded-2xl border border-cyan-500/30 bg-slate-950/85 shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-200">
      {/* Header bar */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-950 border-b border-cyan-500/25 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
            <Brain size={14} />
          </div>
          <div>
            <span className="font-bold text-slate-100">
              {isAr ? 'تحدي الاستدلال المنطقي والذكاء' : 'Cognitive IQ & Logic Challenge'}
            </span>
            <div className="text-[10px] text-cyan-400 flex items-center gap-1.5">
              <span>{payload.difficulty}</span>
              <span>•</span>
              <span>{payload.cognitiveSkill || (isAr ? 'الاستدلال التجريدي' : 'Abstract Deduction')}</span>
            </div>
          </div>
        </div>

        {onNavigateView && (
          <button
            type="button"
            onClick={() => onNavigateView('iq')}
            className="text-[11px] px-2.5 py-1 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer flex items-center gap-1"
          >
            <Award size={12} />
            <span>{isAr ? 'استوديو الذكاء ↗' : 'IQ Studio ↗'}</span>
          </button>
        )}
      </div>

      <div className="p-4 space-y-3.5">
        {/* Question formulation */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed">
          <div className="font-semibold text-cyan-400 text-xs mb-1 flex items-center gap-1">
            <HelpCircle size={13} />
            <span>{isAr ? 'المسألة أو اللغز المنطقي:' : 'Logical Problem / Puzzle:'}</span>
          </div>
          <p className="whitespace-pre-wrap">{payload.question}</p>
        </div>

        {/* Interactive options */}
        {payload.options && payload.options.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 block">
              {isAr ? 'اختر الإجابة لاختبار تحليلك الذاتي:' : 'Select an option to test your deduction:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {payload.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                const isOptionCorrect = opt === payload.correctAnswer;
                let btnStyle = 'bg-slate-900 border-slate-800 text-slate-200 hover:border-cyan-500/40';

                if (isSelected) {
                  btnStyle = isOptionCorrect
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-rose-950/80 border-rose-500 text-rose-300 font-semibold';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedOption(opt);
                      setShowProof(true);
                    }}
                    className={`p-2.5 rounded-xl border text-xs text-left rtl:text-right transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isSelected && (
                      <span className="text-[11px]">
                        {isOptionCorrect ? '✓ ' + (isAr ? 'صحيح' : 'Correct') : '✗ ' + (isAr ? 'غير صحيح' : 'Incorrect')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Reveal Proof & In-depth Reasoner */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowProof((prev) => !prev)}
            className="w-full py-2 px-3 rounded-xl bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-between transition-all cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Lightbulb size={13} className="text-amber-400" />
              <span>{isAr ? 'كشف البرهان الرياضي والتحليل المنطقي المعمق' : 'Reveal Logical Proof & Deep Reasoning'}</span>
            </span>
            {showProof ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showProof && (
            <div className="mt-2.5 p-3.5 rounded-xl bg-slate-900 border border-cyan-500/25 space-y-2 text-xs leading-relaxed animate-fadeIn">
              <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-800">
                <span className="text-slate-400 font-semibold">
                  {isAr ? 'الإجابة المعتمدة:' : 'Verified Answer:'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold">
                  {payload.correctAnswer}
                </span>
              </div>
              <div className="text-slate-300 whitespace-pre-wrap pt-1">
                {payload.proof}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
