import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowRightLeft,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileText,
  History,
  Languages,
  Loader2,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Star,
  Trash2,
  UploadCloud,
  Volume2,
  VolumeX,
  Wand2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SUPPORTED_LANGUAGES,
  TRANSLATION_TONES,
  type LanguageDef,
  type TranslationTone,
  type TranslationResult,
  type TranslationHistoryItem,
} from './languages';
import {
  requestTranslation,
  loadTranslationHistory,
  saveTranslationToHistory,
  toggleFavoriteTranslation,
  deleteTranslationItem,
  clearTranslationHistory,
} from './translationApi';
import type { Language, ViewId } from '../../core/domain';

interface TranslatorStudioProps {
  language: Language;
  onNavigateToChat?: (initialPrompt?: string) => void;
  initialSourceText?: string;
  initialTargetLang?: string;
}

export function TranslatorStudio({
  language,
  onNavigateToChat,
  initialSourceText = '',
  initialTargetLang = 'en',
}: TranslatorStudioProps) {
  const isAr = language === 'ar';
  const [sourceText, setSourceText] = useState(initialSourceText);
  const [sourceLang, setSourceLang] = useState<string>('auto');
  const [targetLang, setTargetLang] = useState<string>(initialTargetLang || (isAr ? 'en' : 'ar'));
  const [selectedTone, setSelectedTone] = useState<TranslationTone['id']>('general');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sourceCopied, setSourceCopied] = useState(false);
  const [isSpeakingSource, setIsSpeakingSource] = useState(false);
  const [isSpeakingTarget, setIsSpeakingTarget] = useState(false);
  const [listening, setListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<TranslationHistoryItem[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'favorites'>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLinguisticDetails, setShowLinguisticDetails] = useState(true);

  // Dropdown states for Language selectors
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showTargetDropdown, setShowTargetDropdown] = useState(false);
  const [sourceSearch, setSourceSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [sourceCategory, setSourceCategory] = useState<'all' | 'popular' | 'arabic' | 'european' | 'asian'>('all');
  const [targetCategory, setTargetCategory] = useState<'all' | 'popular' | 'arabic' | 'european' | 'asian'>('all');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setHistoryItems(loadTranslationHistory());
  }, []);

  const sourceLangObj = useMemo(() => {
    if (sourceLang === 'auto') {
      return {
        code: 'auto',
        nameAr: 'كشف تلقائي',
        nameEn: 'Auto-Detect',
        nativeName: isAr ? 'كشف تلقائي' : 'Auto-Detect',
        flag: '✨',
        category: 'popular' as const,
      };
    }
    return SUPPORTED_LANGUAGES.find((l) => l.code === sourceLang) || SUPPORTED_LANGUAGES[0];
  }, [sourceLang, isAr]);

  const targetLangObj = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === targetLang) || SUPPORTED_LANGUAGES[1];
  }, [targetLang]);

  const filteredSourceLanguages = useMemo(() => {
    return SUPPORTED_LANGUAGES.filter((l) => {
      if (sourceCategory !== 'all' && l.category !== sourceCategory) return false;
      if (!sourceSearch.trim()) return true;
      const q = sourceSearch.toLowerCase().trim();
      return (
        l.nameAr.toLowerCase().includes(q) ||
        l.nameEn.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
      );
    });
  }, [sourceCategory, sourceSearch]);

  const filteredTargetLanguages = useMemo(() => {
    return SUPPORTED_LANGUAGES.filter((l) => {
      if (targetCategory !== 'all' && l.category !== targetCategory) return false;
      if (!targetSearch.trim()) return true;
      const q = targetSearch.toLowerCase().trim();
      return (
        l.nameAr.toLowerCase().includes(q) ||
        l.nameEn.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
      );
    });
  }, [targetCategory, targetSearch]);

  // Execute Translation
  const handleTranslate = async (overrideText?: string, overrideTone?: TranslationTone['id']) => {
    const textToTranslate = overrideText !== undefined ? overrideText : sourceText;
    const toneToUse = overrideTone !== undefined ? overrideTone : selectedTone;

    if (!textToTranslate.trim()) {
      setResult(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const res = await requestTranslation({
        text: textToTranslate,
        sourceLang,
        targetLang,
        tone: toneToUse,
        includeAnalysis: true,
        signal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setResult(res);
        if (res.translatedText && res.translatedText.trim()) {
          const saved = saveTranslationToHistory({
            sourceText: textToTranslate,
            translatedText: res.translatedText,
            sourceLang: res.detectedSourceLang || sourceLang,
            targetLang,
            tone: toneToUse,
          });
          setHistoryItems((prev) => [saved, ...prev.filter((h) => h.id !== saved.id)]);
        }
      }
    } catch (err: any) {
      if (!controller.signal.aborted) {
        console.error('[Translator] Error:', err);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  // Swap Source and Target Languages
  const handleSwap = () => {
    if (sourceLang === 'auto') {
      const detected = result?.detectedSourceLang || (isAr ? 'ar' : 'en');
      setSourceLang(targetLang);
      setTargetLang(detected);
    } else {
      const temp = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(temp);
    }

    if (result?.translatedText) {
      setSourceText(result.translatedText);
      setResult(null);
    }
  };

  // Copy Translated Text
  const handleCopy = (text: string, isSource = false) => {
    navigator.clipboard?.writeText(text);
    if (isSource) {
      setSourceCopied(true);
      setTimeout(() => setSourceCopied(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Speech Dictation
  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(isAr ? 'التعرف الصوتي غير مدعوم في هذا المتصفح' : 'Speech recognition not supported in this browser');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = sourceLang === 'auto' ? (isAr ? 'ar-DZ' : 'en-US') : sourceLang;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setSourceText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setListening(false);
    }
  };

  // Text to Speech
  const handleSpeak = (text: string, langCode: string, isSource: boolean) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if ((isSource && isSpeakingSource) || (!isSource && isSpeakingTarget)) {
      window.speechSynthesis.cancel();
      setIsSpeakingSource(false);
      setIsSpeakingTarget(false);
      return;
    }

    window.speechSynthesis.cancel();
    if (isSource) setIsSpeakingSource(true);
    else setIsSpeakingTarget(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode === 'auto' ? (isAr ? 'ar-SA' : 'en-US') : langCode;
    utterance.rate = 0.95;

    utterance.onend = () => {
      setIsSpeakingSource(false);
      setIsSpeakingTarget(false);
    };
    utterance.onerror = () => {
      setIsSpeakingSource(false);
      setIsSpeakingTarget(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setSourceText(content);
        handleTranslate(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Download Translation
  const handleDownload = () => {
    if (!result?.translatedText) return;
    const content = `--- Original (${sourceLangObj.nameEn}) ---\n${sourceText}\n\n--- Translation (${targetLangObj.nameEn} - ${selectedTone}) ---\n${result.translatedText}\n\n${
      result.grammarNotes ? `--- Notes ---\n${result.grammarNotes}\n` : ''
    }`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translation_${sourceLang}_to_${targetLang}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Send to Chat
  const handleSendToChat = () => {
    if (!result?.translatedText || !onNavigateToChat) return;
    const prompt = isAr
      ? `لقد قمت بترجمة النص التالي من (${sourceLangObj.nameAr}) إلى (${targetLangObj.nameAr}):\n\n**الأصل:**\n${sourceText}\n\n**الترجمة:**\n${result.translatedText}\n\nهل يمكنك مساعدتي في التدقيق أو تطوير هذا النص؟`
      : `I translated the following text from (${sourceLangObj.nameEn}) to (${targetLangObj.nameEn}):\n\n**Original:**\n${sourceText}\n\n**Translation:**\n${result.translatedText}\n\nCan you help me polish or expand on this?`;
    onNavigateToChat(prompt);
  };

  // Filtered History
  const filteredHistory = useMemo(() => {
    return historyItems.filter((item) => {
      if (historyFilter === 'favorites' && !item.favorite) return false;
      if (!historySearch.trim()) return true;
      const q = historySearch.toLowerCase().trim();
      return (
        item.sourceText.toLowerCase().includes(q) ||
        item.translatedText.toLowerCase().includes(q)
      );
    });
  }, [historyItems, historyFilter, historySearch]);

  const activeTone = useMemo(() => {
    return TRANSLATION_TONES.find((t) => t.id === selectedTone) || TRANSLATION_TONES[0];
  }, [selectedTone]);

  return (
    <div className={`w-full max-w-7xl mx-auto p-3 sm:p-6 transition-all duration-300 ${isExpanded ? 'fixed inset-0 z-50 bg-slate-950 p-4 sm:p-8 overflow-y-auto' : ''}`}>
      {/* Top Banner Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20">
            <Languages size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                {isAr ? 'المترجم اللغوي الشامل (Universal Translator)' : 'Universal Intelligent Translator'}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100+ {isAr ? 'لغة ولهجة' : 'Languages & Dialects'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'ترجمة فورية ذكية، تحليل بلاغي ونحوي، تحويل صوتي، ومطابقة للهجات الدارجة'
                : 'Real-time AI translation, linguistic analysis, speech synthesis & multi-dialect parity'}
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* History Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showHistory
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            <History size={14} />
            <span className="hidden sm:inline">{isAr ? 'السجل والمفضلة' : 'History & Saved'}</span>
            {historyItems.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${showHistory ? 'bg-slate-950 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
                {historyItems.length}
              </span>
            )}
          </button>

          {/* Expand Fullscreen */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 transition-colors cursor-pointer"
            title={isExpanded ? (isAr ? 'تصغير' : 'Collapse') : (isAr ? 'تكبير كامل الشاشة' : 'Fullscreen')}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Language Selector Bar & Tone Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4 items-center">
        {/* Source Language Selector */}
        <div className="relative lg:col-span-5">
          <button
            type="button"
            onClick={() => {
              setShowSourceDropdown(!showSourceDropdown);
              setShowTargetDropdown(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 text-slate-200 transition-all cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{sourceLangObj.flag}</span>
              <div className="text-left rtl:text-right">
                <div className="text-xs font-bold text-slate-100">
                  {isAr ? sourceLangObj.nameAr : sourceLangObj.nameEn}
                </div>
                <div className="text-[10px] text-slate-400">{sourceLangObj.nativeName}</div>
              </div>
            </div>
            <ChevronDown size={15} className={`text-slate-400 transition-transform ${showSourceDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Source Dropdown Menu */}
          <AnimatePresence>
            {showSourceDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute left-0 right-0 top-full mt-2 z-50 p-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl backdrop-blur-2xl max-h-[380px] flex flex-col"
              >
                {/* Search Bar */}
                <div className="relative mb-2.5">
                  <Search size={14} className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={sourceSearch}
                    onChange={(e) => setSourceSearch(e.target.value)}
                    placeholder={isAr ? 'ابحث عن لغة أو لهجة...' : 'Search languages or dialects...'}
                    className="w-full py-1.5 px-8 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  {sourceSearch && (
                    <button
                      type="button"
                      onClick={() => setSourceSearch('')}
                      className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 border-b border-slate-800 text-[11px] scrollbar-none">
                  {[
                    { id: 'all', label: isAr ? 'الكل' : 'All' },
                    { id: 'popular', label: isAr ? 'الأكثر استخداماً' : 'Popular' },
                    { id: 'arabic', label: isAr ? 'اللهجات العربية' : 'Arabic Dialects' },
                    { id: 'european', label: isAr ? 'أوروبية' : 'European' },
                    { id: 'asian', label: isAr ? 'آسيوية وشرقية' : 'Asian & Other' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSourceCategory(cat.id as any)}
                      className={`px-2.5 py-0.8 rounded-lg whitespace-nowrap transition-colors ${
                        sourceCategory === cat.id
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Languages List */}
                <div className="overflow-y-auto space-y-1 pr-1 flex-1">
                  {/* Auto-Detect option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSourceLang('auto');
                      setShowSourceDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                      sourceLang === 'auto'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                        : 'hover:bg-slate-900 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>✨</span>
                      <span>{isAr ? 'كشف تلقائي للغة النص' : 'Auto-Detect Language'}</span>
                    </div>
                    {sourceLang === 'auto' && <Check size={14} className="text-emerald-400" />}
                  </button>

                  {filteredSourceLanguages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setSourceLang(l.code);
                        setShowSourceDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                        sourceLang === l.code
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                          : 'hover:bg-slate-900 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{l.flag}</span>
                        <span>{isAr ? l.nameAr : l.nameEn}</span>
                        <span className="text-[10px] text-slate-500">({l.nativeName})</span>
                      </div>
                      {sourceLang === l.code && <Check size={14} className="text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center lg:col-span-2">
          <button
            type="button"
            onClick={handleSwap}
            className="p-2.5 rounded-2xl bg-slate-900 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 border border-slate-800 hover:border-emerald-400 transition-all duration-200 shadow-md group cursor-pointer"
            title={isAr ? 'تبديل اللغات (Swap)' : 'Swap Languages'}
          >
            <ArrowRightLeft size={16} className="transition-transform group-hover:rotate-180 duration-300" />
          </button>
        </div>

        {/* Target Language Selector */}
        <div className="relative lg:col-span-5">
          <button
            type="button"
            onClick={() => {
              setShowTargetDropdown(!showTargetDropdown);
              setShowSourceDropdown(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 text-slate-200 transition-all cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{targetLangObj.flag}</span>
              <div className="text-left rtl:text-right">
                <div className="text-xs font-bold text-slate-100">
                  {isAr ? targetLangObj.nameAr : targetLangObj.nameEn}
                </div>
                <div className="text-[10px] text-slate-400">{targetLangObj.nativeName}</div>
              </div>
            </div>
            <ChevronDown size={15} className={`text-slate-400 transition-transform ${showTargetDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Target Dropdown Menu */}
          <AnimatePresence>
            {showTargetDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute left-0 right-0 top-full mt-2 z-50 p-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl backdrop-blur-2xl max-h-[380px] flex flex-col"
              >
                {/* Search Bar */}
                <div className="relative mb-2.5">
                  <Search size={14} className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={targetSearch}
                    onChange={(e) => setTargetSearch(e.target.value)}
                    placeholder={isAr ? 'ابحث عن لغة الهدف...' : 'Search target language...'}
                    className="w-full py-1.5 px-8 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  {targetSearch && (
                    <button
                      type="button"
                      onClick={() => setTargetSearch('')}
                      className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 border-b border-slate-800 text-[11px] scrollbar-none">
                  {[
                    { id: 'all', label: isAr ? 'الكل' : 'All' },
                    { id: 'popular', label: isAr ? 'الأكثر استخداماً' : 'Popular' },
                    { id: 'arabic', label: isAr ? 'اللهجات العربية' : 'Arabic Dialects' },
                    { id: 'european', label: isAr ? 'أوروبية' : 'European' },
                    { id: 'asian', label: isAr ? 'آسيوية وشرقية' : 'Asian & Other' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setTargetCategory(cat.id as any)}
                      className={`px-2.5 py-0.8 rounded-lg whitespace-nowrap transition-colors ${
                        targetCategory === cat.id
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Languages List */}
                <div className="overflow-y-auto space-y-1 pr-1 flex-1">
                  {filteredTargetLanguages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setTargetLang(l.code);
                        setShowTargetDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                        targetLang === l.code
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                          : 'hover:bg-slate-900 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{l.flag}</span>
                        <span>{isAr ? l.nameAr : l.nameEn}</span>
                        <span className="text-[10px] text-slate-500">({l.nativeName})</span>
                      </div>
                      {targetLang === l.code && <Check size={14} className="text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tone Preset Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
        <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1">
          <Wand2 size={13} className="text-emerald-400" />
          <span>{isAr ? 'أسلوب الصياغة:' : 'Tone & Style:'}</span>
        </span>
        {TRANSLATION_TONES.map((tone) => (
          <button
            key={tone.id}
            type="button"
            onClick={() => {
              setSelectedTone(tone.id);
              if (sourceText.trim()) handleTranslate(sourceText, tone.id);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedTone === tone.id
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20 scale-[1.02]'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
            title={isAr ? tone.descAr : tone.descEn}
          >
            <span>{tone.icon}</span>
            <span>{isAr ? tone.labelAr : tone.labelEn}</span>
          </button>
        ))}
      </div>

      {/* Main Translation Arena (Side-by-Side Dual Deck) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Source Text Box */}
        <div className="flex flex-col rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden focus-within:border-emerald-500/50 transition-all">
          {/* Header Action Tools */}
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">
                {isAr ? sourceLangObj.nameAr : sourceLangObj.nameEn}
              </span>
              {result?.detectedSourceLang && sourceLang === 'auto' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {isAr ? `تم الكشف: ${result.detectedSourceLang}` : `Detected: ${result.detectedSourceLang}`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* File Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.json,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
                title={isAr ? 'استيراد نص من ملف (.txt, .md, .json)' : 'Upload Text File'}
              >
                <UploadCloud size={14} />
              </button>

              {/* Speech Input */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                  listening
                    ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
                title={isAr ? 'إملاء صوتي مباشر' : 'Voice Dictation'}
              >
                {listening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>

              {/* Speak Source Audio */}
              {sourceText.trim() && (
                <button
                  type="button"
                  onClick={() => handleSpeak(sourceText, sourceLang, true)}
                  className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                    isSpeakingSource
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                  title={isAr ? 'استماع للنطق الأصلي' : 'Listen to Original'}
                >
                  {isSpeakingSource ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
              )}

              {/* Copy Source */}
              {sourceText.trim() && (
                <button
                  type="button"
                  onClick={() => handleCopy(sourceText, true)}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
                  title={isAr ? 'نسخ النص الأصلي' : 'Copy Original'}
                >
                  {sourceCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              )}

              {/* Clear Source */}
              {sourceText.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setSourceText('');
                    setResult(null);
                  }}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer"
                  title={isAr ? 'مسح النص' : 'Clear Text'}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Text Area */}
          <div className="relative p-4 flex-1 min-h-[220px] flex flex-col">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={
                isAr
                  ? 'اكتب أو الصق النص هنا للترجمة إلى أي لغة...'
                  : 'Type or paste text here to translate into any language...'
              }
              dir={sourceLangObj.dir || (isAr ? 'rtl' : 'ltr')}
              className="w-full flex-1 bg-transparent border-0 resize-none text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none leading-relaxed"
            />

            {/* Bottom Info & Action Bar */}
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              <div className="flex items-center gap-3 font-mono">
                <span>{sourceText.length} {isAr ? 'حرف' : 'chars'}</span>
                <span>{sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0} {isAr ? 'كلمة' : 'words'}</span>
              </div>

              {/* Primary Translate Trigger Button */}
              <button
                type="button"
                onClick={() => handleTranslate()}
                disabled={loading || !sourceText.trim()}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>{isAr ? 'جاري الترجمة...' : 'Translating...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>{isAr ? 'ترجمة فورية' : 'Translate Now'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Target Translation Box */}
        <div className="flex flex-col rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden focus-within:border-emerald-500/50 transition-all relative">
          {/* Header Action Tools */}
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400">
                {isAr ? targetLangObj.nameAr : targetLangObj.nameEn}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {activeTone.icon} {isAr ? activeTone.labelAr : activeTone.labelEn}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Text to Speech Output */}
              {result?.translatedText && (
                <button
                  type="button"
                  onClick={() => handleSpeak(result.translatedText, targetLang, false)}
                  className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                    isSpeakingTarget
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                  title={isAr ? 'استماع للنطق الصوتي' : 'Listen to Pronunciation'}
                >
                  {isSpeakingTarget ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
              )}

              {/* Copy Target */}
              {result?.translatedText && (
                <button
                  type="button"
                  onClick={() => handleCopy(result.translatedText, false)}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
                  title={isAr ? 'نسخ الترجمة' : 'Copy Translation'}
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              )}

              {/* Download File */}
              {result?.translatedText && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
                  title={isAr ? 'تنزيل كملف نصي' : 'Download Text File'}
                >
                  <Download size={14} />
                </button>
              )}

              {/* Send to Chat */}
              {result?.translatedText && onNavigateToChat && (
                <button
                  type="button"
                  onClick={handleSendToChat}
                  className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  title={isAr ? 'إرسال واستخدام في المحادثة' : 'Send to Chat'}
                >
                  <Send size={12} />
                  <span className="hidden sm:inline">{isAr ? 'إرسال للمحادثة' : 'Send to Chat'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Text Area / Result Display */}
          <div className="relative p-4 flex-1 min-h-[220px] flex flex-col justify-between">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 py-12">
                <Loader2 size={26} className="animate-spin text-emerald-400" />
                <span className="text-xs">{isAr ? 'جاري الصياغة والتحليل اللغوي الدقيق...' : 'Synthesizing precision translation & linguistics...'}</span>
              </div>
            ) : result?.translatedText ? (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div
                    dir={targetLangObj.dir || 'ltr'}
                    className="text-sm sm:text-base text-slate-100 font-normal leading-relaxed select-text whitespace-pre-wrap"
                  >
                    {result.translatedText}
                  </div>

                  {/* Transliteration if available */}
                  {result.transliteration && (
                    <div className="mt-3 pt-2 border-t border-slate-800/80 text-xs font-mono text-emerald-300/90 flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Phonetics:</span>
                      <span>{result.transliteration}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <div className="flex items-center gap-3 font-mono">
                    <span>{result.translatedText.length} {isAr ? 'حرف' : 'chars'}</span>
                    <span>{result.translatedText.trim().split(/\s+/).length} {isAr ? 'كلمة' : 'words'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowLinguisticDetails(!showLinguisticDetails)}
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <BookOpen size={12} />
                    <span>{showLinguisticDetails ? (isAr ? 'إخفاء التحليل' : 'Hide Analysis') : (isAr ? 'التحليل اللغوي والمفردات' : 'Linguistic Breakdown')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-500 py-12">
                <Languages size={32} className="text-slate-700" />
                <span className="text-xs text-center max-w-xs">
                  {isAr
                    ? 'ستظهر الترجمة الفورية والتحليل اللغوي هنا بعد إدخال النص والنقر على ترجمة'
                    : 'Instant translation, phonetics and linguistic details will appear here'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Linguistic Analysis Breakdown Section */}
      <AnimatePresence>
        {result && showLinguisticDetails && (result.alternatives || result.grammarNotes || result.vocabulary || result.culturalNotes) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800 mb-6 shadow-xl space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Sparkles size={16} className="text-emerald-400" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-100">
                {isAr ? 'التحليل اللغوي، البدائل، والمفردات التخصصية' : 'Linguistic Intelligence & Nuance Breakdown'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Alternative Translations */}
              {result.alternatives && result.alternatives.length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                    <span>🔄</span>
                    <span>{isAr ? 'خيارات وترجمات بديلة' : 'Alternative Renderings'}</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {result.alternatives.map((alt, i) => (
                      <li key={i} className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                        <div className="font-semibold text-slate-100">{alt.text}</div>
                        {alt.context && <div className="text-[10px] text-slate-400 mt-0.5">{alt.context}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Grammar & Linguistic Notes */}
              {result.grammarNotes && (
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <h4 className="text-xs font-bold text-teal-400 mb-2 flex items-center gap-1.5">
                    <span>📖</span>
                    <span>{isAr ? 'ملاحظات نحوية وتركيبية' : 'Grammar & Syntax Notes'}</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {result.grammarNotes}
                  </p>
                </div>
              )}

              {/* Key Vocabulary Dictionary Table */}
              {result.vocabulary && result.vocabulary.length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 md:col-span-2 lg:col-span-1">
                  <h4 className="text-xs font-bold text-cyan-400 mb-2 flex items-center gap-1.5">
                    <span>📚</span>
                    <span>{isAr ? 'قاموس المفردات الأساسية' : 'Key Vocabulary'}</span>
                  </h4>
                  <div className="space-y-1 text-xs">
                    {result.vocabulary.map((vocab, i) => (
                      <div key={i} className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                        <div className="font-semibold text-slate-200">{vocab.word}</div>
                        <div className="flex items-center gap-1.5">
                          {vocab.pos && <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">{vocab.pos}</span>}
                          <span className="text-emerald-400 font-medium">{vocab.translation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History & Bookmarks Drawer Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 sm:p-5 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl mb-6"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <History size={16} className="text-emerald-400" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-100">
                  {isAr ? 'سجل الترجمات والمحفوظات' : 'Translation History & Bookmarks'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Filter Tabs */}
                <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setHistoryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      historyFilter === 'all'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isAr ? 'الكل' : 'All'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryFilter('favorites')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                      historyFilter === 'favorites'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Star size={11} className={historyFilter === 'favorites' ? 'fill-slate-950' : ''} />
                    <span>{isAr ? 'المفضلة' : 'Saved'}</span>
                  </button>
                </div>

                {/* Clear History */}
                {historyItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(isAr ? 'هل تريد مسح سجل الترجمات؟' : 'Clear all translation history?')) {
                        clearTranslationHistory();
                        setHistoryItems([]);
                      }
                    }}
                    className="p-1.5 rounded-xl bg-slate-950 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                    title={isAr ? 'مسح السجل' : 'Clear History'}
                  >
                    <Trash2 size={13} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="p-1.5 rounded-xl bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* History Search */}
            <div className="pt-3 pb-2">
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder={isAr ? 'ابحث في الترجمات السابقة...' : 'Search past translations...'}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* History Items Grid */}
            <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1 pt-1">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  {isAr ? 'لا توجد ترجمات محفوظة حتى الآن' : 'No translation history found'}
                </div>
              ) : (
                filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                  >
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => {
                        setSourceText(item.sourceText);
                        setSourceLang(item.sourceLang);
                        setTargetLang(item.targetLang);
                        setSelectedTone((item.tone as any) || 'general');
                        setResult({ translatedText: item.translatedText });
                        setShowHistory(false);
                      }}
                    >
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1">
                        <span className="font-bold text-slate-300 uppercase">{item.sourceLang} → {item.targetLang}</span>
                        <span>•</span>
                        <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs text-slate-200 line-clamp-1 font-medium">{item.sourceText}</div>
                      <div className="text-xs text-emerald-400 line-clamp-1 mt-0.5">{item.translatedText}</div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = toggleFavoriteTranslation(item.id);
                          setHistoryItems(updated);
                        }}
                        className={`p-1.5 rounded-xl border transition-colors ${
                          item.favorite
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-slate-900 text-slate-400 hover:text-amber-400 border-slate-800'
                        }`}
                        title={isAr ? 'حفظ في المفضلة' : 'Favorite'}
                      >
                        <Star size={13} className={item.favorite ? 'fill-amber-400' : ''} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(item.translatedText)}
                        className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
                        title={isAr ? 'نسخ الترجمة' : 'Copy'}
                      >
                        <Copy size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = deleteTranslationItem(item.id);
                          setHistoryItems(updated);
                        }}
                        className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                        title={isAr ? 'حذف' : 'Delete'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
