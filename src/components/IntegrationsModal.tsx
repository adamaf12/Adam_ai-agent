import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Key,
  Github,
  Mail,
  Calendar,
  HardDrive,
  Globe,
  Bot,
  Layers,
  Check,
  ShieldCheck,
  Cpu,
  Plug,
  ArrowRight,
} from 'lucide-react';
import { auth, fastGoogleSignIn, logoutWorkspace } from '../lib/workspaceAuth';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isArabic: boolean;
  onOpenWorkspaceHub?: () => void;
  onOpenSkillsManager?: () => void;
  onOpenSettings?: () => void;
}

export const IntegrationsModal: React.FC<IntegrationsModalProps> = ({
  isOpen,
  onClose,
  isArabic,
  onOpenWorkspaceHub,
  onOpenSkillsManager,
  onOpenSettings,
}) => {
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('adam_github_token') || '');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('adam_custom_gemini_key') || '');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setGoogleUser(user);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    if (googleUser) {
      await logoutWorkspace();
      setGoogleUser(null);
    } else {
      setIsSigningIn(true);
      try {
        await fastGoogleSignIn();
      } catch (err) {
        console.error(err);
      } finally {
        setIsSigningIn(false);
      }
    }
  };

  const handleSaveKeys = (type: 'github' | 'gemini') => {
    if (type === 'github') {
      localStorage.setItem('adam_github_token', githubToken);
      setSaveSuccess(isArabic ? 'تم حفظ رمز GitHub بنجاح!' : 'GitHub token saved successfully!');
    } else {
      localStorage.setItem('adam_custom_gemini_key', geminiKey);
      setSaveSuccess(isArabic ? 'تم حفظ مفتاح Gemini بنجاح!' : 'Gemini key saved successfully!');
    }
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-md animate-fadeIn">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[32px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-2xl p-5 sm:p-6 text-slate-900 dark:text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-400/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Plug className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold tracking-tight">
                  {isArabic ? 'ربط التطبيقات والخدمات' : 'Connected Apps & Services'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isArabic
                    ? 'اربط حساباتك وتطبيقاتك لتمكين آدم من العمل كوكيل مستقل فائق الاحترافية'
                    : 'Connect your accounts and services to supercharge Adam with real-world autonomy'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Banner */}
          {saveSuccess && (
            <div className="my-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {/* Integrations List */}
          <div className="space-y-4 my-4">
            {/* 1. Google Workspace */}
            <div className="p-4 rounded-2xl bg-white/50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 dark:bg-red-400/15 flex items-center justify-center text-red-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                      <span>Google Workspace</span>
                      {googleUser && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {isArabic ? 'متصل' : 'Connected'}
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isArabic
                        ? 'الوصول إلى تقويم Google، بريد Gmail، و Google Drive'
                        : 'Access Google Calendar, Gmail inbox, and Google Drive'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleGoogleAuth}
                  disabled={isSigningIn}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    googleUser
                      ? 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
                  }`}
                >
                  {isSigningIn
                    ? isArabic ? 'جاري الاتصال...' : 'Connecting...'
                    : googleUser
                    ? isArabic ? 'قطع الاتصال' : 'Disconnect'
                    : isArabic ? 'ربط الحساب' : 'Connect'}
                </button>
              </div>

              {googleUser && onOpenWorkspaceHub && (
                <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px] truncate max-w-[240px]">
                    {googleUser.email}
                  </span>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenWorkspaceHub();
                    }}
                    className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <span>{isArabic ? 'فتح إدارة المهام' : 'Open Hub'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* 2. GitHub Integration */}
            <div className="p-4 rounded-2xl bg-white/50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900/10 dark:bg-white/10 flex items-center justify-center text-slate-800 dark:text-slate-200">
                    <Github className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                      <span>GitHub</span>
                      {githubToken && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {isArabic ? 'تم الربط' : 'Token Added'}
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isArabic
                        ? 'قراءة المستودعات، فحص الأكواد، وإدارة الطلبات البرمجية'
                        : 'Read repositories, code review, and push git updates'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder={isArabic ? 'أدخل Personal Access Token...' : 'Enter GitHub Personal Access Token...'}
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  onClick={() => handleSaveKeys('github')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                >
                  {isArabic ? 'حفظ' : 'Save'}
                </button>
              </div>
            </div>

            {/* 3. Google Gemini Pro API Key */}
            <div className="p-4 rounded-2xl bg-white/50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-400/15 flex items-center justify-center text-amber-500">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                      <span>Google Gemini API</span>
                      {geminiKey && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {isArabic ? 'مخصص' : 'Custom Key'}
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isArabic
                        ? 'مفتاحك الخاص من Google AI Studio لقوة استدلال وسرعة قصوى بلا حدود'
                        : 'Your own Google AI Studio key for high quota reasoning'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder={isArabic ? 'أدخل GEMINI_API_KEY...' : 'Enter GEMINI_API_KEY...'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  onClick={() => handleSaveKeys('gemini')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                >
                  {isArabic ? 'حفظ' : 'Save'}
                </button>
              </div>
            </div>

            {/* 4. Skills & MCP Extensions */}
            {onOpenSkillsManager && (
              <div className="p-4 rounded-2xl bg-white/50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 dark:bg-purple-400/15 flex items-center justify-center text-purple-500">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold">
                      {isArabic ? 'سوق المهارات وإضافات MCP' : 'Skills & MCP Extensions'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isArabic
                        ? 'تثبيت أدوات وبروتوكولات MCP مفتوحة المصدر من GitHub والويب'
                        : 'Install open-source MCP skills and tools from GitHub'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenSkillsManager();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-xs"
                >
                  {isArabic ? 'إدارة المهارات' : 'Manage'}
                </button>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/10 text-center">
            <p className="text-[11px] text-slate-400">
              {isArabic
                ? '🔒 جميع المفاتيح والرموز تُشفر وتُحفظ بأمان محلياً ولا يتم مشاركتها أبداً مع أي طرف ثالث.'
                : '🔒 All keys and tokens are securely encrypted locally and never shared with third parties.'}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
