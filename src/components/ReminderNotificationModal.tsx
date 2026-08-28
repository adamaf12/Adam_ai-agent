import React, { useState } from 'react';
import { AlarmClock, Bell, Check, Clock, Volume2, X } from 'lucide-react';
import { Reminder } from '../types';

interface ReminderNotificationModalProps {
  activeReminder: Reminder | null;
  onClose: () => void;
  onSnooze: (id: string, minutes: number) => void;
  onComplete: (id: string) => void;
  isArabic: boolean;
}

export const ReminderNotificationModal: React.FC<ReminderNotificationModalProps> = ({
  activeReminder,
  onClose,
  onSnooze,
  onComplete,
  isArabic,
}) => {
  const [snoozeSuccessMsg, setSnoozeSuccessMsg] = useState<string | null>(null);

  if (!activeReminder) return null;

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSnoozeClick = (mins: number) => {
    onSnooze(activeReminder.id, mins);
    const msg = isArabic
      ? `تم تأجيل التذكير بمقدار ${mins} دقيقة ⏰`
      : `Reminder snoozed for ${mins} minutes ⏰`;
    setSnoozeSuccessMsg(msg);
    setTimeout(() => {
      setSnoozeSuccessMsg(null);
      onClose();
    }, 1200);
  };

  const handleCompleteClick = () => {
    onComplete(activeReminder.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div
        id="reminder-notification-card"
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-amber-500/30 dark:border-amber-500/20 rounded-3xl shadow-2xl overflow-hidden p-6 text-slate-800 dark:text-slate-100 space-y-6 transform transition-all scale-100"
      >
        {/* Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400" />

        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 dark:left-auto dark:right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title={isArabic ? 'إغلاق' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated Bell & Title Header */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner animate-bounce">
              <AlarmClock className="w-8 h-8" />
            </div>
            <button
              onClick={playChime}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-500 text-white shadow-md hover:bg-amber-600 transition cursor-pointer"
              title={isArabic ? 'إعادة تشغيل الصوت' : 'Play Sound'}
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[11px] font-bold tracking-wide uppercase mb-1">
              {isArabic ? '⏰ حان موعد التذكير' : '⏰ Reminder Alert'}
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight px-2">
              {activeReminder.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(activeReminder.targetTime).toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Snooze Success Toast Overlay */}
        {snoozeSuccessMsg ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-center text-sm font-bold animate-fade-in">
            {snoozeSuccessMsg}
          </div>
        ) : (
          <>
            {/* Snooze Options Section */}
            <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  {isArabic ? 'تأجيل التذكير (Snooze)' : 'Snooze Reminder'}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {isArabic ? 'اختر مدة التأجيل' : 'Select duration'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  id="snooze-10m-btn"
                  onClick={() => handleSnoozeClick(10)}
                  className="py-2.5 px-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-800 dark:text-slate-100 font-bold text-xs shadow-2xs hover:shadow transition flex flex-col items-center justify-center gap-1 cursor-pointer group"
                >
                  <span className="text-amber-600 dark:text-amber-400 group-hover:scale-110 transition">
                    +10
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {isArabic ? 'دقائق' : 'mins'}
                  </span>
                </button>

                <button
                  id="snooze-30m-btn"
                  onClick={() => handleSnoozeClick(30)}
                  className="py-2.5 px-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-800 dark:text-slate-100 font-bold text-xs shadow-2xs hover:shadow transition flex flex-col items-center justify-center gap-1 cursor-pointer group"
                >
                  <span className="text-amber-600 dark:text-amber-400 group-hover:scale-110 transition">
                    +30
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {isArabic ? 'دقيقة' : 'mins'}
                  </span>
                </button>

                <button
                  id="snooze-60m-btn"
                  onClick={() => handleSnoozeClick(60)}
                  className="py-2.5 px-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-800 dark:text-slate-100 font-bold text-xs shadow-2xs hover:shadow transition flex flex-col items-center justify-center gap-1 cursor-pointer group"
                >
                  <span className="text-amber-600 dark:text-amber-400 group-hover:scale-110 transition">
                    +60
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {isArabic ? 'ساعة' : '1 hour'}
                  </span>
                </button>
              </div>
            </div>

            {/* Complete Action */}
            <div className="flex gap-2">
              <button
                id="reminder-complete-btn"
                onClick={handleCompleteClick}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {isArabic ? 'تم الإنجاز والإغلاق' : 'Mark as Done'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                {isArabic ? 'تجاهل' : 'Dismiss'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
