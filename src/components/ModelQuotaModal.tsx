import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Zap,
  Sparkles,
  ShieldCheck,
  Crown,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Layers,
  Info,
} from 'lucide-react';
import {
  getAllQuotasSummary,
  GlobalQuotaSummary,
  isAppCreator,
  CREATOR_NAME,
  TOP_3_FRONTIER_MODELS,
  TOP_MODEL_DAILY_LIMIT_SECONDS,
  OTHER_MODELS_POOL_DAILY_LIMIT_SECONDS,
  formatSecondsToTime,
} from '../lib/quotaManager';

interface ModelQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
  isArabic: boolean;
  onSelectModel?: (modelId: string) => void;
}

export const ModelQuotaModal: React.FC<ModelQuotaModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  isArabic,
  onSelectModel,
}) => {
  const [summary, setSummary] = useState<GlobalQuotaSummary>(() =>
    getAllQuotasSummary(userEmail, isArabic)
  );

  useEffect(() => {
    if (isOpen) {
      setSummary(getAllQuotasSummary(userEmail, isArabic));
      const interval = setInterval(() => {
        setSummary(getAllQuotasSummary(userEmail, isArabic));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, userEmail, isArabic]);

  if (!isOpen) return null;

  const isCreator = summary.isCreator;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-400 border border-amber-500/30">
              {isCreator ? <Crown className="w-6 h-6 text-amber-300 animate-pulse" /> : <Clock className="w-6 h-6 text-amber-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-slate-100">
                  {isArabic ? 'نظام الحصص اليومية للنماذج الذكية' : 'Daily AI Models Quota System'}
                </h3>
                {isCreator ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 text-[10px] font-black flex items-center gap-1 shadow-sm">
                    <Crown className="w-3 h-3" />
                    <span>{isArabic ? 'صانع التطبيق 👑' : 'Creator VIP 👑'}</span>
                  </span>
                ) : summary.isVip ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-black flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{isArabic ? 'عضوية VIP 🌟' : 'VIP Member 🌟'}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-[10px] font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span>{isArabic ? 'عضوية مجانية ⚡' : 'Regular Plan ⚡'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isCreator
                  ? (isArabic ? `مرحباً بالسيد ${CREATOR_NAME} - كل شيء مجاني ومفتوح بالكامل لك لأنك صانع ومطور التطبيق` : `Welcome Mr. ${CREATOR_NAME} - Everything is 100% free & unlocked`)
                  : summary.isVip
                  ? (isArabic ? 'عضوية VIP نشطة - سرعة معالجة قصوى وحصص موسعة' : 'Active VIP Tier - High priority access')
                  : (isArabic ? '5 دقائق لكل نموذج من أقوى 3 نماذج + 3 ساعات مجمعة لباقي النماذج' : '5 min per Top-3 Frontier Model + 3h pooled for all other models')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 theme-scrollbar">
          {/* VIP Creator Banner (Strictly If Creator) */}
          {isCreator ? (
            <div className="p-4.5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border-2 border-amber-500/50 shadow-lg relative overflow-hidden">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-400 text-slate-950 font-bold border border-yellow-300 shrink-0 shadow-md">
                  <Crown className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-amber-200 flex items-center gap-2">
                    <span>👑 {isArabic ? `حساب صانع ومبتكر التطبيق: ${CREATOR_NAME}` : `App Creator: ${CREATOR_NAME}`}</span>
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {isArabic
                      ? 'تم فك كافة القيود والحصص الزمنية بالكامل أمام حسابك الرسمي كصانع ومبتكر للتطبيق. كل شيء مجاني ومتاح لك دائماً بلا حدود (Unlimited ♾️).'
                      : 'All quotas and time limits are completely bypassed for your creator account. Everything is 100% free and unrestricted 24/7 (Unlimited ♾️).'}
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-[11px] text-amber-300 font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>{isArabic ? 'الحالة: وصول مطلق ومجاني بالكامل ♾️ (Creator Bypass Active)' : 'Status: 100% Unrestricted & Free Access ♾️'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : summary.isVip ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border border-amber-500/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-200">
                    {isArabic ? 'عضوية VIP مميزة نشطة 🌟' : 'VIP Membership Active 🌟'}
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    {isArabic ? 'تتمتع بحصص إضافية وسرعة معالجة واستجابة فورية عبر كافة النماذج الذكية.' : 'Enjoy expanded quotas and priority low-latency processing across all models.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200">
                    {isArabic ? 'موعد تجديد الحصص اليومية:' : 'Daily Quota Reset:'}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {isArabic ? 'تتجدد الحصص تلقائياً كل يوم عند الساعة 12:00 منتصف الليل' : 'Quotas reset automatically every day at midnight (12:00 AM)'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-blue-400">
                {summary.resetTimeFormatted}
              </span>
            </div>
          )}

          {/* Section 1: Top 3 Frontier Models (5 min each / day) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-xs text-slate-200 uppercase tracking-wider">
                  {isArabic ? 'أقوى 3 نماذج ذكية (5 دقائق لكل نموذج يومياً)' : 'Top 3 Frontier Models (5 min / day each)'}
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {isCreator ? (isArabic ? 'غير محدود ♾️' : 'Unlimited') : (isArabic ? 'حصة مستقلة لكل نموذج' : 'Independent quota')}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {summary.topModels.map((m, idx) => {
                const isDepleted = m.isDepleted && !isCreator;
                return (
                  <div
                    key={m.modelId}
                    className={`p-3.5 rounded-2xl border transition relative overflow-hidden ${
                      isDepleted
                        ? 'bg-red-950/20 border-red-500/30'
                        : isCreator
                        ? 'bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border-amber-500/30'
                        : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                            <span className="truncate">{m.displayName}</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-orange-500/20 text-orange-300 font-extrabold">
                              {isArabic ? 'فائق القوة' : 'Top Tier'}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block truncate">{m.modelId}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-xs font-mono font-black ${isDepleted ? 'text-red-400' : isCreator ? 'text-amber-300' : 'text-emerald-400'}`}>
                          {m.formattedRemaining}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {isArabic ? 'من أصل 5 دقائق' : 'of 5 min daily'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {!isCreator && (
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-700/60">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isDepleted
                              ? 'bg-red-500'
                              : m.percentageUsed > 75
                              ? 'bg-amber-500'
                              : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          }`}
                          style={{ width: `${Math.min(100, m.percentageUsed)}%` }}
                        />
                      </div>
                    )}

                    {isDepleted && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-red-400 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{isArabic ? 'تم استنفاد حصة هذا النموذج لليوم. سيعمل التبديل التلقائي.' : 'Daily limit reached for this model. Failover active.'}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Other Models Shared Pool (3 Hours per Day) */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-xs text-slate-200 uppercase tracking-wider">
                  {isArabic ? 'باقي النماذج المتبقية (3 ساعات يومياً مجمعة)' : 'All Other Models (3 Hours / day Shared Pool)'}
                </h4>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono font-bold">
                {summary.otherModelsPool.formattedRemaining}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900 border border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">
                  {isArabic ? 'الحصة المشتركة لكافة النماذج الأخرى:' : 'Shared Quota Pool:'}
                </span>
                <span className="font-mono text-slate-100 font-bold">
                  {isCreator
                    ? (isArabic ? 'غير محدود ♾️' : 'Unlimited')
                    : (isArabic
                        ? `${formatSecondsToTime(summary.otherModelsPool.usedSeconds, true)} مستخدمة / 3 ساعات`
                        : `${formatSecondsToTime(summary.otherModelsPool.usedSeconds, false)} used / 3h`)}
                </span>
              </div>

              {!isCreator && (
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-700/60">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      summary.otherModelsPool.isDepleted
                        ? 'bg-red-500'
                        : summary.otherModelsPool.percentageUsed > 75
                        ? 'bg-amber-500'
                        : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                    }`}
                    style={{ width: `${Math.min(100, summary.otherModelsPool.percentageUsed)}%` }}
                  />
                </div>
              )}

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isArabic
                  ? 'تشمل: Gemini 3.7 Flash، Gemini 1.5 Flash، DeepSeek، Qwen 2.5، Meta Llama 3.1 70B، ونماذج Pollinations المفتوحة.'
                  : 'Includes: Gemini 3.7 Flash, Gemini 1.5 Flash, DeepSeek, Qwen 2.5, Meta Llama 70B, and Pollinations Free engines.'}
              </p>
            </div>
          </div>

          {/* Info Card */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              {isArabic
                ? 'يتم احتساب وقت الاستجابة والتوليد الفعلي بدقة وتحديث الحصص لحظياً.'
                : 'Active AI generation time is tracked precisely and quotas update in real-time.'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {isArabic ? `الحساب: ${userEmail || 'وضع الضيف'}` : `Account: ${userEmail || 'Guest Mode'}`}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
