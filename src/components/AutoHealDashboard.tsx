import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Code2,
  Cpu,
  FileCode,
  Flame,
  Gauge,
  Info,
  Layers,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Volume2,
  Wrench,
  Zap,
  Mail,
  Send,
  Lock,
  Terminal,
} from 'lucide-react';
import { AutoHealTelemetrySnapshot } from '../types';
import {
  loadAutoHealTelemetry,
  loadActivityLogs,
  clearAutoHealTelemetry,
} from '../lib/storage';
import { AutoHealEngine } from '../lib/autoHealEngine';
import { playAlertSound, triggerAlertVibration } from '../lib/alertFeedback';
import {
  CREATOR_DEVELOPER_EMAIL,
  getDeveloperErrorDispatches,
  sendTestDeveloperDiagnostic,
  clearDeveloperDispatches,
  DeveloperErrorReport,
} from '../lib/developerErrorReporting';

interface AutoHealDashboardProps {
  isArabic: boolean;
  onOpenSettings?: () => void;
}

export const AutoHealDashboard: React.FC<AutoHealDashboardProps> = ({
  isArabic,
  onOpenSettings,
}) => {
  const [telemetry, setTelemetry] = useState<AutoHealTelemetrySnapshot[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | 'all'>('24h');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [developerDispatches, setDeveloperDispatches] = useState<DeveloperErrorReport[]>([]);
  const [isSendingTestAlert, setIsSendingTestAlert] = useState(false);
  const [testAlertStatus, setTestAlertStatus] = useState<string | null>(null);

  const reloadData = () => {
    setTelemetry(loadAutoHealTelemetry());
    setDeveloperDispatches(getDeveloperErrorDispatches());
  };

  const handleSendTestAlert = async () => {
    setIsSendingTestAlert(true);
    setTestAlertStatus(null);
    try {
      const res = await sendTestDeveloperDiagnostic(isArabic);
      setTestAlertStatus(res.message);
      setDeveloperDispatches(getDeveloperErrorDispatches());
      setTimeout(() => setTestAlertStatus(null), 6000);
    } catch (e: any) {
      setTestAlertStatus(e?.message || 'Error');
    } finally {
      setIsSendingTestAlert(false);
    }
  };

  useEffect(() => {
    reloadData();
    const interval = setInterval(reloadData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter telemetry based on selected time range
  const filteredData = useMemo(() => {
    const list = [...telemetry].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    if (timeRange === '24h') {
      return list.slice(-12);
    }
    if (timeRange === '7d') {
      return list.slice(-24);
    }
    return list;
  }, [telemetry, timeRange]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalScans = telemetry.length;
    const totalFound = telemetry.reduce((sum, item) => sum + (item.issuesFoundCount || 0), 0);
    const totalRepaired = telemetry.reduce((sum, item) => sum + (item.repairsAppliedCount || 0), 0);
    const syntaxTotal = telemetry.reduce((sum, item) => sum + (item.syntaxIssues || 0), 0);
    const logicTotal = telemetry.reduce((sum, item) => sum + (item.logicIssues || 0), 0);
    const secTotal = telemetry.reduce((sum, item) => sum + (item.securityIssues || 0), 0);
    const settingsTotal = telemetry.reduce((sum, item) => sum + (item.settingsIssues || 0), 0);
    const perfTotal = telemetry.reduce((sum, item) => sum + (item.performanceIssues || 0), 0);

    const latest = telemetry[0] || null;
    const currentHealth = latest ? latest.healthScore : 100;
    const repairRate = totalFound > 0 ? Math.round((totalRepaired / totalFound) * 100) : 100;
    const avgLatency =
      totalScans > 0
        ? Math.round(telemetry.reduce((sum, item) => sum + (item.durationMs || 15), 0) / totalScans)
        : 14;

    return {
      totalScans,
      totalFound,
      totalRepaired,
      syntaxTotal,
      logicTotal,
      secTotal,
      settingsTotal,
      perfTotal,
      currentHealth,
      repairRate,
      avgLatency,
    };
  }, [telemetry]);

  // Chart Data for Category Breakdown
  const categoryData = useMemo(() => {
    return [
      {
        name: isArabic ? 'أخطاء الصياغة (Syntax)' : 'Syntax Errors',
        count: metrics.syntaxTotal,
        color: '#f59e0b', // Amber
        key: 'syntax',
      },
      {
        name: isArabic ? 'الأخطاء المنطقية (Logic)' : 'Logic Errors',
        count: metrics.logicTotal,
        color: '#3b82f6', // Blue
        key: 'logic',
      },
      {
        name: isArabic ? 'الأمان والثغرات (Security)' : 'Security Scans',
        count: metrics.secTotal,
        color: '#ef4444', // Red
        key: 'security',
      },
      {
        name: isArabic ? 'الإعدادات والذاكرة (Storage)' : 'Storage & State',
        count: metrics.settingsTotal,
        color: '#10b981', // Emerald
        key: 'settings',
      },
      {
        name: isArabic ? 'الأداء والنماذج (Performance)' : 'Perf & Models',
        count: metrics.perfTotal,
        color: '#8b5cf6', // Purple
        key: 'performance',
      },
    ];
  }, [metrics, isArabic]);

  // Handle Manual Deep Scan & Auto-Heal
  const handleTriggerManualScan = async () => {
    setIsScanning(true);
    setLastScanResult(null);
    try {
      playAlertSound('radar_pulse', 0.35);
      triggerAlertVibration('single_short');

      const report = await AutoHealEngine({ forceDeepScan: true });
      reloadData();

      setLastScanResult(
        isArabic
          ? `تم الفحص بنجاح: ${report.summaryAr}`
          : `Scan completed: ${report.summaryEn}`
      );

      if (report.repairsApplied > 0) {
        playAlertSound('healing_chime', 0.4);
        triggerAlertVibration('double_pulse');
      }
    } catch (e: any) {
      setLastScanResult(
        isArabic ? `حدث خطأ أثناء الفحص: ${e.message}` : `Scan error: ${e.message}`
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleClear = () => {
    if (confirm(isArabic ? 'هل ترغب في إعادة ضبط سجل الرسوم البيانية؟' : 'Reset telemetry chart history?')) {
      clearAutoHealTelemetry();
      reloadData();
    }
  };

  // Recent Activity Logs from storage
  const recentLogs = useMemo(() => {
    const all = loadActivityLogs();
    return all.filter((l) => l.toolName === 'auto_heal_engine').slice(0, 8);
  }, [telemetry]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Status & Live Watchdog Engine Header */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-teal-900/90 via-slate-900 to-emerald-950 text-white border border-teal-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-inner">
              <ShieldCheck className="w-7 h-7 animate-pulse text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  <span>{isArabic ? 'لوحة تحكم الفحص والإصلاح الذاتي (AutoHeal Dashboard)' : 'AutoHeal Analytics & Recovery Dashboard'}</span>
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>{isArabic ? 'حراسة خلفية نشطة 24/7' : '24/7 Watchdog Active'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                {isArabic
                  ? 'رصد بياني وتحليل لحظي للأخطاء البرمجية والمنطقية المكتشفة وتتبع الإصلاحات التلقائية المطبقة بمرور الوقت'
                  : 'Real-time telemetry and timeline visualization of detected code anomalies and autonomous self-heal repairs over time'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={handleTriggerManualScan}
              disabled={isScanning}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg transition active:scale-95 ${
                isScanning
                  ? 'bg-teal-700/60 text-teal-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-teal-500/25'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>
                {isScanning
                  ? isArabic ? 'جاري الفحص العميق...' : 'Scanning Deeply...'
                  : isArabic ? 'فحص وإصلاح فوري الآن' : 'Scan & Auto-Heal Now'}
              </span>
            </button>

            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition"
                title={isArabic ? 'تخصيص نغمات واهتزازات التنبيه' : 'Alert Settings'}
              >
                <Volume2 className="w-4 h-4 text-teal-300" />
              </button>
            )}

            <button
              onClick={handleClear}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/5 transition"
              title={isArabic ? 'إعادة ضبط البيانات' : 'Reset Telemetry'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {lastScanResult && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3.5 p-2.5 rounded-xl bg-teal-950/60 border border-teal-500/30 text-xs text-teal-200 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{lastScanResult}</span>
          </motion.div>
        )}
      </div>

      {/* KPI Cards Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Issues Repaired */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isArabic ? 'الإصلاحات التلقائية المطبقة' : 'Auto-Repairs Applied'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.totalRepaired}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {isArabic ? 'خطأ تم إصلاحه' : 'resolved'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isArabic
              ? `من أصل ${metrics.totalFound} مشكلة تم رصدها`
              : `Out of ${metrics.totalFound} detected issues`}
          </p>
        </div>

        {/* Card 2: Healing Success Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isArabic ? 'معدل نجاح التعافي الذاتي' : 'Self-Heal Success Rate'}
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
              {metrics.repairRate}%
            </span>
            <span className="text-[11px] font-bold text-teal-500">
              {metrics.repairRate >= 90 ? '🟢 ممتازة' : '🟡 جيدة'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isArabic ? 'سلامة الكود واستقرار المنظومة' : 'Workspace code health status'}
          </p>
        </div>

        {/* Card 3: Total Scans Performed */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isArabic ? 'إجمالي الفحوصات الدورية' : 'Background Scans Run'}
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.totalScans}
            </span>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
              {isArabic ? 'دورة فحص' : 'cycles'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isArabic ? 'كل 30 ثانية + مع كل استثناء' : 'Every 30s + on error events'}
          </p>
        </div>

        {/* Card 4: Mean Recovery Latency */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isArabic ? 'متوسط سرعة الإصلاح الذاتي' : 'Mean Heal Latency'}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.avgLatency}
            </span>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
              ms (مللي ثانية)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isArabic ? 'معالجة فورية خفيفة بدون تعليق' : 'Instant in-memory execution'}
          </p>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Timeline Area Chart (Over Time) */}
        <div className="lg:col-span-8 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-500" />
                <span>{isArabic ? 'عدد الأخطاء المكتشفة والإصلاحات بمرور الوقت' : 'Issues Detected vs. Repaired Over Time'}</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isArabic
                  ? 'رسم بياني زمني يوضح وتيرة اكتشاف وتصحيح الأخطاء دورياً'
                  : 'Chronological timeline of detected issues vs autonomous repairs'}
              </p>
            </div>

            {/* Time Filter Pills */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {(['24h', '7d', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    timeRange === range
                      ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {range === '24h'
                    ? isArabic ? '24 ساعة' : '24 Hours'
                    : range === '7d'
                    ? isArabic ? '7 أيام' : '7 Days'
                    : isArabic ? 'الكل' : 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* Area Chart Container */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorRepaired" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis
                  dataKey="displayTime"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as AutoHealTelemetrySnapshot;
                      return (
                        <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5">
                          <div className="font-bold text-slate-300 flex items-center justify-between gap-4 border-b border-slate-800 pb-1">
                            <span>{label || data.displayTime}</span>
                            <span className="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono text-[10px]">
                              {data.status === 'clean' ? 'سليم 100%' : 'تم الإصلاح'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-amber-300">
                            <span>{isArabic ? 'أخطاء تم رصدها:' : 'Issues Found:'}</span>
                            <span className="font-bold font-mono">{data.issuesFoundCount}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-emerald-400">
                            <span>{isArabic ? 'إصلاحات تلقائية:' : 'Auto-Repaired:'}</span>
                            <span className="font-bold font-mono">{data.repairsAppliedCount}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-slate-400 text-[10px]">
                            <span>{isArabic ? 'زمن المعالجة:' : 'Duration:'}</span>
                            <span className="font-mono">{data.durationMs}ms</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={30}
                  formatter={(value) => {
                    if (value === 'issuesFoundCount')
                      return isArabic ? 'الأخطاء المرصودة' : 'Issues Found';
                    if (value === 'repairsAppliedCount')
                      return isArabic ? 'الإصلاحات التلقائية المطبقة' : 'Repairs Applied';
                    return value;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="issuesFoundCount"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFound)"
                />
                <Area
                  type="monotone"
                  dataKey="repairsAppliedCount"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRepaired)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Breakdown Bar Chart */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-500" />
              <span>{isArabic ? 'تصنيف وتوزيع الأخطاء' : 'Issues by Category'}</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isArabic ? 'توزيع الأخطاء بحسب طبيعتها البرمجية' : 'Distribution of anomalies across modules'}
            </p>
          </div>

          <div className="h-56 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  width={110}
                  tickFormatter={(v) => (v.length > 18 ? v.substring(0, 16) + '..' : v)}
                />
                <Tooltip
                  formatter={(value: any) => [
                    `${value} ${isArabic ? 'مشكلة' : 'issues'}`,
                    isArabic ? 'العدد' : 'Count',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Category List */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 flex items-center justify-between">
              <span className="text-[11px]">{isArabic ? 'أخطاء صياغة:' : 'Syntax:'}</span>
              <span className="font-bold font-mono">{metrics.syntaxTotal}</span>
            </div>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-200 flex items-center justify-between">
              <span className="text-[11px]">{isArabic ? 'أخطاء منطقية:' : 'Logic:'}</span>
              <span className="font-bold font-mono">{metrics.logicTotal}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Event Stream / Activity Log History */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-500" />
              <span>{isArabic ? 'سجل عمليات التعافي البرمجي الذاتي الحية' : 'Live Autonomous Self-Heal Event Stream'}</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isArabic
                ? 'تفاصيل العمليات والإصلاحات التي تم تنفيذها وتوثيقها في سجل الأنشطة'
                : 'Direct telemetry log entries recorded into ActivityLog by the engine'}
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
            {recentLogs.length} {isArabic ? 'عملية مسجلة' : 'records'}
          </span>
        </div>

        {recentLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p>{isArabic ? 'كافة الملفات والذاكرة سليمة بنسبة 100%، لم يتم تسجيل أخطاء بناء حرجة.' : 'All workspace code and memory intact. Zero unresolved flaws.'}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5 sm:mt-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {isArabic ? log.displayNameAr : log.displayNameEn}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        {isArabic ? 'تم الإصلاح ذاتياً' : 'Auto-Repaired'}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 line-clamp-2">
                      {isArabic ? log.actionSummaryAr : log.actionSummaryEn}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center text-[10px] text-slate-400 font-mono">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Developer Error Reporting & Exclusive Dispatch Hub (adamaiproduction@gmail.com) */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/20 via-slate-900/40 to-slate-900 border border-indigo-500/30 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {isArabic ? 'قناة إرسال تقارير الأخطاء للمصنّع فقط' : 'Exclusive Developer Error Telemetry'}
                </h4>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                  {isArabic ? 'قناة المطور المشفرة 🔒' : 'Encrypted Developer Channel 🔒'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isArabic
                  ? 'يتم توجيه جميع تقارير الانهيار واستثناءات الكود وفحوصات التعافي حصرياً لمطور ومصنع التطبيق دون إزعاج المستخدمين'
                  : 'All crash logs and diagnostic traces are strictly dispatched to the app creator, shielding regular users'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSendTestAlert}
              disabled={isSendingTestAlert}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 active:scale-95"
              title={isArabic ? 'إرسال تقرير تشخيصي تجريبي' : 'Send Test Diagnostic'}
            >
              {isSendingTestAlert ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{isArabic ? 'إرسال تقرير تجريبي' : 'Send Test Alert'}</span>
            </button>
          </div>
        </div>

        {/* Status notice */}
        {testAlertStatus && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{testAlertStatus}</span>
          </div>
        )}

        {/* Protection & Shielding Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-[11px]">
              <Lock className="w-3.5 h-3.5" />
              <span>{isArabic ? 'حماية المستخدم (User Shield)' : 'User Shielding'}</span>
            </div>
            <p className="text-[10px] text-slate-400">
              {isArabic ? 'المستخدم العادي لا تظهر له نوافذ أخطاء معقدة' : 'Regular users never see raw technical crashes'}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isArabic ? 'المستلم الحصري (Sole Receiver)' : 'Exclusive Target'}</span>
            </div>
            <p className="text-[10px] text-slate-300 font-medium truncate">
              {isArabic ? 'سيرفر المطور الموثق 🛡️' : 'Verified Developer Server 🛡️'}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <div className="flex items-center gap-1.5 text-teal-400 font-bold text-[11px]">
              <Terminal className="w-3.5 h-3.5" />
              <span>{isArabic ? 'إجمالي البلاغات المرسلة' : 'Dispatched Reports'}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              {developerDispatches.length} {isArabic ? 'تقرير موثق' : 'dispatches logged'}
            </p>
          </div>
        </div>

        {/* Recent Developer Dispatches Log */}
        {developerDispatches.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-indigo-500/20">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{isArabic ? 'آخر التقارير الموجهة لبريدك:' : 'Recent Reports Dispatched to Creator:'}</span>
              <button
                type="button"
                onClick={() => {
                  clearDeveloperDispatches();
                  setDeveloperDispatches([]);
                }}
                className="hover:text-rose-400 text-[10px] transition"
              >
                {isArabic ? 'تفريغ السجل' : 'Clear Log'}
              </button>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {developerDispatches.slice(0, 5).map((disp) => (
                <div
                  key={disp.id}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2 text-[11px]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        disp.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-300'
                          : disp.severity === 'warning'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        {disp.errorType}
                      </span>
                      <span className="font-bold text-slate-200 truncate">{disp.sourceModule}</span>
                    </div>
                    <p className="text-slate-400 text-[10px] truncate mt-0.5">{disp.message}</p>
                  </div>

                  <div className="text-[9px] text-slate-500 font-mono shrink-0">
                    {new Date(disp.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
