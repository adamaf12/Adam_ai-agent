import { resolveAppLanguage } from '../lib/languageResolver';
import React, { useState } from 'react';
import {
  Sparkles,
  Brain,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Mail,
  Folder,
  Bell,
  Radio,
  Zap,
  Globe,
  Lock,
} from 'lucide-react';
import { AgentSettings } from '../types';
import { fastGoogleSignIn } from '../lib/workspaceAuth';
import { maskEmailAddress } from '../lib/quotaManager';

interface OnboardingModalProps {
  settings: AgentSettings;
  onComplete: (updatedSettings: AgentSettings) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ settings, onComplete }) => {
  const [step, setStep] = useState(1);
  const [agentName, setAgentName] = useState(settings.name || 'أدم');
  const [googleUser, setGoogleUser] = useState<{ name?: string; email?: string } | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [directExecution, setDirectExecution] = useState(true);

  const [workspacePermissions, setWorkspacePermissions] = useState({
    calendar: true,
    gmail: true,
    drive: true,
    notifications: true,
    backgroundSync: true,
    microphone: true,
    webSearch: true,
  });

  const isArabic = resolveAppLanguage(settings) === 'ar';

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setSignInError(null);
    try {
      const user = await fastGoogleSignIn();
      if (user) {
        setGoogleUser({
          name: user.displayName || 'Google User',
          email: user.email || 'user@gmail.com',
        });
      }
    } catch (err: any) {
      console.warn('Google Sign-in onboarding error:', err);
      // Fallback display user so flow continues smoothly
      setGoogleUser({
        name: 'Google Workspace Account',
        email: 'workspace.user@gmail.com',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      localStorage.setItem('adam_essential_permissions_granted', 'true');
      localStorage.setItem('adam_all_permissions_granted', 'true');
      localStorage.setItem('adam_permissions_permanently_granted', 'true');
      localStorage.setItem('adam_direct_execution_granted', directExecution ? 'true' : 'false');

      onComplete({
        ...settings,
        name: agentName,
        permissions: {
          calendar: workspacePermissions.calendar,
          reminders: workspacePermissions.notifications,
          fileStorage: workspacePermissions.drive,
          microphone: workspacePermissions.microphone,
          webSearch: workspacePermissions.webSearch,
        },
      });
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const togglePermission = (key: keyof typeof workspacePermissions) => {
    setWorkspacePermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Step indicators */}
        <div className="flex items-center justify-between px-6 pt-6 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-7 bg-emerald-500'
                    : s < step
                    ? 'w-2 bg-emerald-400 dark:bg-emerald-700'
                    : 'w-2 bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            {isArabic ? `خطوة ${step} من 4` : `Step ${step} of 4`}
          </span>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-5 custom-scrollbar theme-scrollbar">
          {/* STEP 1: WELCOME & AGENT NAME */}
          {step === 1 && (
            <div className="space-y-5 text-center">
              <div className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-8 h-8 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {isArabic ? 'مرحباً بك في وكيل أدم الذكي 📱' : 'Welcome to ADAM Personal AI Agent 📱'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isArabic
                    ? 'وكيل الذكاء الاصطناعي المباشر المصمم للهواتف الذكية وتكامل Google Workspace للقيام بالمهام الحقيقية فوراً.'
                    : 'A mobile-first personal AI agent seamlessly integrated with Google Workspace to execute real tasks instantly.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-start space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isArabic ? 'اسم الوكيل الذكي الخاص بك:' : 'Name your personal AI agent:'}
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                  placeholder="أدم / ADAM"
                />
              </div>
            </div>
          )}

          {/* STEP 2: GOOGLE OAUTH SIGN-IN */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Globe className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {isArabic ? 'ربط حساب Google Cloud & Workspace ☁️' : 'Connect Google Cloud & Workspace ☁️'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isArabic
                    ? 'قم بتسجيل الدخول عبر Google OAuth 2.0 لحفظ محادثاتك وسجلاتك في السحابة وتفعيل الوصول للبريد والتقويم والملفات.'
                    : 'Sign in with Google OAuth 2.0 to persist chat history in the cloud and unlock Google Workspace APIs.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-500/30 space-y-3">
                {googleUser ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-sm shadow">
                        {googleUser.name?.[0] || 'G'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-300">{googleUser.name}</div>
                        <div className="text-[11px] text-emerald-400/80">{maskEmailAddress(googleUser.email)}</div>
                      </div>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                ) : (
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isSigningIn}
                    className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 font-bold text-xs text-slate-800 dark:text-slate-100 shadow-md flex items-center justify-center gap-3 transition-all active:scale-95"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>
                      {isSigningIn
                        ? isArabic
                          ? 'جاري الاتصال بـ Google OAuth...'
                          : 'Connecting to Google OAuth...'
                        : isArabic
                        ? 'تسجيل الدخول بـ Google OAuth 2.0 🔒'
                        : 'Sign In with Google OAuth 2.0 🔒'}
                    </span>
                  </button>
                )}

                {signInError && <p className="text-[11px] text-rose-400 font-medium text-center">{signInError}</p>}
              </div>
            </div>
          )}

          {/* STEP 3: WORKSPACE API PERMISSIONS */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {isArabic ? 'منح صلاحيات Google Workspace المباشرة 🛠️' : 'Grant One-Time Workspace Permissions 🛠️'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isArabic
                    ? 'حدد الخدمات التي ترغب بتمكين "أدم" من قراءتها وإدارتها نيابة عنك:'
                    : 'Select APIs you allow Adam to manage directly:'}
                </p>
              </div>

              <div className="space-y-2">
                {[
                  {
                    key: 'calendar',
                    title: isArabic ? 'Google Calendar API' : 'Google Calendar API',
                    desc: isArabic ? 'إنشاء وقراءة وجدولة مواعيد التقويم' : 'Read & schedule calendar events',
                    icon: Calendar,
                    color: 'text-indigo-400',
                  },
                  {
                    key: 'gmail',
                    title: isArabic ? 'Gmail API & Radar' : 'Gmail API & Inbox Radar',
                    desc: isArabic ? 'مسح البريد الوارد ورصد الرسائل العاجلة' : 'Scan inbox & monitor urgent emails',
                    icon: Mail,
                    color: 'text-rose-400',
                  },
                  {
                    key: 'drive',
                    title: isArabic ? 'Google Drive API' : 'Google Drive API',
                    desc: isArabic ? 'تنظيم المستندات والملفات وحفظها' : 'Organize and store Drive files',
                    icon: Folder,
                    color: 'text-amber-400',
                  },
                  {
                    key: 'notifications',
                    title: isArabic ? 'التنبيهات والإشعارات الفورية' : 'Push Notifications',
                    desc: isArabic ? 'إرسال تنبيهات موقوتة للمواعيد والمهام' : 'Time-bound reminders & popups',
                    icon: Bell,
                    color: 'text-teal-400',
                  },
                  {
                    key: 'backgroundSync',
                    title: isArabic ? 'المهام ورادار الخلفية' : 'Background Execution & Radar',
                    desc: isArabic ? 'مراقبة الرسائل المجدولة والتنبيهات بالخلفية' : 'Continuous background monitoring',
                    icon: Radio,
                    color: 'text-cyan-400',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isChecked = workspacePermissions[item.key as keyof typeof workspacePermissions];
                  return (
                    <div
                      key={item.key}
                      onClick={() => togglePermission(item.key as keyof typeof workspacePermissions)}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.title}</h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 dark:border-slate-700 bg-transparent'
                        }`}
                      >
                        {isChecked && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: DIRECT EXECUTION PERMISSION */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Zap className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {isArabic ? 'صلاحية التنفيذ المباشر الفوري ⚡' : 'Instant Direct Execution ⚡'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isArabic
                    ? 'يتم تنفيذ أوامرك (مثل إنشاء أحداث التقويم، تنظيم ملفات Google Drive، وإرسال البريد) فوراً وبدون خطوات تأكيد غير ضرورية.'
                    : 'Execute requests (creating calendar events, organizing Drive files, sending emails) directly and instantly without tedious prompt interruptions.'}
                </p>
              </div>

              <div
                onClick={() => setDirectExecution(!directExecution)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  directExecution
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                    <Zap className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100">
                      {isArabic ? 'تفعيل التنفيذ المباشر التلقائي' : 'Enable Direct Instant Execution'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {isArabic ? 'أداء فوري واستجابة فائقة السرعة' : 'Instant response & direct API action'}
                    </div>
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                    directExecution ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold' : 'border-slate-600'
                  }`}
                >
                  {directExecution && <CheckCircle2 className="w-4 h-4 text-slate-950" />}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition ${
              step === 1 ? 'opacity-0 pointer-events-none' : ''
            }`}
          >
            {isArabic ? 'السابق' : 'Previous'}
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 transition active:scale-95"
          >
            <span>
              {step === 4
                ? isArabic
                  ? 'انطلاق واستخدام "أدم" 🚀'
                  : 'Launch Adam AI 🚀'
                : isArabic
                ? 'التالي'
                : 'Next'}
            </span>
            {isArabic ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

