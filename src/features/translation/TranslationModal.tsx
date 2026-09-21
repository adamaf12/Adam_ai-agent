import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Languages, ArrowRightLeft, Sparkles, Copy, Check, Volume2, Send, Loader2 } from 'lucide-react';
import { SUPPORTED_LANGUAGES, TRANSLATION_TONES, type TranslationResult } from './languages';
import { requestTranslation, saveTranslationToHistory } from './translationApi';
import type { Language } from '../../core/domain';

interface TranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  initialText?: string;
  initialTargetLang?: string;
  onSendToChat?: (text: string) => void;
}

export function TranslationModal({
  isOpen,
  onClose,
  language,
  initialText = '',
  initialTargetLang = 'en',
  onSendToChat,
}: TranslationModalProps) {
  const isAr = language === 'ar';
  const [text, setText] = useState(initialText);
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState(initialTargetLang || (isAr ? 'en' : 'ar'));
  const [tone, setTone] = useState('general');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  useEffect(() => {
    if (isOpen && text.trim()) {
      handleTranslate();
    }
  }, [isOpen]);

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await requestTranslation({
        text,
        sourceLang,
        targetLang,
        tone,
        includeAnalysis: true,
      });
      setResult(res);
      if (res.translatedText) {
        saveTranslationToHistory({
          sourceText: text,
          translatedText: res.translatedText,
          sourceLang: res.detectedSourceLang || sourceLang,
          targetLang,
          tone,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.translatedText) return;
    navigator.clipboard?.writeText(result.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Languages size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-100">
                {isAr ? 'الترجمة الفورية الذكية' : 'Quick Smart Translator'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Controls Bar */}
          <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-1">
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="auto">✨ {isAr ? 'كشف تلقائي' : 'Auto-Detect'}</option>
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {isAr ? l.nameAr : l.nameEn}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  const s = sourceLang === 'auto' ? (isAr ? 'ar' : 'en') : sourceLang;
                  setSourceLang(targetLang);
                  setTargetLang(s);
                  if (result?.translatedText) {
                    setText(result.translatedText);
                    setResult(null);
                  }
                }}
                className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-colors"
              >
                <ArrowRightLeft size={13} />
              </button>

              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {isAr ? l.nameAr : l.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              {TRANSLATION_TONES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {isAr ? t.labelAr : t.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            {/* Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">
                {isAr ? 'النص المطلوب ترجمته:' : 'Original Text:'}
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={isAr ? 'اكتب أو الصق النص هنا...' : 'Enter text to translate...'}
                className="w-full h-24 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
              />
            </div>

            {/* Result */}
            {result && (
              <div className="space-y-1 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-emerald-400">
                    {isAr ? 'الترجمة الصادرة:' : 'Translated Output:'}
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
                    >
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                    </button>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-100 whitespace-pre-wrap leading-relaxed">
                  {result.translatedText}
                </div>

                {result.transliteration && (
                  <div className="text-[11px] text-emerald-400/80 font-mono pt-1">
                    Phonetics: {result.transliteration}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleTranslate}
              disabled={loading || !text.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow disabled:opacity-40"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span>{isAr ? 'ترجمة فورية' : 'Translate'}</span>
            </button>

            {result?.translatedText && onSendToChat && (
              <button
                type="button"
                onClick={() => {
                  onSendToChat(result.translatedText);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5"
              >
                <Send size={13} />
                <span>{isAr ? 'إدراج في المحادثة' : 'Insert into Chat'}</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
