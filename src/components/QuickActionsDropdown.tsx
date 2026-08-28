import React, { useState, useRef, useEffect } from 'react';
import {
  Grid,
  PhoneCall,
  Sparkles,
  ShieldCheck,
  Radio,
  Palette,
  Globe,
  Brain,
  FileText,
  Calendar,
  Folder,
  Laptop,
  Video,
  Activity,
  ChevronDown,
  Layers,
  Zap,
  CheckCircle2,
  Lock,
  UserCheck,
  LogOut,
  KeyRound,
  Cpu,
  BarChart2,
  Clock,
  Crown,
} from 'lucide-react';
import { auth, googleSignIn, fastGoogleSignIn, logoutWorkspace } from '../lib/workspaceAuth';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { isAppCreator, isVipUser, maskEmailAddress, CREATOR_NAME } from '../lib/quotaManager';

interface QuickActionsDropdownProps {
  isArabic: boolean;
  onOpenLiveVoiceCall?: () => void;
  onOpenWorkspaceHub?: () => void;
  onOpenMediaGenerator?: () => void;
  onOpenBackgroundTaskCenter?: () => void;
  onOpenNewsRadar?: () => void;
  onOpenThemeSelector?: () => void;
  onOpenMemories?: () => void;
  onOpenNotes?: () => void;
  onOpenCalendar?: () => void;
  onOpenLocalFiles?: () => void;
  onOpenApkModal?: () => void;
  onOpenActivityLog?: () => void;
  onOpenVoiceHistory?: () => void;
  onOpenTrustModal?: () => void;
  onOpenSkillsManager?: () => void;
  onOpenDataUsageModal?: () => void;
  onOpenModelQuota?: () => void;
}

export const QuickActionsDropdown: React.FC<QuickActionsDropdownProps> = ({
  isArabic,
  onOpenLiveVoiceCall,
  onOpenWorkspaceHub,
  onOpenMediaGenerator,
  onOpenBackgroundTaskCenter,
  onOpenNewsRadar,
  onOpenThemeSelector,
  onOpenMemories,
  onOpenNotes,
  onOpenCalendar,
  onOpenLocalFiles,
  onOpenApkModal,
  onOpenActivityLog,
  onOpenVoiceHistory,
  onOpenTrustModal,
  onOpenSkillsManager,
  onOpenDataUsageModal,
  onOpenModelQuota,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setGoogleUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (callback?: () => void) => {
    if (callback) {
      callback();
    }
    setIsOpen(false);
  };

  const handleQuickGoogleSignIn = async () => {
    if (googleUser) {
      if (onOpenWorkspaceHub) onOpenWorkspaceHub();
      setIsOpen(false);
      return;
    }
    setIsLinkingGoogle(true);
    try {
      await fastGoogleSignIn();
    } catch (err) {
      console.error('Quick Google Sign In error:', err);
    } finally {
      setIsLinkingGoogle(false);
      setIsOpen(false);
    }
  };

  const handleSignOut = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await logoutWorkspace();
      setGoogleUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* The Master Single Quick Access Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95 border ${
          isOpen
            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 border-slate-200/80 dark:border-slate-700'
        }`}
        title={isArabic ? 'مركز أدوات الوصول السريع' : 'Quick Access Hub'}
      >
        <Grid className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:rotate-12 transition-transform" />
        <span>{isArabic ? 'الوصول السريع' : 'Quick Access'}</span>
        {googleUser && (
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Modern Compact Dropdown Grid Menu */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 w-76 sm:w-88 p-3 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/30 backdrop-blur-xl animate-fade-in ${
            isArabic ? 'left-0 sm:left-auto sm:right-0' : 'right-0 sm:right-auto sm:left-0'
          }`}
        >
          {/* Header Banner with User Profile & Trust Certificate Trigger */}
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 mb-2.5">
            {googleUser ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border border-emerald-500 shadow-2xs shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {googleUser.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-800 dark:text-white truncate">
                        {googleUser.displayName || 'Google User'}
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                      {maskEmailAddress(googleUser.email)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {onOpenTrustModal && (
                    <button
                      type="button"
                      onClick={() => handleAction(onOpenTrustModal)}
                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold transition"
                      title={isArabic ? 'شهادة توثيق واعتماد قوقل' : 'Google Verification Certificate'}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                    title={isArabic ? 'تسجيل الخروج' : 'Sign Out'}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-white">
                      {isArabic ? 'ربط الحساب ومساحة خاصة' : 'Google Isolated Account'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {isArabic ? 'عزل كامل لبياناتك ومحادثاتك' : '100% Isolated Data Space'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickGoogleSignIn}
                  disabled={isLinkingGoogle}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-xs active:scale-95 transition flex items-center gap-1.5"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24">
                    <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  </svg>
                  <span>{isArabic ? 'تسجيل سريع' : 'Sign In'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Featured Primary Actions (Voice Call & Google Workspace Hub) */}
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {/* Live Voice Call */}
            {onOpenLiveVoiceCall && (
              <button
                type="button"
                onClick={() => handleAction(onOpenLiveVoiceCall)}
                className="flex items-center gap-2 p-2 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white font-bold text-xs shadow-xs hover:brightness-110 active:scale-95 transition text-start"
              >
                <div className="p-1 rounded-lg bg-white/20">
                  <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[11px]">{isArabic ? 'مكالمة صوتية' : 'Live Call'}</div>
                  <div className="text-[9px] opacity-80 font-normal">{isArabic ? 'تفاعلية فورية' : 'Voice Agent'}</div>
                </div>
              </button>
            )}

            {/* Google Trust Certificate or Workspace Hub */}
            <button
              type="button"
              onClick={() => handleAction(onOpenTrustModal || onOpenWorkspaceHub)}
              className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs shadow-xs active:scale-95 transition text-start border border-emerald-500/30"
            >
              <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-[11px]">{isArabic ? 'اعتماد قوقل 🛡️' : 'Google Verified'}</div>
                <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-normal truncate">
                  {isArabic ? 'أمان وعزل البيانات' : 'Trust & Security'}
                </div>
              </div>
            </button>
          </div>

          {/* Grid of Secondary Smart Tools */}
          <div className="grid grid-cols-2 gap-1 text-xs">
            {onOpenMediaGenerator && (
              <button
                type="button"
                onClick={() => handleAction(onOpenMediaGenerator)}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition text-start group"
              >
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[11px] truncate">{isArabic ? 'استوديو الصور' : 'Media Studio'}</div>
                  <div className="text-[9px] text-slate-400 truncate">{isArabic ? 'توليد بالذكاء' : 'AI Generation'}</div>
                </div>
              </button>
            )}

            {onOpenBackgroundTaskCenter && (
              <button
                type="button"
                onClick={() => handleAction(onOpenBackgroundTaskCenter)}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition text-start group"
              >
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
                  <Radio className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[11px] truncate">{isArabic ? 'مركز المهام' : 'Task Center'}</div>
                  <div className="text-[9px] text-slate-400 truncate">{isArabic ? 'الفحص والتعافي' : 'AutoHeal'}</div>
                </div>
              </button>
            )}

            {onOpenNewsRadar && (
              <button
                type="button"
                onClick={() => handleAction(onOpenNewsRadar)}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition text-start group"
              >
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition-transform">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[11px] truncate">{isArabic ? 'رادار الأخبار' : 'News Radar'}</div>
                  <div className="text-[9px] text-slate-400 truncate">{isArabic ? 'مستجدات حية' : 'Live Feeds'}</div>
                </div>
              </button>
            )}

            {onOpenThemeSelector && (
              <button
                type="button"
                onClick={() => handleAction(onOpenThemeSelector)}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition text-start group"
              >
                <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 group-hover:scale-105 transition-transform">
                  <Palette className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[11px] truncate">{isArabic ? 'معرض المظاهر' : 'Themes'}</div>
                  <div className="text-[9px] text-slate-400 truncate">{isArabic ? 'ألوان وتخصيص' : 'Colors & UI'}</div>
                </div>
              </button>
            )}

            {onOpenMemories && (
              <button
                type="button"
                onClick={() => handleAction(onOpenMemories)}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition text-start group"
              >
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                  <Brain className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[11px] truncate">{isArabic ? 'الذاكرة الذكية' : 'Memories'}</div>
                  <div className="text-[9px] text-slate-400 truncate">{isArabic ? 'معلومات محفوظة' : 'Saved Context'}</div>
                </div>
              </button>
            )}

            {onOpenNotes && (
              <button
                type="button"
                onClick={() => handleAction(onOpenNotes)}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition text-start group"
              >
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[11px] truncate">{isArabic ? 'الملاحظات' : 'Notes'}</div>
                  <div className="text-[9px] text-slate-400 truncate">{isArabic ? 'تدوين سريع' : 'Quick Notes'}</div>
                </div>
              </button>
            )}

            {onOpenCalendar && (
              <button
                type="button"
                onClick={() => handleAction(onOpenCalendar)}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition text-start group"
              >
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[11px] truncate">{isArabic ? 'التقويم والمواعيد' : 'Calendar'}</div>
                  <div className="text-[9px] text-slate-400 truncate">{isArabic ? 'جدول المواعيد' : 'Schedules'}</div>
                </div>
              </button>
            )}

            {onOpenLocalFiles && (
              <button
                type="button"
                onClick={() => handleAction(onOpenLocalFiles)}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition text-start group"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <Folder className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[11px] truncate">{isArabic ? 'إدارة الملفات' : 'Files'}</div>
                  <div className="text-[9px] text-slate-400 truncate">{isArabic ? 'المستندات والصور' : 'Local Storage'}</div>
                </div>
              </button>
            )}

            {onOpenSkillsManager && (
              <button
                type="button"
                onClick={() => handleAction(onOpenSkillsManager)}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition text-start group"
              >
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[11px] truncate">{isArabic ? 'مهارات آدم والإضافات' : 'Adam Skills & MCP'}</div>
                  <div className="text-[9px] text-slate-400 truncate">{isArabic ? 'إنترنت وسكيلس' : 'Online & Extensions'}</div>
                </div>
              </button>
            )}

            {onOpenModelQuota && (
              <button
                type="button"
                onClick={() => handleAction(onOpenModelQuota)}
                className={`flex items-center gap-2 p-2 rounded-xl transition text-start group ${
                  isAppCreator(googleUser?.email)
                    ? 'bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 border border-amber-500/40'
                    : isVipUser(googleUser?.email)
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                    : 'bg-blue-600/5 hover:bg-blue-600/15 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/25'
                }`}
              >
                <div className={`p-1.5 rounded-lg group-hover:scale-105 transition-transform ${
                  isAppCreator(googleUser?.email)
                    ? 'bg-amber-500/25 text-amber-400'
                    : isVipUser(googleUser?.email)
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-blue-500/15 text-blue-500'
                }`}>
                  {isAppCreator(googleUser?.email) ? (
                    <Crown className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  ) : isVipUser(googleUser?.email) ? (
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[11px] truncate flex items-center gap-1">
                    <span>
                      {isAppCreator(googleUser?.email)
                        ? (isArabic ? 'صانع التطبيق' : 'App Creator')
                        : isVipUser(googleUser?.email)
                        ? (isArabic ? 'عضوية VIP' : 'VIP Member')
                        : (isArabic ? 'الحصص اليومية' : 'Daily Quotas')}
                    </span>
                    {isAppCreator(googleUser?.email) ? (
                      <span className="px-1 py-0.2 rounded text-[8px] bg-amber-500/30 text-amber-300 font-extrabold">
                        👑 ♾️
                      </span>
                    ) : isVipUser(googleUser?.email) ? (
                      <span className="px-1 py-0.2 rounded text-[8px] bg-amber-500/30 text-amber-300 font-extrabold">
                        VIP
                      </span>
                    ) : (
                      <span className="px-1 py-0.2 rounded text-[8px] bg-blue-500/20 text-blue-400 font-bold">
                        ⚡
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">
                    {isAppCreator(googleUser?.email)
                      ? (isArabic ? 'كل شيء مجاني لك لأنك صانع التطبيق ♾️' : 'Everything Free & Unlimited ♾️')
                      : isVipUser(googleUser?.email)
                      ? (isArabic ? 'عضوية مميزة (أولوية فائقة 🌟)' : 'Priority VIP Tier 🌟')
                      : (isArabic ? '5د للأقوى + 3س مجمعة' : '5m Top + 3h Shared')}
                  </div>
                </div>
              </button>
            )}

            {onOpenDataUsageModal && (
              <button
                type="button"
                onClick={() => handleAction(onOpenDataUsageModal)}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition text-start group"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <BarChart2 className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[11px] truncate">{isArabic ? 'استهلاك البيانات' : 'Data Estimator'}</div>
                  <div className="text-[9px] text-slate-400 truncate">{isArabic ? 'مراقبة الشبكة' : 'Usage & Savings'}</div>
                </div>
              </button>
            )}
          </div>

          {/* Bottom Banner for Desktop/APK Install */}
          {onOpenApkModal && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleAction(onOpenApkModal)}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 transition text-xs font-bold"
              >
                <span className="flex items-center gap-2">
                  <Laptop className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{isArabic ? 'تثبيت تطبيق الحاسوب والهاتف 💻📱' : 'Install Desktop & APK App'}</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-600 text-white font-normal">
                  {isArabic ? 'تحميل' : 'Get'}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
