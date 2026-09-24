import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Gauge,
  Zap,
  Activity,
  Cpu,
  Clock,
  Play,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  X,
  Sparkles,
  TrendingUp,
  Terminal,
  ShieldCheck,
  Sliders,
  History,
  Radio,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Language } from '../../core/domain';
import {
  executeSpeedTestStream,
  fetchSpeedTestInfo,
  getSpeedTestHistory,
  clearSpeedTestHistory,
  type SpeedTestPreset,
  type SpeedTestSummary,
  type SpeedTestResultRecord,
} from './speedTestClient';

function formatAdemModelName(modelIdOrName: string): string {
  if (!modelIdOrName) return 'ADEM-G 3.8 Flash';
  const clean = String(modelIdOrName).trim();
  if (clean.startsWith('ADEM-G')) return clean;

  const map: Record<string, string> = {
    'gemini-3.8-flash': 'ADEM-G 3.8 Flash',
    'gemini-3.1-flash-lite': 'ADEM-G 3.1 Flash Lite',
    'gemini-flash-latest': 'ADEM-G Flash Latest',
    'gemini-3.1-pro-preview': 'ADEM-G 3.1 Pro Preview',
    'gemini-2.5-flash': 'ADEM-G 2.5 Flash',
    'gemini-2.5-pro': 'ADEM-G 2.5 Pro',
    'gemini-3.6-flash': 'ADEM-G 3.6 Flash',
    'gemini-3.5-flash': 'ADEM-G 3.5 Flash',
    'gemini-3.5-flash-lite': 'ADEM-G 3.5 Flash Lite',
  };
  if (map[clean.toLowerCase()]) return map[clean.toLowerCase()];

  return clean
    .replace(/^gemini[- ]?/i, 'ADEM-G ')
    .replace(/gemini[- ]?/gi, 'ADEM-G ');
}

interface SpeedTestDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export function SpeedTestDiagnosticModal({
  isOpen,
  onClose,
  language,
}: SpeedTestDiagnosticModalProps) {
  const isAr = language === 'ar';

  const [presets, setPresets] = useState<SpeedTestPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('pulse');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  const [activeModel, setActiveModel] = useState<string>('ADEM-G 3.8 Flash');
  const [providerName, setProviderName] = useState<string>('ADEM-G');
  const [isConfigured, setIsConfigured] = useState<boolean>(true);

  // Live execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [liveTps, setLiveTps] = useState<number>(0);
  const [peakTps, setPeakTps] = useState<number>(0);
  const [tokensCount, setTokensCount] = useState<number>(0);
  const [ttftMs, setTtftMs] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [streamedText, setStreamedText] = useState<string>('');
  const [lastSummary, setLastSummary] = useState<SpeedTestSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // History & UI toggles
  const [history, setHistory] = useState<SpeedTestResultRecord[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'stream' | 'telemetry'>('stream');

  const abortControllerRef = useRef<AbortController | null>(null);
  const streamContainerRef = useRef<HTMLDivElement | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Initialize presets and provider info
  useEffect(() => {
    if (!isOpen) return;

    fetchSpeedTestInfo().then((info) => {
      if (info.presets?.length) setPresets(info.presets);
      if (info.activeModel) setActiveModel(formatAdemModelName(info.activeModel));
      if (info.provider) setProviderName(info.provider);
      setIsConfigured(info.configured);
    });

    setHistory(getSpeedTestHistory());
  }, [isOpen]);

  // Auto-scroll stream window
  useEffect(() => {
    if (streamContainerRef.current) {
      streamContainerRef.current.scrollTop = streamContainerRef.current.scrollHeight;
    }
  }, [streamedText]);

  // Clean up on unmount or close
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const selectedPreset = useMemo(() => {
    return presets.find((p) => p.id === selectedPresetId) || presets[0];
  }, [presets, selectedPresetId]);

  const activePrompt = useMemo(() => {
    if (isCustomMode && customPrompt.trim()) return customPrompt.trim();
    return selectedPreset?.prompt || '';
  }, [isCustomMode, customPrompt, selectedPreset]);

  const handleStartTest = async () => {
    if (isRunning) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsRunning(true);
    setErrorMessage(null);
    setStreamedText('');
    setTokensCount(0);
    setLiveTps(0);
    setPeakTps(0);
    setTtftMs(null);
    setElapsedMs(0);
    setLastSummary(null);

    const startTime = Date.now();
    timerIntervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 50);

    try {
      const summary = await executeSpeedTestStream(
        {
          presetId: isCustomMode ? undefined : selectedPresetId,
          customPrompt: isCustomMode ? customPrompt.trim() : undefined,
          model: activeModel,
        },
        {
          onFirstToken: (firstTokenMs) => {
            setTtftMs(firstTokenMs);
          },
          onChunk: (chunkData) => {
            setStreamedText(chunkData.accumulatedText);
            setTokensCount(chunkData.totalTokens);
            setLiveTps(chunkData.currentTps);
            setPeakTps((prev) => Math.max(prev, chunkData.currentTps));
          },
          onComplete: (completedSummary) => {
            setLastSummary(completedSummary);
            setLiveTps(completedSummary.averageTps);
            setPeakTps((prev) => Math.max(prev, completedSummary.peakTps));
            setTokensCount(completedSummary.totalTokens);
            setHistory(getSpeedTestHistory());
          },
          onError: (err) => {
            setErrorMessage(err.message);
          },
        },
        controller.signal
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setErrorMessage(err.message || 'Speed test benchmark interrupted.');
      }
    } finally {
      setIsRunning(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const handleAbortTest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsRunning(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  const handleCopyReport = () => {
    if (!lastSummary) return;
    const reportText = `[ADEM AI LLM Speed Test Report]
Timestamp: ${new Date().toISOString()}
Provider: ${lastSummary.provider}
Model: ${lastSummary.model}
Total Tokens: ${lastSummary.totalTokens}
Average TPS: ${lastSummary.averageTps} Tokens/sec
Peak TPS: ${lastSummary.peakTps} Tokens/sec
TTFT (Time to First Token): ${lastSummary.ttftMs}ms
Generation Time: ${(lastSummary.generationDurationMs / 1000).toFixed(2)}s
Total Latency: ${(lastSummary.totalDurationMs / 1000).toFixed(2)}s
Status: ${lastSummary.simulated ? 'Simulated Sandbox' : 'Verified Live Model'}`;

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  // Speed tier assessment
  const currentSpeed = lastSummary ? lastSummary.averageTps : liveTps;
  const speedTier = useMemo(() => {
    if (currentSpeed >= 70) {
      return {
        label: isAr ? 'فائق السرعة (Quantum Speed)' : 'Quantum Speed',
        color: 'text-cyan-400',
        badgeBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
        ringColor: '#06b6d4',
      };
    }
    if (currentSpeed >= 45) {
      return {
        label: isAr ? 'سرعة عالية (Hyper Speed)' : 'Hyper Speed',
        color: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
        ringColor: '#10b981',
      };
    }
    if (currentSpeed >= 25) {
      return {
        label: isAr ? 'تدفق مستقر (Solid Flow)' : 'Solid Flow',
        color: 'text-blue-400',
        badgeBg: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
        ringColor: '#3b82f6',
      };
    }
    return {
      label: isAr ? 'سرعة قياسية (Standard)' : 'Standard Rate',
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      ringColor: '#f59e0b',
    };
  }, [currentSpeed, isAr]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[var(--surface)] border border-[var(--border-strong)] shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm">
              <Gauge size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[var(--text)]">
                  {isAr ? 'لوحة فحص السرعة ومعدل توليد الرموز' : 'LLM Speed Test & Diagnostics'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  LIVE BENCHMARK
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                {isAr
                  ? 'قياس زمن الاستجابة الأول (TTFT) ومعدل الرموز في الثانية (Tokens/Sec) بدقة لحظية'
                  : 'Real-time measurement of TTFT latency and streaming tokens-per-second throughput'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                showHistory
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-[var(--surface-3)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--text)]'
              }`}
              title={isAr ? 'سجل الفحوصات السابقة' : 'Benchmark History'}
            >
              <History size={15} />
              <span className="hidden sm:inline">{isAr ? 'السجل' : 'History'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Active Model / Provider Summary Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Cpu size={14} className="text-cyan-400" />
                <span className="text-[var(--muted)]">{isAr ? 'المزود:' : 'Provider:'}</span>
                <span className="font-bold text-[var(--text)]">{providerName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Radio size={14} className="text-emerald-400 animate-pulse" />
                <span className="text-[var(--muted)]">{isAr ? 'النموذج:' : 'Model:'}</span>
                <span className="font-mono font-bold text-cyan-300">{activeModel}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${speedTier.badgeBg}`}>
                <Activity size={12} />
                <span>{speedTier.label}</span>
              </span>
            </div>
          </div>

          {/* Main Tachometer & Primary Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Speed Gauge Card */}
            <div className="relative flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-slate-900/60 to-slate-950/80 border border-cyan-500/20 shadow-lg overflow-hidden">
              {/* Glowing Background Radial */}
              <div className="absolute inset-0 bg-radial from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

              <span className="text-xs font-bold text-[var(--muted)] tracking-wider uppercase mb-1">
                {isAr ? 'معدل التوليد الحالي' : 'Generation Velocity'}
              </span>

              {/* Huge Numeric TPS Display */}
              <div className="flex items-baseline gap-1 my-2">
                <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white drop-shadow-md">
                  {currentSpeed > 0 ? currentSpeed.toFixed(1) : '0.0'}
                </span>
                <span className="text-sm sm:text-base font-bold text-cyan-400">
                  T/s
                </span>
              </div>

              <div className="text-xs font-mono text-[var(--muted)] flex items-center gap-3 mt-1">
                <span>{isAr ? 'الذروة:' : 'Peak:'} <b className="text-cyan-300">{peakTps.toFixed(1)} T/s</b></span>
                <span>•</span>
                <span>{isAr ? 'الحالة:' : 'Status:'} <b className={isRunning ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}>{isRunning ? (isAr ? 'جارٍ التدفق...' : 'Streaming...') : (lastSummary ? (isAr ? 'مكتمل' : 'Ready') : (isAr ? 'في الانتظار' : 'Idle'))}</b></span>
              </div>

              {/* Progress Arc Bar */}
              <div className="w-full mt-4 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                <div
                  className="h-full transition-all duration-300 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400"
                  style={{ width: `${Math.min(100, (currentSpeed / 120) * 100)}%` }}
                />
              </div>
            </div>

            {/* Key Telemetry Stats Grid (2 Cols) */}
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* TTFT Latency */}
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>{isAr ? 'زمن الاستجابة الأول' : 'TTFT Latency'}</span>
                  <Clock size={14} className="text-amber-400" />
                </div>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text)]">
                    {ttftMs !== null ? `${ttftMs}` : '—'}
                  </span>
                  <span className="text-xs text-[var(--muted)] ml-1">ms</span>
                </div>
                <p className="text-[10px] text-[var(--muted)]">
                  {isAr ? 'الوقت حتى أول رمز متدفق' : 'Time to first token response'}
                </p>
              </div>

              {/* Total Tokens */}
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>{isAr ? 'إجمالي الرموز' : 'Total Tokens'}</span>
                  <Sparkles size={14} className="text-cyan-400" />
                </div>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-cyan-300">
                    {tokensCount > 0 ? tokensCount : '0'}
                  </span>
                  <span className="text-xs text-[var(--muted)] ml-1">tokens</span>
                </div>
                <p className="text-[10px] text-[var(--muted)]">
                  {streamedText.length} {isAr ? 'محرف تم استلامه' : 'characters streamed'}
                </p>
              </div>

              {/* Generation Duration */}
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>{isAr ? 'زمن التوليد' : 'Duration'}</span>
                  <TimerIcon size={14} className="text-emerald-400" />
                </div>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text)]">
                    {lastSummary
                      ? (lastSummary.generationDurationMs / 1000).toFixed(2)
                      : (elapsedMs / 1000).toFixed(2)}
                  </span>
                  <span className="text-xs text-[var(--muted)] ml-1">sec</span>
                </div>
                <p className="text-[10px] text-[var(--muted)]">
                  {lastSummary ? (isAr ? 'مدة التدفق الفعلية' : 'Net streaming time') : (isAr ? 'الوقت المنقضي' : 'Elapsed time')}
                </p>
              </div>

              {/* Sustained Average TPS */}
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>{isAr ? 'المتوسط المستمر' : 'Avg Sustained'}</span>
                  <TrendingUp size={14} className="text-blue-400" />
                </div>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text)]">
                    {lastSummary ? lastSummary.averageTps.toFixed(1) : liveTps.toFixed(1)}
                  </span>
                  <span className="text-xs text-[var(--muted)] ml-1">T/s</span>
                </div>
                <p className="text-[10px] text-[var(--muted)]">
                  {isAr ? 'معدل المعالجة الصافي' : 'Net throughput rate'}
                </p>
              </div>

              {/* End-to-End Total Latency */}
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>{isAr ? 'الكمون الكلي' : 'Total Latency'}</span>
                  <Activity size={14} className="text-purple-400" />
                </div>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text)]">
                    {lastSummary ? `${lastSummary.totalDurationMs}` : `${elapsedMs}`}
                  </span>
                  <span className="text-xs text-[var(--muted)] ml-1">ms</span>
                </div>
                <p className="text-[10px] text-[var(--muted)]">
                  {isAr ? 'شامل الشبكة والمصافحة' : 'Includes network round-trip'}
                </p>
              </div>

              {/* Quality & Security Shield */}
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>{isAr ? 'درع الأمان' : 'Security Shield'}</span>
                  <ShieldCheck size={14} className="text-emerald-400" />
                </div>
                <div className="my-2">
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {isConfigured ? 'HARDENED' : 'SANDBOX'}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--muted)]">
                  {isAr ? 'حماية ضد تسريب البيانات' : 'Zero prompt leak protection'}
                </p>
              </div>
            </div>
          </div>

          {/* Test Suite Preset Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                <Sliders size={14} className="text-cyan-400" />
                <span>{isAr ? 'اختر معيار الاختبار المعياري:' : 'Select Benchmark Suite:'}</span>
              </label>

              <button
                type="button"
                onClick={() => setIsCustomMode(!isCustomMode)}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
              >
                {isCustomMode
                  ? (isAr ? '← الرجوع للقوالب الجاهزة' : '← Back to Presets')
                  : (isAr ? '✏️ إدخال موجه مخصص (Custom)' : '✏️ Custom Prompt')}
              </button>
            </div>

            {!isCustomMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {presets.map((preset) => {
                  const isSelected = preset.id === selectedPresetId;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={isRunning}
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                          : 'bg-[var(--surface-2)] border-[var(--border)] hover:border-slate-600 hover:bg-[var(--surface-hover)]'
                      } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-[var(--text)]">
                          {isAr ? preset.nameAr : preset.nameEn}
                        </span>
                        {isSelected && <CheckCircle2 size={13} className="text-cyan-400" />}
                      </div>
                      <p className="text-[10px] text-[var(--muted)] line-clamp-2 leading-relaxed">
                        {isAr ? preset.descriptionAr : preset.descriptionEn}
                      </p>
                      <div className="mt-2 text-[10px] font-mono text-cyan-400/80">
                        ~{preset.expectedTokens} tokens
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2 animate-fadeIn">
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder={
                    isAr
                      ? 'اكتب النص الذي تريد اختباره وقياس سرعة التوليد له...'
                      : 'Type a custom test prompt to benchmark...'
                  }
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-cyan-500 font-mono resize-none"
                />
              </div>
            )}
          </div>

          {/* Action Bar (Start / Stop / Copy Report) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              {!isRunning ? (
                <button
                  type="button"
                  onClick={handleStartTest}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
                >
                  <Play size={14} fill="currentColor" />
                  <span>{isAr ? 'بدء فحص السرعة' : 'Start Speed Test'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAbortTest}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 text-white font-bold text-xs shadow-lg hover:bg-rose-500 active:scale-95 transition-all cursor-pointer animate-pulse"
                >
                  <X size={14} />
                  <span>{isAr ? 'إيقاف الفحص' : 'Stop Benchmark'}</span>
                </button>
              )}

              <button
                type="button"
                disabled={isRunning || !lastSummary}
                onClick={handleCopyReport}
                className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl border text-xs font-semibold transition cursor-pointer ${
                  lastSummary
                    ? 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)]'
                    : 'opacity-40 cursor-not-allowed bg-[var(--surface-2)] border-[var(--border)] text-[var(--muted)]'
                }`}
              >
                {copiedReport ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedReport ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ التقرير' : 'Copy Report')}</span>
              </button>
            </div>

            {/* Output View Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('stream')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeTab === 'stream'
                    ? 'bg-[var(--surface-3)] text-cyan-300 shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <Terminal size={12} />
                <span>{isAr ? 'التدفق اللحظي' : 'Live Stream'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('telemetry')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeTab === 'telemetry'
                    ? 'bg-[var(--surface-3)] text-cyan-300 shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <Activity size={12} />
                <span>{isAr ? 'سجل التليمترية' : 'Raw Telemetry'}</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
              <X size={16} className="flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Stream Output Console */}
          <div className="rounded-2xl border border-[var(--border)] bg-slate-950 overflow-hidden shadow-inner flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 text-slate-300 font-semibold">
                  {activeTab === 'stream'
                    ? (isAr ? 'شاشة التدفق النصي المباشر' : 'Live Generation Console')
                    : (isAr ? 'كائن المقاييس الخام (JSON Metrics)' : 'Raw Metrics Object')}
                </span>
              </div>
              <span className="text-cyan-400 font-bold">
                {isRunning ? (isAr ? '⚡ جارٍ الاستقبال...' : '⚡ STREAMING ACTIVE') : (isAr ? 'جاهز' : 'IDLE')}
              </span>
            </div>

            <div
              ref={streamContainerRef}
              className="p-4 h-56 overflow-y-auto font-mono text-xs leading-relaxed text-slate-200 select-text"
              dir="ltr"
            >
              {activeTab === 'stream' ? (
                streamedText ? (
                  <div>
                    <span>{streamedText}</span>
                    {isRunning && <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse" />}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center space-y-2">
                    <Terminal size={24} className="opacity-40" />
                    <p className="text-xs">
                      {isAr
                        ? 'اضغط "بدء فحص السرعة" لإرسال الطلب وحساب سرعة الرموز لحظياً.'
                        : 'Click "Start Speed Test" to execute the benchmark request.'}
                    </p>
                  </div>
                )
              ) : (
                <pre className="text-[11px] text-cyan-300">
                  {JSON.stringify(
                    lastSummary || {
                      status: isRunning ? 'measuring' : 'ready',
                      liveTps,
                      peakTps,
                      tokensCount,
                      ttftMs,
                      elapsedMs,
                      activeModel,
                      providerName,
                    },
                    null,
                    2
                  )}
                </pre>
              )}
            </div>
          </div>

          {/* History Drawer */}
          {showHistory && (
            <div className="space-y-3 p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                  <History size={14} className="text-cyan-400" />
                  <span>{isAr ? 'سجل الفحوصات الأخيرة' : 'Recent Benchmark History'}</span>
                </h4>

                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearSpeedTestHistory();
                      setHistory([]);
                    }}
                    className="text-[10px] text-rose-400 hover:text-rose-300 transition cursor-pointer"
                  >
                    {isAr ? 'مسح السجل' : 'Clear History'}
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <p className="text-xs text-[var(--muted)] text-center py-3">
                  {isAr ? 'لا توجد فحوصات سابقة بعد.' : 'No benchmark records yet.'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[var(--muted)] font-mono">
                        <th className="py-1.5 px-2">{isAr ? 'الوقت' : 'Time'}</th>
                        <th className="py-1.5 px-2">{isAr ? 'النموذج' : 'Model'}</th>
                        <th className="py-1.5 px-2">{isAr ? 'السرعة' : 'Speed (TPS)'}</th>
                        <th className="py-1.5 px-2">{isAr ? 'الذروة' : 'Peak'}</th>
                        <th className="py-1.5 px-2">TTFT</th>
                        <th className="py-1.5 px-2">{isAr ? 'الرموز' : 'Tokens'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] font-mono">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-[var(--surface-hover)] transition">
                          <td className="py-2 px-2 text-[var(--muted)]">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2 px-2 text-[var(--text)] font-semibold">{item.model}</td>
                          <td className="py-2 px-2 text-cyan-400 font-bold">{item.averageTps} T/s</td>
                          <td className="py-2 px-2 text-emerald-400">{item.peakTps} T/s</td>
                          <td className="py-2 px-2 text-amber-300">{item.ttftMs}ms</td>
                          <td className="py-2 px-2 text-[var(--text)]">{item.totalTokens}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TimerIcon({ size = 14, className = '' }: { size?: number; className?: string }) {
  return <Clock size={size} className={className} />;
}
