import React, { useState, useEffect } from 'react';
import { X, Search, Trash2, Plus, MessageSquare, Calendar, ShieldCheck, UserCheck, LogIn, Sparkles } from 'lucide-react';
import { ConversationSession } from '../types';
import { auth, fastGoogleSignIn } from '../lib/workspaceAuth';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

import { isAppCreator, maskEmailAddress } from '../lib/quotaManager';

interface ChatHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ConversationSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  isArabic: boolean;
}

export const ChatHistoryDrawer: React.FC<ChatHistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isArabic,
}) => {
  const [query, setQuery] = useState('');
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setGoogleUser(user);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleSignIn = async () => {
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
    (s.title || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">
              {isArabic ? 'سجل المحادثات والذاكرة' : 'Chat History & Memory'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Google Authentication & Memory Status Notice */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          {googleUser ? (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="min-w-0 flex-1 text-[11px] leading-tight">
                <span className="font-bold block truncate">{googleUser.displayName || maskEmailAddress(googleUser.email)}</span>
                <span className="text-[10px] opacity-80">
                  {isArabic
                    ? '🔒 يتم حفظ كافة محادثاتك وتذكرها بشكل دائم عبر هذا الحساب.'
                    : '🔒 All chats and memories are permanently saved to your Google account.'}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-tight">
                  <span className="font-bold block mb-0.5">{isArabic ? 'وضع الضيف المؤقت' : 'Guest Mode'}</span>
                  <span className="text-[10px] opacity-90">
                    {isArabic
                      ? 'لا يتم حفظ المحادثات أو تذكرها بدون حساب. سجّل دخولك بحساب Google لتفعيل الحفظ والذاكرة الدائمة.'
                      : 'Conversations are not saved in guest mode. Sign in with Google to enable permanent memory.'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isArabic ? 'تسجيل الدخول بحساب Google' : 'Sign in with Google'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Search & New Chat Button */}
        <div className="p-4 space-y-3 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isArabic ? 'بدء محادثة جديدة' : 'Start New Chat'}</span>
          </button>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isArabic ? 'البحث في المحادثات...' : 'Search chats...'}
              className="w-full pl-9 rtl:pl-3 rtl:pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 theme-scrollbar">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              {isArabic ? 'لا توجد محادثات سابقة' : 'No previous chats found'}
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  onClose();
                }}
                className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between group ${
                  session.id === activeSessionId
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60'
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="overflow-hidden space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {session.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(session.updatedAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}</span>
                    <span>•</span>
                    <span>{session.messages.length} {isArabic ? 'رسائل' : 'msgs'}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition"
                  title={isArabic ? 'حذف المحادثة' : 'Delete Chat'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
