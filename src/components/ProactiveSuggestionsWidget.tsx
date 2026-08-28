import React from 'react';
import { Lightbulb, ArrowRight, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { ProactiveSuggestion } from '../types';

interface ProactiveSuggestionsWidgetProps {
  suggestions: ProactiveSuggestion[];
  onExecuteSuggestion: (prompt: string) => void;
  onDismissSuggestion: (id: string) => void;
  isArabic: boolean;
}

export const ProactiveSuggestionsWidget: React.FC<ProactiveSuggestionsWidgetProps> = ({
  suggestions,
  onExecuteSuggestion,
  onDismissSuggestion,
  isArabic,
}) => {
  const activeSuggestions = suggestions.filter((s) => !s.dismissed);
  if (activeSuggestions.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-2 animate-fade-in">
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/40 via-slate-900/90 to-indigo-900/40 border border-purple-500/30 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400">
              <Lightbulb className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>{isArabic ? 'اقتراحات استباقية من آدم' : 'Adam Proactive Smart Suggestions'}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 font-extrabold border border-purple-500/30">
                AI Proactive 💡
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {activeSuggestions.slice(0, 2).map((sug) => (
            <div
              key={sug.id}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition flex flex-col justify-between space-y-2 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h5 className="font-bold text-xs text-slate-100 group-hover:text-purple-300 transition">
                    {isArabic ? sug.titleAr : sug.titleEn}
                  </h5>
                  <p className="text-[11px] text-slate-400 leading-snug mt-1">
                    {isArabic ? sug.descriptionAr : sug.descriptionEn}
                  </p>
                </div>
                <button
                  onClick={() => onDismissSuggestion(sug.id)}
                  className="text-slate-500 hover:text-slate-300 p-1"
                  title={isArabic ? 'تجاهل' : 'Dismiss'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => onExecuteSuggestion(sug.suggestedActionPrompt)}
                className="w-full py-1.5 px-3 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white font-bold text-[11px] flex items-center justify-between transition border border-purple-500/30"
              >
                <span>{isArabic ? 'تنفيذ الاقتراح بضغطة واحدة' : 'Execute with 1-Click'}</span>
                <ArrowRight className="w-3 h-3 rtl:rotate-180" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
