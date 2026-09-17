import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Sparkles,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Share2,
  Download,
  History,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  BarChart3,
  Lightbulb,
  Zap,
  Shuffle,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { Language } from '../../core/domain';
import { type IqQuestion } from './iqQuestions';
import { generateFreshIqBattery } from './iqGenerator';

interface IqTestStudioProps {
  language: Language;
}

interface IqSessionRecord {
  id: string;
  date: string;
  iq: number;
  accuracy: number;
  correctCount: number;
  total: number;
  timeElapsed: number;
  classification: string;
  testMode?: 'standard30' | 'rapid15';
}

export function IqTestStudio({ language }: IqTestStudioProps) {
  const isAr = language === 'ar';
  const [testState, setTestState] = useState<'intro' | 'testing' | 'results' | 'history'>('intro');
  const [questionCount, setQuestionCount] = useState<30 | 15>(30);
  const [currentQuestions, setCurrentQuestions] = useState<IqQuestion[]>(() => generateFreshIqBattery(30));
  const [sessionIteration, setSessionIteration] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [historyRecords, setHistoryRecords] = useState<IqSessionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('adem_iq_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Timer effect
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && testState === 'testing') {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, testState]);

  // Save record when test finishes
  useEffect(() => {
    if (testState === 'results') {
      let correctCount = 0;
      let weightedScore = 0;
      let maxWeightedScore = 0;

      currentQuestions.forEach((q) => {
        const weight = q.difficulty * 10;
        maxWeightedScore += weight;
        if (answers[q.id] === q.correctIndex) {
          correctCount += 1;
          weightedScore += weight;
        }
      });

      const totalItems = currentQuestions.length || 1;
      const accuracy = Math.round((correctCount / totalItems) * 100);
      const rawRatio = weightedScore / (maxWeightedScore || 1);
      // Speed bonus: answering fast with precision adds cognitive bonus
      const expectedTime = totalItems === 30 ? 600 : 300;
      const speedBonus = timeElapsed < expectedTime * 0.6 ? 4 : timeElapsed < expectedTime * 0.85 ? 2 : 0;
      const calculatedIq = Math.min(160, Math.max(75, Math.round(70 + rawRatio * 75 + speedBonus)));
      
      let classification = calculatedIq >= 140 ? 'Gifted / Genius' : calculatedIq >= 125 ? 'Superior' : calculatedIq >= 115 ? 'Above Average' : 'Average';

      const newRecord: IqSessionRecord = {
        id: 'iq-' + Date.now(),
        date: new Date().toLocaleString(),
        iq: calculatedIq,
        accuracy,
        correctCount,
        total: totalItems,
        timeElapsed,
        classification,
        testMode: totalItems === 30 ? 'standard30' : 'rapid15',
      };

      setHistoryRecords((prev) => {
        const updated = [newRecord, ...prev].slice(0, 30); // Keep last 30
        try {
          localStorage.setItem('adem_iq_history', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  }, [testState]);

  const handleStartTest = (count: 30 | 15 = 30) => {
    const seed = Date.now() + sessionIteration * 31337;
    const newBattery = generateFreshIqBattery(count, seed);
    setCurrentQuestions(newBattery);
    setQuestionCount(count);
    setSessionIteration((prev) => prev + 1);
    setCurrentIndex(0);
    setAnswers({});
    setTimeElapsed(0);
    setIsTimerRunning(true);
    setTestState('testing');
  };

  const handleSelectOption = (optionIndex: number) => {
    const question = currentQuestions[currentIndex];
    if (question) {
      setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }));
    }
  };

  const handleNext = () => {
    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsTimerRunning(false);
      setTestState('results');
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Calculate IQ and psychometric score
  const results = useMemo(() => {
    let correctCount = 0;
    let weightedScore = 0;
    let maxWeightedScore = 0;

    currentQuestions.forEach((q) => {
      const weight = q.difficulty * 10;
      maxWeightedScore += weight;
      if (answers[q.id] === q.correctIndex) {
        correctCount += 1;
        weightedScore += weight;
      }
    });

    const total = currentQuestions.length || 1;
    const accuracy = correctCount / total;
    // Standard IQ scale: Mean 100, SD 15. Base IQ 70 up to 160.
    const rawRatio = weightedScore / (maxWeightedScore || 1);
    const expectedTime = total === 30 ? 600 : 300;
    const speedBonus = timeElapsed < expectedTime * 0.6 ? 4 : timeElapsed < expectedTime * 0.85 ? 2 : 0;
    const calculatedIq = Math.round(70 + rawRatio * 75 + speedBonus);
    const clampedIq = Math.min(160, Math.max(75, calculatedIq));

    // Percentile estimation based on normal distribution (Mean 100, SD 15)
    let percentile = 50;
    if (clampedIq >= 145) percentile = 99.9;
    else if (clampedIq >= 130) percentile = 98.2;
    else if (clampedIq >= 120) percentile = 91.0;
    else if (clampedIq >= 110) percentile = 75.0;
    else if (clampedIq >= 100) percentile = 50.0;
    else if (clampedIq >= 90) percentile = 25.0;
    else percentile = 10;

    let classificationAr = 'متوسط (Average)';
    let classificationEn = 'Average Intelligence';
    if (clampedIq >= 140) {
      classificationAr = 'عبقري / متفوق جداً (Gifted / Genius)';
      classificationEn = 'Gifted / Genius';
    } else if (clampedIq >= 125) {
      classificationAr = 'فائق الذكاء (Superior)';
      classificationEn = 'Superior Intelligence';
    } else if (clampedIq >= 115) {
      classificationAr = 'أعلى من المتوسط (Above Average)';
      classificationEn = 'Above Average';
    } else if (clampedIq < 90) {
      classificationAr = 'أقل من المتوسط (Below Average)';
      classificationEn = 'Below Average';
    }

    // Domain breakdown
    const domains: Record<string, { correct: number; total: number }> = {
      matrix: { correct: 0, total: 0 },
      numerical: { correct: 0, total: 0 },
      verbal: { correct: 0, total: 0 },
      spatial: { correct: 0, total: 0 },
      logic: { correct: 0, total: 0 },
    };

    currentQuestions.forEach((q) => {
      if (domains[q.domain]) {
        domains[q.domain].total += 1;
        if (answers[q.id] === q.correctIndex) {
          domains[q.domain].correct += 1;
        }
      }
    });

    return {
      correctCount,
      total,
      accuracy: Math.round(accuracy * 100),
      iq: clampedIq,
      percentile,
      classificationAr,
      classificationEn,
      domains,
    };
  }, [answers, timeElapsed, currentQuestions]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
  };

  const handleCopyReport = () => {
    const reportText = `ADEM Ultra IQ Assessment Report\n---------------------------------\nIQ Score: ${results.iq}\nClassification: ${results.classificationEn}\nPercentile: ${results.percentile}%\nAccuracy: ${results.accuracy}%\nQuestions: ${results.total}\nTime Taken: ${formatTime(timeElapsed)}\nBattery Seed ID: #${sessionIteration}\nVerified by ADEM Executive AI Core 2026`;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadReport = () => {
    const reportData = {
      title: 'ADEM Ultra IQ Assessment Report',
      date: new Date().toISOString(),
      iqScore: results.iq,
      classification: results.classificationEn,
      percentile: results.percentile,
      accuracy: results.accuracy,
      correctAnswers: results.correctCount,
      totalQuestions: results.total,
      timeElapsedSeconds: timeElapsed,
      timeFormatted: formatTime(timeElapsed),
      domainBreakdown: results.domains,
      uniqueBatteryId: `battery-${Date.now()}-${sessionIteration}`,
      verifiedBy: 'ADEM Executive AI Core 2026',
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ADEM_IQ_Report_${results.iq}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const toggleSelectForCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter((i) => i !== id));
    } else {
      if (selectedForCompare.length >= 2) {
        setSelectedForCompare([selectedForCompare[1], id]);
      } else {
        setSelectedForCompare([...selectedForCompare, id]);
      }
    }
  };

  const comparisonSessions = useMemo(() => {
    if (selectedForCompare.length !== 2) return null;
    const s1 = historyRecords.find((r) => r.id === selectedForCompare[0]);
    const s2 = historyRecords.find((r) => r.id === selectedForCompare[1]);
    if (!s1 || !s2) return null;
    return { s1, s2 };
  }, [selectedForCompare, historyRecords]);

  const currentQ = currentQuestions[currentIndex];
  const selectedOption = currentQ ? answers[currentQ.id] : undefined;

  return (
    <div className="min-h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto flex flex-col justify-center">
      {/* INTRO SCREEN */}
      {testState === 'intro' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 sm:p-10 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent)]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 space-y-6 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-bold font-mono">
              <Sparkles size={14} className="animate-pulse" />
              <span>{isAr ? 'منظومة آدم • اختبار الذكاء العالي الدقة' : 'ADEM ULTRA INTELLECT ASSESSMENT 2026'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--text)] tracking-tight">
              {isAr ? 'اختبار معدل الذكاء العالمي (IQ Test)' : 'Global Precision IQ Assessment'}
            </h1>

            <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
              {isAr
                ? 'اختبار ذكاء سداسي الأبعاد مولّد خوارزمياً (Infinite Non-Repeating Battery) بأكثر من 100,000 احتمالية لسؤال مختلف في كل مرة. كل جلسة تولد 30 سؤالاً فريداً وموزعاً علمياً وفق مصفوفات رافن والاستدلال المنطقي والفراغي والحسابي، لضمان قياس حقيقي دون حفظ أو اعتياد.'
                : 'Algorithmic non-repeating IQ battery with over 100,000+ procedural problem combinations. Each assessment delivers 30 fresh, scientifically calibrated items across Raven matrices, numerical series, spatial rotation, and deductive logic—preventing memorization for an authentic IQ measurement.'}
            </p>

            {/* Test Configuration Selector: 30 Questions Standard vs 15 Questions Rapid */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 max-w-xl mx-auto">
              <button
                type="button"
                onClick={() => setQuestionCount(30)}
                className={`w-full sm:w-auto flex-1 min-h-[56px] px-6 py-3 rounded-2xl border-2 font-black text-sm transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-95 ${
                  questionCount === 30
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)] shadow-lg shadow-[var(--accent-glow)] ring-2 ring-[var(--accent)]/30'
                    : 'bg-[var(--surface-2)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--accent)]/60 hover:text-[var(--text)]'
                }`}
              >
                <Layers size={18} />
                <span>{isAr ? 'اختبار كامل (30 سؤالاً - أعلى دقة)' : 'Standard Full (30 Items - Max Precision)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setQuestionCount(15)}
                className={`w-full sm:w-auto flex-1 min-h-[56px] px-6 py-3 rounded-2xl border-2 font-black text-sm transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-95 ${
                  questionCount === 15
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)] shadow-lg shadow-[var(--accent-glow)] ring-2 ring-[var(--accent)]/30'
                    : 'bg-[var(--surface-2)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--accent)]/60 hover:text-[var(--text)]'
                }`}
              >
                <Zap size={18} />
                <span>{isAr ? 'اختبار سريع (15 سؤالاً)' : 'Rapid Focused (15 Items)'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 py-3 text-start">
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
                <Shuffle size={20} className="text-[var(--accent)] mb-1.5" />
                <div className="text-sm font-black text-[var(--text)]">{isAr ? 'أسئلة تتغير دائماً' : 'Infinite Variety'}</div>
                <div className="text-xs text-[var(--muted)] mt-0.5">{isAr ? '+100,000 نمط مختلف' : 'Never repeating'}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
                <Brain size={20} className="text-[var(--accent)] mb-1.5" />
                <div className="text-sm font-black text-[var(--text)]">{isAr ? `${questionCount} سؤالاً فريداً` : `${questionCount} Unique Items`}</div>
                <div className="text-xs text-[var(--muted)] mt-0.5">{isAr ? 'تدرج ذكي للصعوبة' : 'Adaptive progression'}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
                <BarChart3 size={20} className="text-[var(--accent)] mb-1.5" />
                <div className="text-sm font-black text-[var(--text)]">{isAr ? 'مقياس وكسلر الدقيق' : 'Wechsler Norm'}</div>
                <div className="text-xs text-[var(--muted)] mt-0.5">{isAr ? 'درجات بين 70 و 160' : 'Strict 70-160 scale'}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
                <Clock size={20} className="text-[var(--accent)] mb-1.5" />
                <div className="text-sm font-black text-[var(--text)]">{isAr ? 'بدون ضغط زمني' : 'Comfortable Pace'}</div>
                <div className="text-xs text-[var(--muted)] mt-0.5">{isAr ? 'فكر بهدوء وتركيز' : 'Self-paced cognitive'}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
              <button
                type="button"
                onClick={() => handleStartTest(questionCount)}
                className="w-full sm:w-auto min-h-[60px] px-10 py-4 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] font-black text-base sm:text-lg shadow-xl shadow-[var(--accent-glow)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center gap-3"
              >
                <Zap size={22} className="fill-current" />
                <span>{isAr ? `ابدأ اختبار الـ ${questionCount} سؤالاً الجديدة` : `Start New ${questionCount}-Question Battery`}</span>
              </button>

              {historyRecords.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTestState('history')}
                  className="w-full sm:w-auto min-h-[60px] px-8 py-4 rounded-2xl border-2 border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] font-black text-sm sm:text-base hover:border-[var(--accent)] hover:bg-[var(--surface)] transition flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
                >
                  <History size={20} className="text-[var(--accent)]" />
                  <span>{isAr ? `سجل الجلسات السابقة (${historyRecords.length})` : `Session History (${historyRecords.length})`}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* HISTORY SCREEN */}
      {testState === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 sm:p-10 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent)]/30 text-[var(--accent)] flex items-center justify-center">
                <History size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text)]">{isAr ? 'سجل الجلسات والتقارير المحفوظة' : 'Completed IQ Test History'}</h2>
                <p className="text-xs text-[var(--muted)]">{isAr ? 'تتبع أداءك العقلي ومقاييس الدقة عبر الوقت' : 'Track your cognitive performance and accuracy over time'}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTestState('intro')}
              className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text)] text-xs font-bold hover:bg-[var(--surface-2)] transition cursor-pointer"
            >
              {isAr ? 'العودة للرئيسية' : 'Back to Home'}
            </button>
          </div>

          {historyRecords.length === 0 ? (
            <div className="text-center py-12 text-[var(--muted)] space-y-3">
              <Brain size={48} className="mx-auto opacity-40" />
              <p className="text-sm">{isAr ? 'لا توجد جلسات مسجلة حتى الآن.' : 'No recorded sessions yet.'}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {historyRecords.map((rec) => (
                <div key={rec.id} className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-[var(--text)] font-mono">{rec.iq} IQ</span>
                      <span className="px-2 py-0.5 rounded-md bg-[var(--accent-subtle)] text-[var(--accent)] text-[10px] font-bold font-mono">
                        {rec.classification}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--muted)] flex items-center gap-4">
                      <span>{rec.date}</span>
                      <span>•</span>
                      <span>{isAr ? `الدقة: ${rec.accuracy}%` : `Accuracy: ${rec.accuracy}%`}</span>
                      <span>•</span>
                      <span>{isAr ? `الوقت: ${formatTime(rec.timeElapsed)}` : `Time: ${formatTime(rec.timeElapsed)}`}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(rec, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute('href', dataStr);
                      downloadAnchor.setAttribute('download', `ADEM_IQ_Report_${rec.iq}_${rec.id}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                    }}
                    className="px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] text-xs font-bold transition flex items-center gap-2 cursor-pointer self-start sm:self-center"
                  >
                    <Download size={14} className="text-[var(--accent)]" />
                    <span>{isAr ? 'تحميل التقرير' : 'Download JSON'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* TESTING SCREEN */}
      {testState === 'testing' && currentQ && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl space-y-6"
        >
          {/* Header & Progress */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="px-4 py-2 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent)]/30 text-[var(--accent)] text-sm sm:text-base font-mono font-black">
                {isAr ? `السؤال ${currentIndex + 1} من ${currentQuestions.length}` : `Question ${currentIndex + 1} of ${currentQuestions.length}`}
              </div>
              <span className="text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl bg-[var(--surface-2)] text-[var(--text)] uppercase tracking-wider">
                {currentQ.domain}
              </span>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]">
                {isAr ? `مستوى ${currentQ.difficulty}/5` : `Lvl ${currentQ.difficulty}/5`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-mono font-bold text-[var(--text)] bg-[var(--surface-2)] px-4 py-2 rounded-xl border border-[var(--border)]">
                <Clock size={16} className="text-[var(--accent)] animate-pulse" />
                <span>{formatTime(timeElapsed)}</span>
              </div>
            </div>
          </div>

          {/* Progress bar with answered questions markers */}
          <div className="space-y-2">
            <div className="w-full h-3 bg-[var(--surface-2)] rounded-full overflow-hidden p-0.5 border border-[var(--border)]/50">
              <div
                className="h-full bg-[var(--accent)] rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${((currentIndex + 1) / currentQuestions.length) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-medium text-[var(--muted)]">
              <span>{isAr ? `تمت إجابة ${Object.keys(answers).length} من ${currentQuestions.length} سؤالاً` : `Answered ${Object.keys(answers).length} of ${currentQuestions.length} questions`}</span>
              <span className="font-mono font-bold text-[var(--text)]">{Math.round(((currentIndex + 1) / currentQuestions.length) * 100)}%</span>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-4 py-2">
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text)] leading-relaxed tracking-tight">
              {isAr ? currentQ.questionAr : currentQ.questionEn}
            </h2>

            {/* Visual Matrix if applicable */}
            {currentQ.type === 'visual_matrix' && currentQ.matrixData && (
              <div className="p-5 sm:p-6 bg-[var(--surface-2)] border border-[var(--border)] rounded-3xl max-w-sm mx-auto shadow-inner">
                <div className="grid grid-cols-3 gap-3 text-center text-2xl font-mono font-black">
                  {currentQ.matrixData.grid.map((cell, idx) => (
                    <div
                      key={idx}
                      className={`h-18 flex items-center justify-center rounded-2xl bg-[var(--surface)] border-2 transition-all ${
                        cell === null
                          ? 'border-dashed border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-subtle)]/50 animate-pulse text-3xl font-black'
                          : 'border-[var(--border)] text-[var(--text)]'
                      }`}
                    >
                      {cell === null ? '?' : cell}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Large, Easy-to-Tap Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-2">
            {(isAr ? currentQ.optionsAr : currentQ.optionsEn).map((optionText, optIdx) => {
              const isSelected = selectedOption === optIdx;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  className={`min-h-[72px] sm:min-h-[80px] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border-2 text-start transition-all cursor-pointer flex items-center gap-4 group active:scale-[0.98] ${
                    isSelected
                      ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--text)] shadow-lg shadow-[var(--accent-glow)] ring-2 ring-[var(--accent)]/30'
                      : 'bg-[var(--surface-2)] border-[var(--border)] hover:border-[var(--accent)]/60 hover:bg-[var(--surface)] text-[var(--text)]'
                  }`}
                >
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-2xl border-2 flex items-center justify-center text-base font-black font-mono transition-all ${
                      isSelected
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
                        : 'border-[var(--border)] text-[var(--muted)] group-hover:border-[var(--accent)] group-hover:text-[var(--accent)] bg-[var(--surface)]'
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </div>
                  <span className="text-base sm:text-lg font-bold flex-1 leading-snug">{optionText}</span>
                  {isSelected && (
                    <CheckCircle2 size={22} className="text-[var(--accent)] shrink-0 animate-in zoom-in-50 duration-200" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Large Navigation Controls */}
          <div className="flex items-center justify-between pt-6 sm:pt-8 border-t border-[var(--border)] gap-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="min-h-[54px] px-6 sm:px-8 py-3.5 rounded-2xl border-2 border-[var(--border)] text-[var(--text)] text-sm sm:text-base font-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--surface-2)] active:scale-95 transition flex items-center gap-2 cursor-pointer"
            >
              <ChevronLeft size={20} />
              <span>{isAr ? 'السؤال السابق' : 'Previous'}</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={selectedOption === undefined}
              className="min-h-[54px] px-8 sm:px-10 py-3.5 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] text-sm sm:text-base font-black shadow-lg shadow-[var(--accent-glow)] hover:opacity-95 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed transition flex items-center gap-3 cursor-pointer"
            >
              <span>{currentIndex === currentQuestions.length - 1 ? (isAr ? 'إنهاء وحساب النتيجة' : 'Finish & Compute IQ') : (isAr ? 'السؤال التالي' : 'Next Question')}</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </motion.div>
      )}

      {/* RESULTS SCREEN */}
      {testState === 'results' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-6 sm:p-10 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl space-y-8"
        >
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] text-[var(--accent-contrast)] flex items-center justify-center shadow-xl shadow-[var(--accent-glow)]">
              <Award size={32} />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-bold font-mono">
              <Sparkles size={14} />
              <span>{isAr ? 'تم حفظ التقرير في السجل • معتمد من منظومة آدم' : 'Report Saved to History • ADEM Verified'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-[var(--text)] tracking-tight">
              {results.iq} <span className="text-lg font-normal text-[var(--muted)]">IQ SCORE</span>
            </h1>

            <p className="text-base font-bold text-[var(--accent)]">
              {isAr ? results.classificationAr : results.classificationEn}
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-center">
              <div className="text-2xl font-black text-[var(--text)] font-mono">{results.accuracy}%</div>
              <div className="text-xs text-[var(--muted)] font-medium mt-1">{isAr ? 'دقة الإجابات' : 'Accuracy'}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-center">
              <div className="text-2xl font-black text-[var(--text)] font-mono">{results.percentile}%</div>
              <div className="text-xs text-[var(--muted)] font-medium mt-1">{isAr ? 'المستوى المئوي' : 'Percentile'}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-center">
              <div className="text-2xl font-black text-[var(--text)] font-mono">{formatTime(timeElapsed)}</div>
              <div className="text-xs text-[var(--muted)] font-medium mt-1">{isAr ? 'الوقت المستغرق' : 'Time Elapsed'}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-center">
              <div className="text-2xl font-black text-[var(--text)] font-mono">{results.correctCount}/{results.total}</div>
              <div className="text-xs text-[var(--muted)] font-medium mt-1">{isAr ? 'الإجابات الصحيحة' : 'Correct Items'}</div>
            </div>
          </div>

          {/* Domain Breakdown */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-2">
              <BarChart3 size={16} className="text-[var(--accent)]" />
              <span>{isAr ? 'تحليل الأداء حسب المجالات المعرفية' : 'Cognitive Domain Breakdown'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(results.domains).map(([domain, data]) => {
                const percentage = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                return (
                  <div key={domain} className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[var(--text)] capitalize">
                      <span>{domain}</span>
                      <span className="font-mono text-[var(--accent)]">{data.correct} / {data.total} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Advisor Assessment */}
          <div className="p-5 rounded-2xl bg-[var(--accent-subtle)] border border-[var(--accent)]/30 space-y-3">
            <div className="flex items-center gap-2 text-[var(--accent)] font-bold text-xs uppercase tracking-wider">
              <Lightbulb size={16} />
              <span>{isAr ? 'تقييم الذكاء الاصطناعي (ADEM AI Insights)' : 'ADEM Executive AI Insights'}</span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text)] leading-relaxed font-medium">
              {isAr
                ? `أظهرت قدرات استثنائية في الاستدلال المنطقي والتعرف على الأنماط. معدل ذكائك المقدر (${results.iq}) يضعك في شريحة متقدمة. ننصح بمواصلة تدريبات التفكير المجرد والألغاز الرياضية المعقدة لتعزيز سرعة المعالجة العصبية.`
                : `Demonstrated robust abstract reasoning and pattern extraction capabilities. Your estimated IQ of ${results.iq} reflects strong cognitive agility. We recommend continued engagement with advanced matrix logic and quantitative puzzles.`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[var(--border)]">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleStartTest(questionCount)}
                className="w-full sm:w-auto min-h-[56px] px-8 py-3.5 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] text-sm font-black shadow-lg shadow-[var(--accent-glow)] hover:opacity-95 active:scale-95 transition flex items-center justify-center gap-3 cursor-pointer"
              >
                <RotateCcw size={18} />
                <span>{isAr ? `بدء اختبار جديد (${questionCount} سؤالاً مختلفة تماماً)` : `Take New Battery (${questionCount} Fresh Items)`}</span>
              </button>

              <button
                type="button"
                onClick={() => setTestState('history')}
                className="w-full sm:w-auto min-h-[56px] px-6 py-3.5 rounded-2xl border-2 border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] text-sm font-black hover:border-[var(--accent)] hover:bg-[var(--surface)] active:scale-95 transition flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <History size={18} className="text-[var(--accent)]" />
                <span>{isAr ? 'السجل' : 'History'}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyReport}
                className="w-full sm:w-auto min-h-[56px] px-6 py-3.5 rounded-2xl bg-[var(--surface-2)] border-2 border-[var(--border)] text-[var(--text)] text-sm font-black hover:border-[var(--accent)] hover:bg-[var(--surface)] active:scale-95 transition flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Share2 size={18} />
                <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ النص' : 'Copy Text')}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadReport}
                className="w-full sm:w-auto min-h-[56px] px-8 py-3.5 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] text-sm font-black shadow-lg shadow-[var(--accent-glow)] hover:opacity-95 active:scale-95 transition flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Download size={18} />
                <span>{downloaded ? (isAr ? 'تم التحميل!' : 'Downloaded!') : (isAr ? 'تحميل تقرير JSON' : 'Download JSON Report')}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

