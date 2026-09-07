import { useState, useMemo } from 'react';
import {
  Clock,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  X,
  Edit2,
  Check,
  Sparkles,
} from 'lucide-react';
import type { ChatConversation, Language } from '../../core/domain';

interface ChatHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ChatConversation[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onClearAll: () => void;
  language: Language;
}

export function ChatHistoryDrawer({
  isOpen,
  onClose,
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onClearAll,
  language,
}: ChatHistoryDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isArabic = language === 'ar';

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  // Group by date
  const grouped = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const today: ChatConversation[] = [];
    const yesterday: ChatConversation[] = [];
    const thisWeek: ChatConversation[] = [];
    const older: ChatConversation[] = [];

    for (const c of filtered) {
      const diff = now - (c.updatedAt || c.createdAt || now);
      if (diff < oneDay) {
        today.push(c);
      } else if (diff < 2 * oneDay) {
        yesterday.push(c);
      } else if (diff < 7 * oneDay) {
        thisWeek.push(c);
      } else {
        older.push(c);
      }
    }

    return [
      { label: isArabic ? 'اليوم' : 'Today', items: today },
      { label: isArabic ? 'الأمس' : 'Yesterday', items: yesterday },
      { label: isArabic ? 'الأسبوع الحالي' : 'This Week', items: thisWeek },
      { label: isArabic ? 'المحادثات الأقدم' : 'Older', items: older },
    ].filter((g) => g.items.length > 0);
  }, [filtered, isArabic]);

  if (!isOpen) return null;

  const handleStartRename = (c: ChatConversation) => {
    setEditingId(c.id);
    setEditingTitle(c.title);
  };

  const handleSaveRename = (id: string) => {
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div
        className={`relative z-10 w-full max-w-md bg-slate-900 border-x border-slate-800 flex flex-col h-full shadow-2xl text-slate-100 ${
          isArabic ? 'mr-auto' : 'ml-auto'
        }`}
        style={{ direction: isArabic ? 'rtl' : 'ltr' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Clock size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {isArabic ? 'سجل المحادثات' : 'Chat History'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isArabic
                  ? `${conversations.length} محادثة محفوظة وآمنة`
                  : `${conversations.length} saved sessions`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-sm"
              title={isArabic ? 'محادثة جديدة' : 'New Chat'}
            >
              <Plus size={14} />
              <span>{isArabic ? 'جديدة' : 'New'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-900/50">
          <div className="relative">
            <Search
              size={15}
              className={`absolute top-2.5 text-slate-400 ${
                isArabic ? 'right-3' : 'left-3'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isArabic ? 'ابحث في محادثاتك السابقة…' : 'Search previous chats…'
              }
              className={`w-full py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition ${
                isArabic ? 'pr-9 pl-3' : 'pl-9 pr-3'
              }`}
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {grouped.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <MessageSquare size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-xs">
                {searchQuery
                  ? isArabic
                    ? 'لم يتم العثور على محادثات تطابق البحث'
                    : 'No matching conversations found'
                  : isArabic
                  ? 'لا توجد محادثات سابقة بعد'
                  : 'No previous conversations yet'}
              </p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.label} className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
                  {group.label}
                </span>
                <div className="space-y-1">
                  {group.items.map((conv) => {
                    const isActive = conv.id === activeId;
                    const isEditing = editingId === conv.id;

                    return (
                      <div
                        key={conv.id}
                        className={`group relative flex items-center justify-between p-2.5 rounded-xl border transition ${
                          isActive
                            ? 'bg-indigo-950/40 border-indigo-600/50 text-white'
                            : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/60 text-slate-200'
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 w-full">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(conv.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              autoFocus
                              className="flex-1 bg-slate-900 border border-indigo-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                            />
                            <button
                              onClick={() => handleSaveRename(conv.id)}
                              className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-500"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                onSelectConversation(conv.id);
                                onClose();
                              }}
                              className="flex-1 min-w-0 text-start flex flex-col gap-0.5"
                            >
                              <div className="flex items-center gap-1.5">
                                {isActive && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                )}
                                <span className="text-xs font-medium truncate block">
                                  {conv.title || (isArabic ? 'محادثة' : 'Chat')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span>
                                  {conv.messages.length}{' '}
                                  {isArabic ? 'رسالة' : 'msgs'}
                                </span>
                                <span>•</span>
                                <span>
                                  {new Date(conv.updatedAt || conv.createdAt || Date.now()).toLocaleTimeString(
                                    isArabic ? 'ar-SA' : 'en-US',
                                    { hour: '2-digit', minute: '2-digit' }
                                  )}
                                </span>
                              </div>
                            </button>

                            {/* Hover action buttons or delete confirmation */}
                            {deletingId === conv.id ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-rose-400">{isArabic ? 'متأكد؟' : 'Delete?'}</span>
                                <button
                                  onClick={() => {
                                    onDeleteConversation(conv.id);
                                    setDeletingId(null);
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-500"
                                >
                                  {isArabic ? 'نعم' : 'Yes'}
                                </button>
                                <button
                                  onClick={() => setDeletingId(null)}
                                  className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]"
                                >
                                  {isArabic ? 'لا' : 'No'}
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleStartRename(conv)}
                                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                  title={isArabic ? 'إعادة تسمية' : 'Rename'}
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => setDeletingId(conv.id)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                                  title={isArabic ? 'حذف' : 'Delete'}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info & clear all */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1">
            <Sparkles size={13} className="text-indigo-400" />
            {isArabic ? 'محفوظ محلياً ومستمر' : 'Locally stored & persistent'}
          </span>
          {confirmClearAll ? (
            <div className="flex items-center gap-1.5">
              <span className="text-rose-400 text-[10px]">
                {isArabic ? 'متأكد؟' : 'Sure?'}
              </span>
              <button
                onClick={() => {
                  onClearAll();
                  setConfirmClearAll(false);
                  onClose();
                }}
                className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-500"
              >
                {isArabic ? 'نعم، امسح' : 'Yes'}
              </button>
              <button
                onClick={() => setConfirmClearAll(false)}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]"
              >
                {isArabic ? 'إلغاء' : 'No'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClearAll(true)}
              className="text-slate-400 hover:text-rose-400 transition"
            >
              {isArabic ? 'مسح كل السجل' : 'Clear all'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
