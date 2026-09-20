import { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  BookOpen,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calculator,
  Copy,
  Check,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Eye,
  EyeOff,
  HelpCircle,
  Timer,
  ChevronRight,
  Bookmark,
} from 'lucide-react';
import type { ViewId } from '../../core/domain';

export interface AcademicCardPayload {
  type: 'formula' | 'mistake_analysis' | 'study_plan' | 'quiz' | 'research_sources';
  stage?: 'primary' | 'middle' | 'secondary' | 'university' | string;
  subject?: string;
  title?: string;
  // Formula data
  formula?: string;
  explanation?: string;
  variables?: Array<{ symbol: string; meaning: string; unit?: string }>;
  example?: string;
  // Mistake data
  studentMistake?: string;
  rootCause?: string;
  correctApproach?: string;
  goldenRule?: string;
  // Study plan data
  schedule?: Array<{ time: string; activity: string; subject?: string; focus?: string }>;
  targetExam?: string;
  // Quiz data
  question?: string;
  options?: string[];
  correctAnswer?: string;
  explanationNotes?: string;
  // Sources data
  sources?: Array<{ title: string; authors?: string[]; year?: number | string; url?: string; venue?: string }>;
}

interface AcademicCardProps {
  data: AcademicCardPayload;
  language: 'ar' | 'en';
  onNavigateView?: (view: ViewId, extraParam?: string) => void;
}

export function AcademicCard({ data, language, onNavigateView }: AcademicCardProps) {
  const isAr = language === 'ar';
  const [copied, setCopied] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // In-card Mini Pomodoro timer
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (pomodoroActive) {
      timerRef.current = setInterval(() => {
        setPomodoroSeconds((prev) => {
          if (prev <= 1) {
            setPomodoroActive(false);
            // Play notification tone
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
              osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
              gain.gain.setValueAtTime(0.2, ctx.currentTime);
              gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
              osc.start();
              osc.stop(ctx.currentTime + 0.4);
            } catch {}
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pomodoroActive]);

  const copyText = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStageBadge = (stage?: string) => {
    if (!stage) return null;
    const s = stage.toLowerCase();
    if (s.includes('primary') || s.includes('ابتدائي')) {
      return { text: isAr ? 'الطور الابتدائي' : 'Elementary', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    }
    if (s.includes('middle') || s.includes('متوسط') || s.includes('bem')) {
      return { text: isAr ? 'المتوسط (BEM)' : 'Middle School', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    }
    if (s.includes('secondary') || s.includes('ثانوي') || s.includes('bac') || s.includes('بكالوريا')) {
      return { text: isAr ? 'الثانوي (البكالوريا)' : 'High School (BAC)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    }
    if (s.includes('uni') || s.includes('جامع') || s.includes('بحث')) {
      return { text: isAr ? 'الجامعي والبحث العلمي' : 'University & Research', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    }
    return { text: stage, color: 'bg-slate-700/50 text-slate-300 border-slate-600' };
  };

  const stageBadge = getStageBadge(data.stage);

  return (
    <div className="my-3 w-full rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900/95 via-slate-950/90 to-indigo-950/40 p-4 shadow-xl backdrop-blur-md transition-all hover:border-indigo-500/50">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30 shadow-inner">
            {data.type === 'formula' ? (
              <Calculator size={18} />
            ) : data.type === 'mistake_analysis' ? (
              <AlertTriangle size={18} className="text-amber-400" />
            ) : data.type === 'study_plan' ? (
              <Clock size={18} className="text-cyan-400" />
            ) : data.type === 'quiz' ? (
              <HelpCircle size={18} className="text-emerald-400" />
            ) : (
              <GraduationCap size={18} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wide text-indigo-300 uppercase">
                {data.type === 'formula'
                  ? isAr ? 'كناش القوانين الأكاديمي' : 'Formula Sheet'
                  : data.type === 'mistake_analysis'
                  ? isAr ? 'عيادة تشخيص الأخطاء' : 'Mistake Clinic'
                  : data.type === 'study_plan'
                  ? isAr ? 'خطة المذاكرة الذكية' : 'Strategic Study Plan'
                  : data.type === 'quiz'
                  ? isAr ? 'تثبيت الفهم اللحظي' : 'Concept Check'
                  : isAr ? 'مراجع بحثية موثقة' : 'Scholarly Sources'}
              </span>
              {stageBadge && (
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${stageBadge.color}`}>
                  {stageBadge.text}
                </span>
              )}
            </div>
            <h4 className="text-sm font-semibold text-slate-100">
              {data.title || (data.type === 'formula' ? data.formula : data.subject || (isAr ? 'المرافق الأكاديمي' : 'Academic Companion'))}
            </h4>
          </div>
        </div>

        {/* Header Action: Quick open Academic Hub Modal */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('adam_open_academic_modal'));
            }
          }}
          className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-indigo-300 transition hover:bg-indigo-500/20 hover:text-white cursor-pointer"
          title={isAr ? 'فتح المكتبة والأكاديمية المدمجة' : 'Open Academic Hub'}
        >
          <BookOpen size={13} />
          <span>{isAr ? 'المكتبة والأكاديمية' : 'Academic Hub'}</span>
        </button>
      </div>

      {/* Card Body - Varies by Type */}
      <div className="mt-3 space-y-3">
        {/* 1. FORMULA CARD */}
        {data.type === 'formula' && (
          <div className="space-y-3">
            {data.formula && (
              <div className="relative rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-3 text-center shadow-inner">
                <code className="text-base font-bold font-mono tracking-wider text-emerald-300 sm:text-lg">
                  {data.formula}
                </code>
                <button
                  type="button"
                  onClick={() => copyText(data.formula!)}
                  className="absolute top-2.5 end-2.5 rounded-md bg-slate-800/80 p-1.5 text-slate-400 hover:text-white"
                  title={isAr ? 'نسخ المعادلة' : 'Copy formula'}
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            )}

            {data.explanation && (
              <p className="text-xs leading-relaxed text-slate-300">
                <span className="font-semibold text-indigo-300">{isAr ? '💡 الشرح المفاهيمي: ' : '💡 Explanation: '}</span>
                {data.explanation}
              </p>
            )}

            {data.example && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-2.5 text-xs text-emerald-200">
                <span className="font-bold text-emerald-400">{isAr ? '📌 مثال تطبيقي عددي: ' : '📌 Worked Example: '}</span>
                {data.example}
              </div>
            )}

            {Array.isArray(data.variables) && data.variables.length > 0 && (
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {data.variables.map((v, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-2.5 py-1.5 text-xs">
                    <span className="font-mono font-bold text-indigo-300">{v.symbol}</span>
                    <span className="text-slate-300">{v.meaning}</span>
                    {v.unit && <span className="text-[10px] text-slate-400 font-mono">[{v.unit}]</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. MISTAKE ANALYSIS CLINIC */}
        {data.type === 'mistake_analysis' && (
          <div className="space-y-2.5">
            {data.studentMistake && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-2.5 text-xs text-rose-200">
                <div className="flex items-center gap-1.5 font-bold text-rose-400">
                  <AlertTriangle size={14} />
                  <span>{isAr ? 'الخطأ أو الفخ المرصود:' : 'Identified Mistake / Pitfall:'}</span>
                </div>
                <p className="mt-1 leading-relaxed">{data.studentMistake}</p>
              </div>
            )}

            {data.rootCause && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-2.5 text-xs text-amber-200">
                <span className="font-bold text-amber-400">{isAr ? '🔍 سبب الوقوع في الفخ: ' : '🔍 Root Cause: '}</span>
                {data.rootCause}
              </div>
            )}

            {data.correctApproach && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-2.5 text-xs text-emerald-200">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <CheckCircle2 size={14} />
                  <span>{isAr ? 'التصحيح المنهجي النموذجي:' : 'Correct Methodological Approach:'}</span>
                </div>
                <p className="mt-1 leading-relaxed">{data.correctApproach}</p>
              </div>
            )}

            {data.goldenRule && (
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-2.5 text-xs text-indigo-200">
                <span className="font-bold text-indigo-400">{isAr ? '⭐ الشفرة الذهبية لتفادي الخطأ: ' : '⭐ Golden Exam Anchor: '}</span>
                {data.goldenRule}
              </div>
            )}
          </div>
        )}

        {/* 3. STUDY PLAN CARD */}
        {data.type === 'study_plan' && (
          <div className="space-y-2.5">
            {data.targetExam && (
              <div className="text-xs font-semibold text-cyan-300">
                {isAr ? `🎯 الهدف الاستراتيجي: ${data.targetExam}` : `🎯 Strategic Goal: ${data.targetExam}`}
              </div>
            )}
            {Array.isArray(data.schedule) && data.schedule.length > 0 && (
              <div className="space-y-1.5">
                {data.schedule.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl bg-slate-800/60 p-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-400">{item.time}</span>
                      <span className="text-slate-200 font-medium">{item.activity}</span>
                    </div>
                    {item.subject && (
                      <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/20">
                        {item.subject}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. QUIZ / CONCEPT CHECK */}
        {data.type === 'quiz' && (
          <div className="space-y-2.5">
            {data.question && (
              <p className="text-xs font-semibold text-slate-200 leading-relaxed">
                {data.question}
              </p>
            )}

            {Array.isArray(data.options) && data.options.length > 0 && (
              <div className="space-y-1.5">
                {data.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedOption(idx)}
                      className={`w-full text-start rounded-xl p-2 text-xs font-medium transition border flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/20 text-white'
                          : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <Check size={14} className="text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowAnswer((prev) => !prev)}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
              >
                {showAnswer ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showAnswer ? (isAr ? 'إخفاء الإجابة والتعليل' : 'Hide Answer') : (isAr ? 'كشف الإجابة والتعليل المنهجي' : 'Reveal Answer & Reasoning')}</span>
              </button>
            </div>

            {showAnswer && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-2.5 text-xs text-emerald-200 animate-fadeIn">
                {data.correctAnswer && (
                  <div className="font-bold text-emerald-400 mb-1">
                    {isAr ? `✅ الإجابة الصحيحة: ${data.correctAnswer}` : `✅ Correct Answer: ${data.correctAnswer}`}
                  </div>
                )}
                {data.explanationNotes && <p className="leading-relaxed">{data.explanationNotes}</p>}
              </div>
            )}
          </div>
        )}

        {/* 5. RESEARCH SOURCES */}
        {data.type === 'research_sources' && Array.isArray(data.sources) && (
          <div className="space-y-2">
            {data.sources.map((src, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-800/40 p-2.5 text-xs">
                <a
                  href={src.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-indigo-300 hover:underline flex items-center gap-1"
                >
                  <span>{src.title}</span>
                  <ExternalLink size={12} className="inline flex-shrink-0" />
                </a>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                  {src.authors && <span>{src.authors.join(', ')}</span>}
                  {src.year && <span>({src.year})</span>}
                  {src.venue && <span className="text-slate-500">• {src.venue}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer: Interactive Tools (Pomodoro Mini Runner & Copy) */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-indigo-500/20 pt-2.5">
        {/* Pomodoro Timer Bar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPomodoroActive((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition shadow-sm ${
              pomodoroActive
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
            title={pomodoroActive ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'بدء جلسة تركيز بومودورو' : 'Start Pomodoro')}
          >
            {pomodoroActive ? <Pause size={13} /> : <Play size={13} />}
            <span className="font-mono">{formatTimer(pomodoroSeconds)}</span>
            <span className="hidden sm:inline text-[11px]">{isAr ? 'بومودورو 25د' : 'Pomodoro'}</span>
          </button>

          {pomodoroSeconds < 25 * 60 && (
            <button
              type="button"
              onClick={() => {
                setPomodoroActive(false);
                setPomodoroSeconds(25 * 60);
              }}
              className="rounded-lg p-1 text-slate-400 hover:text-white"
              title={isAr ? 'إعادة تعيين' : 'Reset'}
            >
              <RotateCcw size={12} />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const summary = data.type === 'formula' ? `${data.title || ''}\n${data.formula || ''}\n${data.explanation || ''}`
                : data.type === 'mistake_analysis' ? `Mistake: ${data.studentMistake}\nCorrection: ${data.correctApproach}\nRule: ${data.goldenRule}`
                : JSON.stringify(data, null, 2);
              copyText(summary);
            }}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
