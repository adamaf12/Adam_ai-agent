import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Sparkles,
  Search,
  Radio,
  Image as ImageIcon,
  Brain,
  FileText,
  Calendar,
  Folder,
  Settings,
  Activity,
  Layers,
  PhoneCall,
  Monitor,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  ShieldCheck,
  Zap,
  LogIn,
  Cpu,
} from 'lucide-react';
import { ConversationSession, AgentSettings } from '../types';
import { auth, fastGoogleSignIn } from '../lib/workspaceAuth';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface DesktopSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: ConversationSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  isArabic: boolean;
  settings: AgentSettings;
  onOpenWorkspaceHub?: () => void;
  onOpenMediaGenerator?: () => void;
  onOpenNewsRadar?: () => void;
  onOpenBackgroundTaskCenter?: () => void;
  onOpenMemories?: () => void;
  onOpenNotes?: () => void;
  onOpenCalendar?: () => void;
  onOpenLocalFiles?: () => void;
  onOpenPersonaSelector?: () => void;
  onOpenSettings?: () => void;
  onOpenLiveVoiceCall?: () => void;
  onOpenApkModal?: () => void;
  onOpenThemeSelector?: () => void;
  onOpenTrustModal?: () => void;
  onOpenSkillsManager?: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  isOpen,
  onToggle,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isArabic,
  settings,
  onOpenWorkspaceHub,
  onOpenMediaGenerator,
  onOpenNewsRadar,
  onOpenBackgroundTaskCenter,
  onOpenMemories,
  onOpenNotes,
  onOpenCalendar,
  onOpenLocalFiles,
  onOpenPersonaSelector,
  onOpenSettings,
  onOpenLiveVoiceCall,
  onOpenApkModal,
  onOpenThemeSelector,
  onOpenTrustModal,
  onOpenSkillsManager,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setGoogleUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleQuickSignIn = async () => {
    setIsSigningIn(true);
    try {
      await fastGoogleSignIn();
    } catch (err) {
      console.error('Google Sign In error:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const filteredSessions = sessions.filter((s) =>
    (s.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 border-e border-slate-200/80 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md transition-all duration-300 z-20 h-[calc(100vh-65px)] sticky top-[65px] theme-scrollbar ${
        isOpen ? 'w-72' : 'w-16'
      }`}
    >
      {/* Top action header: New Chat & Toggle */}
      <div className="p-3 border-b border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between gap-2">
        {isOpen ? (
          <>
            <button
              onClick={onNewChat}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition active:scale-95 group"
              title={isArabic ? 'بدء محادثة جديدة (Ctrl+N)' : 'Start New Chat (Ctrl+N)'}
            >
              <Plus className="w-4 h-4 transition group-hover:rotate-90" />
              <span>{isArabic ? 'محادثة جديدة' : 'New Chat'}</span>
              <kbd className="hidden lg:inline-block ms-auto text-[10px] px-1.5 py-0.5 rounded bg-emerald-700/60 text-emerald-100 font-mono">
                Ctrl+N
              </kbd>
            </button>

            <button
              onClick={onToggle}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
              title={isArabic ? 'طي الشريط الجانبي' : 'Collapse Sidebar'}
            >
              {isArabic ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 w-full">
            <button
              onClick={onToggle}
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
              title={isArabic ? 'توسيع الشريط الجانبي' : 'Expand Sidebar'}
            >
              {isArabic ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <button
              onClick={onNewChat}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition active:scale-95"
              title={isArabic ? 'محادثة جديدة' : 'New Chat'}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isOpen ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Box */}
          <div className="p-3 border-b border-slate-200/40 dark:border-slate-800/40 space-y-2">
            <div className="relative">
              <Search className={`absolute top-2.5 w-3.5 h-3.5 text-slate-400 ${isArabic ? 'right-2.5' : 'left-2.5'}`} />
              <input
                type="text"
                placeholder={isArabic ? 'بحث في المحادثات...' : 'Search chats...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 ${
                  isArabic ? 'pr-8 pl-2' : 'pl-8 pr-2'
                }`}
              />
            </div>

            {/* Google Authentication & Memory Status Mini-Card */}
            {googleUser ? (
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate font-semibold flex-1">
                  {isArabic ? 'حساب متصل • الذاكرة مفعلة' : 'Google Auth • Memory Active'}
                </span>
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 space-y-1.5 text-[10px]">
                <div className="flex items-center gap-1.5 font-bold">
                  <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{isArabic ? 'وضع الضيف (بدون حفظ)' : 'Guest (No Memory)'}</span>
                </div>
                <p className="opacity-90 leading-tight text-[9px]">
                  {isArabic
                    ? 'سجّل دخولك بحساب Google لحفظ وتذكر كافة محادثاتك بشكل دائم.'
                    : 'Sign in to Google to remember and save all your chats.'}
                </p>
                <button
                  type="button"
                  onClick={handleQuickSignIn}
                  disabled={isSigningIn}
                  className="w-full flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-2xs transition"
                >
                  <LogIn className="w-3 h-3" />
                  <span>{isArabic ? 'تسجيل الدخول' : 'Sign In'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 theme-scrollbar">
            <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>{isArabic ? 'المحادثات الأخيرة' : 'Recent Chats'}</span>
              <span className="text-[10px] bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.2 rounded-full font-mono">
                {filteredSessions.length}
              </span>
            </div>

            {filteredSessions.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                <MessageSquare className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                <p>{isArabic ? 'لا توجد محادثات' : 'No chats found'}</p>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className={`group relative flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer transition ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                      <span className="truncate">{session.title || (isArabic ? 'محادثة' : 'Chat')}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => onDeleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 hover:text-rose-500 transition shrink-0"
                      title={isArabic ? 'حذف المحادثة' : 'Delete chat'}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Hub Modules Navigation */}
          <div className="p-2 border-t border-slate-200/60 dark:border-slate-800/80 space-y-0.5 bg-slate-100/50 dark:bg-slate-900/50">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {isArabic ? 'الوحدات الذكية' : 'Smart Modules'}
            </div>

            {onOpenWorkspaceHub && (
              <button
                onClick={onOpenWorkspaceHub}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-500/10 transition"
              >
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>{isArabic ? 'Google Workspace Hub' : 'Google Workspace'}</span>
              </button>
            )}

            {onOpenMediaGenerator && (
              <button
                onClick={onOpenMediaGenerator}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 transition"
              >
                <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                <span>{isArabic ? 'استوديو نانو بنانة والفيديو' : 'Nano Banana Studio'}</span>
              </button>
            )}

            {onOpenBackgroundTaskCenter && (
              <button
                onClick={onOpenBackgroundTaskCenter}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 transition"
              >
                <Radio className="w-3.5 h-3.5 text-teal-500" />
                <span>{isArabic ? 'المهام ولوحة الفحص (AutoHeal 📈)' : 'Tasks & AutoHeal Hub'}</span>
              </button>
            )}

            {onOpenNewsRadar && (
              <button
                onClick={onOpenNewsRadar}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 transition"
              >
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                <span>{isArabic ? 'رادار الأخبار والتعلم' : 'News Radar'}</span>
              </button>
            )}

            {onOpenMemories && (
              <button
                onClick={onOpenMemories}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
              >
                <Brain className="w-3.5 h-3.5 text-slate-500" />
                <span>{isArabic ? 'الذاكرة طويلة المدى' : 'Long-term Memory'}</span>
              </button>
            )}

            {onOpenNotes && (
              <button
                onClick={onOpenNotes}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>{isArabic ? 'الملاحظات والمسودات' : 'Notes & Drafts'}</span>
              </button>
            )}

            {onOpenCalendar && (
              <button
                onClick={onOpenCalendar}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{isArabic ? 'التقويم والتذكيرات' : 'Calendar & Reminders'}</span>
              </button>
            )}

            {onOpenLocalFiles && (
              <button
                onClick={onOpenLocalFiles}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
              >
                <Folder className="w-3.5 h-3.5 text-slate-500" />
                <span>{isArabic ? 'الملفات المحلية' : 'Local Files'}</span>
              </button>
            )}

            {onOpenSkillsManager && (
              <button
                onClick={onOpenSkillsManager}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-pulse" />
                <span>{isArabic ? 'مهارات وإضافات آدم (Skills & MCP)' : 'Adam Skills & Extensions'}</span>
              </button>
            )}

            {onOpenApkModal && (
              <button
                onClick={onOpenApkModal}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition"
              >
                <Smartphone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{isArabic ? 'تنزيل تطبيق أندرويد (APK) 📱' : 'Download Android APK 📱'}</span>
              </button>
            )}

            {onOpenTrustModal && (
              <button
                onClick={onOpenTrustModal}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition mt-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{isArabic ? 'اعتماد قوقل والأمان 🛡️' : 'Google Verified 🛡️'}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Collapsed Icon Bar */
        <div className="flex-1 flex flex-col items-center py-3 gap-2 overflow-y-auto">
          {onOpenTrustModal && (
            <button
              onClick={onOpenTrustModal}
              className="p-2.5 rounded-xl text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 transition"
              title={isArabic ? 'شهادة توثيق واعتماد قوقل' : 'Google Verification Shield'}
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}

          {onOpenWorkspaceHub && (
            <button
              onClick={onOpenWorkspaceHub}
              className="p-2.5 rounded-xl text-blue-500 hover:bg-blue-500/10 transition"
              title={isArabic ? 'Google Workspace Hub' : 'Google Workspace'}
            >
              <Layers className="w-4 h-4" />
            </button>
          )}

          {onOpenMediaGenerator && (
            <button
              onClick={onOpenMediaGenerator}
              className="p-2.5 rounded-xl text-purple-500 hover:bg-purple-500/10 transition"
              title={isArabic ? 'استوديو نانو بنانة والفيديو' : 'Nano Banana Studio'}
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          )}

          {onOpenBackgroundTaskCenter && (
            <button
              onClick={onOpenBackgroundTaskCenter}
              className="p-2.5 rounded-xl text-teal-500 hover:bg-teal-500/10 transition"
              title={isArabic ? 'المهام ومراقبة الإيميل' : 'Tasks & Email Monitor'}
            >
              <Radio className="w-4 h-4" />
            </button>
          )}

          {onOpenNewsRadar && (
            <button
              onClick={onOpenNewsRadar}
              className="p-2.5 rounded-xl text-amber-500 hover:bg-amber-500/10 transition"
              title={isArabic ? 'رادار الأخبار والتعلم' : 'News Radar'}
            >
              <Activity className="w-4 h-4" />
            </button>
          )}

          {onOpenMemories && (
            <button
              onClick={onOpenMemories}
              className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              title={isArabic ? 'الذاكرة طويلة المدى' : 'Long-term Memory'}
            >
              <Brain className="w-4 h-4" />
            </button>
          )}

          {onOpenNotes && (
            <button
              onClick={onOpenNotes}
              className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              title={isArabic ? 'الملاحظات والمسودات' : 'Notes'}
            >
              <FileText className="w-4 h-4" />
            </button>
          )}

          {onOpenCalendar && (
            <button
              onClick={onOpenCalendar}
              className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              title={isArabic ? 'التقويم والتذكيرات' : 'Calendar'}
            >
              <Calendar className="w-4 h-4" />
            </button>
          )}

          {onOpenLocalFiles && (
            <button
              onClick={onOpenLocalFiles}
              className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              title={isArabic ? 'الملفات المحلية' : 'Local Files'}
            >
              <Folder className="w-4 h-4" />
            </button>
          )}

          {onOpenSkillsManager && (
            <button
              onClick={onOpenSkillsManager}
              className="p-2.5 rounded-xl text-purple-500 hover:bg-purple-500/10 transition"
              title={isArabic ? 'مهارات وإضافات آدم (Skills & MCP)' : 'Adam Skills & Extensions'}
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
            </button>
          )}

          {onOpenApkModal && (
            <button
              onClick={onOpenApkModal}
              className="p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition"
              title={isArabic ? 'تنزيل تطبيق أندرويد (APK)' : 'Download Android APK'}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
