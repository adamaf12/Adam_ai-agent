import React, { useState } from 'react';
import { Languages, Copy, Check, Volume2, VolumeX, ArrowRightLeft, Sparkles, BookOpen } from 'lucide-react';
import type { TranslationResult } from '../translation/languages';

export interface TranslationCardPayload {
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  tone?: string;
  transliteration?: string;
  alternatives?: Array<{ text: string; context: string }>;
  grammarNotes?: string;
  vocabulary?: Array<{ word: string; translation: string; pos?: string }>;
}

export function TranslationCard({
  data,
  language = 'ar',
}: {
  data: TranslationCardPayload;
  language?: 'ar' | 'en';
}) {
  const isAr = language === 'ar';
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(data.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(data.translatedText);
    utterance.lang = data.targetLang;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="my-3 rounded-2xl border border-emerald-500/30 bg-slate-950/95 shadow-xl overflow-hidden backdrop-blur-xl">
      {/* Header */}
      <div className="p-3 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border-b border-emerald-500/20 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Languages size={15} />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-200 uppercase">{data.sourceLang}</span>
            <span className="text-emerald-400 font-bold">→</span>
            <span className="font-bold text-emerald-400 uppercase">{data.targetLang}</span>
            {data.tone && (
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700 ml-1">
                {data.tone}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleSpeak}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              isSpeaking
                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
            title={isAr ? 'نطق صوتي' : 'Pronunciation'}
          >
            {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
            title={isAr ? 'نسخ الترجمة' : 'Copy'}
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* Body: Original & Translation */}
      <div className="p-3.5 space-y-3">
        {/* Source Text */}
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400">
          <div className="text-[10px] font-bold text-slate-500 mb-1">{isAr ? 'النص الأصلي:' : 'Source:'}</div>
          <div className="text-slate-200">{data.sourceText}</div>
        </div>

        {/* Translated Text */}
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
          <div className="text-[10px] font-bold text-emerald-400 mb-1">{isAr ? 'الترجمة المعتمدة:' : 'Translation:'}</div>
          <div className="text-emerald-100 select-text whitespace-pre-wrap">{data.translatedText}</div>
          {data.transliteration && (
            <div className="mt-2 text-[11px] font-mono text-emerald-300/80 pt-1 border-t border-emerald-500/20">
              Phonetics: {data.transliteration}
            </div>
          )}
        </div>

        {/* Extra Analysis Toggle */}
        {(data.alternatives || data.grammarNotes || data.vocabulary) && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <BookOpen size={12} />
              <span>{showAnalysis ? (isAr ? 'إخفاء التحليل' : 'Hide Analysis') : (isAr ? 'عرض البدائل والتحليل النحوي' : 'Show Linguistic Notes & Alternatives')}</span>
            </button>

            {showAnalysis && (
              <div className="mt-2 pt-2 border-t border-slate-800 space-y-2 text-xs">
                {data.alternatives && data.alternatives.length > 0 && (
                  <div>
                    <div className="font-bold text-slate-300 text-[11px] mb-1">{isAr ? 'ترجمات بديلة:' : 'Alternatives:'}</div>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                      {data.alternatives.map((alt, idx) => (
                        <li key={idx}>
                          <span className="text-slate-200 font-semibold">{alt.text}</span>
                          {alt.context && <span className="text-slate-500 text-[10px]"> ({alt.context})</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {data.grammarNotes && (
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-[11px] leading-relaxed">
                    <span className="font-bold text-teal-400 block mb-0.5">{isAr ? 'ملاحظة لغوية ونحوية:' : 'Grammar note:'}</span>
                    {data.grammarNotes}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
