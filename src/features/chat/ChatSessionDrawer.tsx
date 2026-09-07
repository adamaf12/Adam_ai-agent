import {
  Brain,
  Clock,
  MessageSquare,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
  Check,
  Edit2,
  ChevronRight,
  Shield,
  Layers,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import type { ChatConversation, Language } from '../../core/domain';

interface ChatSessionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentConversation: ChatConversation;
  conversationsCount: number;
  memoryCount: number;
  agentStatus: string;
  onNewChat: () => void;
  onOpenHistory: () => void;
  onOpenMemory: () => void;
  onClearCurrentMessages: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
}

export function ChatSessionDrawer({
  isOpen,
  onClose,
  language,
  currentConversation,
  conversationsCount,
  memoryCount,
  agentStatus,
  onNewChat,
  onOpenHistory,
  onOpenMemory,
  onClearCurrentMessages,
  onRenameConversation,
}: ChatSessionDrawerProps) {
  const isAr = language === 'ar';
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const handleStartRename = () => {
    setTitleDraft(currentConversation.title || (isAr ? 'محادثة جديدة' : 'New conversation'));
    setIsEditingTitle(true);
  };

  const handleSaveRename = () => {
    if (titleDraft.trim()) {
      onRenameConversation(currentConversation.id, titleDraft.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} aria-label="Close modal" />

      {/* Side Panel Drawer */}
      <div
        className="relative w-full max-w-sm sm:max-w-md h-full bg-slate-900 border-s border-emerald-500/20 shadow-2xl flex flex-col z-10 text-slate-100 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #091510 0%, #0c1c16 100%)',
        }}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-emerald-500/15 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                {isAr ? 'لوحة تحكم الجلسة' : 'Session Control Panel'}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-xs text-emerald-300/90 font-medium">
                  {agentStatus || (isAr ? 'جاهز ومتصل' : 'Ready & Connected')}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 text-slate-400 hover:text-white flex items-center justify-center transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body Scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Active Conversation Details Card */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <MessageSquare size={14} />
                {isAr ? 'المحادثة النشطة' : 'Active Conversation'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 font-mono text-[11px]">
                {currentConversation.messages.length} {isAr ? 'رسالة' : 'messages'}
              </span>
            </div>

            {isEditingTitle ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                  className="flex-1 px-3 py-1.5 bg-slate-950/80 border border-emerald-500/40 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-400"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveRename}
                  className="p-2 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition"
                  title="Save"
                >
                  <Check size={15} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-sm font-semibold text-slate-100 line-clamp-2">
                  {currentConversation.title || (isAr ? 'محادثة جديدة' : 'New conversation')}
                </p>
                <button
                  type="button"
                  onClick={handleStartRename}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition"
                  title={isAr ? 'تعديل العنوان' : 'Rename'}
                >
                  <Edit2 size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Quick Hub Actions */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              {isAr ? 'الوصول السريع والأدوات' : 'Quick Access & Tools'}
            </h3>

            {/* New Chat Action */}
            <button
              type="button"
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="w-full p-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center justify-between shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5">
                <Plus size={16} strokeWidth={2.5} />
                <span>{isAr ? 'بدء محادثة جديدة' : 'Start New Chat'}</span>
              </div>
              <span className="text-[11px] opacity-80 font-mono">⌘N</span>
            </button>

            {/* History Drawer Trigger */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenHistory();
              }}
              className="w-full p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/30 text-slate-200 text-xs flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition">
                  <Clock size={16} />
                </div>
                <div className="text-start">
                  <div className="font-semibold text-white">
                    {isAr ? 'سجل المحادثات السابقة' : 'Conversation History'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {isAr ? `${conversationsCount} محادثات محفوظة` : `${conversationsCount} saved chats`}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-500 group-hover:text-amber-400 transition" />
            </button>

            {/* Infinite Memory Trigger */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenMemory();
              }}
              className="w-full p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/30 text-slate-200 text-xs flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition">
                  <Brain size={16} />
                </div>
                <div className="text-start">
                  <div className="font-semibold text-white">
                    {isAr ? 'الذاكرة اللانهائية المعرفية' : 'Infinite Cognitive Memory'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {isAr ? `${memoryCount} حقائق وقواعد متعلمة` : `${memoryCount} learned rules & facts`}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-500 group-hover:text-indigo-400 transition" />
            </button>
          </div>

          {/* Session Management */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              {isAr ? 'إدارة محتوى الجلسة' : 'Session Management'}
            </h3>

            {confirmClear ? (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 space-y-2.5 text-xs">
                <p className="text-red-200 font-medium">
                  {isAr
                    ? 'هل أنت متأكد من مسح جميع رسائل هذه المحادثة؟'
                    : 'Are you sure you want to clear all messages in this conversation?'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClearCurrentMessages();
                      setConfirmClear(false);
                      onClose();
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition"
                  >
                    {isAr ? 'نعم، مسح' : 'Yes, Clear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                disabled={currentConversation.messages.length === 0}
                className="w-full p-3 rounded-xl bg-slate-900/80 hover:bg-red-950/30 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-300 text-xs font-medium flex items-center gap-2.5 transition disabled:opacity-40 disabled:pointer-events-none"
              >
                <Trash2 size={15} />
                <span>{isAr ? 'مسح رسائل هذه المحادثة فقط' : 'Clear Current Messages'}</span>
              </button>
            )}
          </div>

          {/* Intelligence Capabilities Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <Zap size={14} />
              <span>{isAr ? 'الميزات الذكية النشطة' : 'Active Intelligence Engine'}</span>
            </div>
            <p className="leading-relaxed">
              {isAr
                ? 'مساعدك Adam يتعلم تفضيلاتك تلقائياً ويدمج البحث الحي والتفكير العميق وتوليد الوسائط بدقة 8K.'
                : 'Adam continuously consolidates memories, performs deep reasoning, web searches, and 8K media generation.'}
            </p>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-center">
          <p className="text-[11px] text-slate-500 font-mono">
            ADEM AI • Autonomous Executive Model
          </p>
        </div>
      </div>
    </div>
  );
}
