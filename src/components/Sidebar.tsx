import { useState, useMemo } from 'react';
import {
  Brain,
  Check,
  Edit2,
  MessageSquare,
  PanelLeftClose,
  Plus,
  Search,
  Settings2,
  Trash2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { ChatConversation, Language } from '../core/domain';
import { BrandMark } from './BrandMark';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  language: Language;
  conversations: ChatConversation[];
  activeId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onOpenSettings: () => void;
  memoryCount?: number;
}

export function Sidebar({
  isOpen,
  onToggle: _onToggle,
  onClose,
  language,
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onOpenSettings,
  memoryCount = 0,
}: SidebarProps) {
  const isAr = language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter conversations by query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase().trim();
    return conversations.filter((c) =>
      (c.title || '').toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const handleStartRename = (c: ChatConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title || (isAr ? 'محادثة جديدة' : 'New conversation'));
  };

  const handleSaveRename = (id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleDeleteConfirm = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteConversation(id);
    setDeletingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden cursor-pointer"
            aria-label="Close sidebar backdrop"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 ${
          isAr ? 'right-0' : 'left-0'
        } z-40 flex flex-col w-72 sm:w-80 h-full bg-[var(--surface)]/95 border-e border-[var(--border)] backdrop-blur-2xl transition-all duration-300 ease-in-out select-none ${
          isOpen
            ? 'translate-x-0 shadow-2xl lg:shadow-none'
            : isAr
            ? 'translate-x-full lg:hidden'
            : '-translate-x-full lg:hidden'
        }`}
      >
        {/* Header: Brand & Close/Collapse */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <BrandMark compact />
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-[var(--text)]">ADEM</span>
              <span className="text-[10px] text-[var(--muted)] font-mono">AI Executive</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--text)] flex items-center justify-center transition cursor-pointer active:scale-95"
            title={isAr ? 'إغلاق الشريط الجانبي' : 'Close Sidebar'}
            aria-label="Close Sidebar"
          >
            <PanelLeftClose size={16} className={isAr ? 'rotate-180' : ''} />
          </button>
        </div>

        {/* New Chat CTA Button */}
        <div className="p-3">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full py-2.5 px-3.5 rounded-2xl bg-[var(--accent-subtle)] hover:bg-[var(--accent)] text-[var(--accent)] hover:text-slate-950 border border-[var(--accent)]/30 hover:border-transparent font-bold text-xs flex items-center justify-between transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.98] group"
          >
            <div className="flex items-center gap-2">
              <Plus size={16} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-200" />
              <span>{isAr ? 'محادثة جديدة' : 'New Chat'}</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--surface)]/80 text-[var(--text-secondary)] font-mono">
              Alt+N
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-3 pb-2">
          <div className="relative flex items-center">
            <Search size={14} className={`absolute ${isAr ? 'right-3' : 'left-3'} text-[var(--muted)] pointer-events-none`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث في المحادثات...' : 'Search conversations...'}
              className={`w-full py-1.5 text-xs bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors ${
                isAr ? 'pr-8 pl-7' : 'pl-8 pr-7'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`absolute ${isAr ? 'left-2.5' : 'right-2.5'} text-[var(--muted)] hover:text-[var(--text)] text-xs`}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List Scroll */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 scrollbar-thin">
          <div className="px-2 py-1 text-[11px] font-semibold text-[var(--muted)] flex items-center justify-between">
            <span>{isAr ? 'المحادثات السابقة' : 'Recent Chats'}</span>
            <span className="font-mono text-[10px]">{filteredConversations.length}</span>
          </div>

          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--muted)]">
              {searchQuery
                ? isAr
                  ? 'لا توجد نتائج مطابقة'
                  : 'No matching conversations'
                : isAr
                ? 'لا توجد محادثات سابقة'
                : 'No conversations yet'}
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = activeId === c.id;
              const isEditing = editingId === c.id;
              const isDeleting = deletingId === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    if (!isEditing && !isDeleting) {
                      onSelectConversation(c.id);
                      if (window.innerWidth < 1024) onClose();
                    }
                  }}
                  className={`group relative flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold border border-[var(--accent)]/30 shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                    <MessageSquare size={14} className={isActive ? 'text-[var(--accent)] shrink-0' : 'text-[var(--muted)] shrink-0'} />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(c.id, e);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-2 py-0.5 bg-[var(--surface)] border border-[var(--accent)] rounded-lg text-xs text-[var(--text)] focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="truncate">
                        {c.title || (isAr ? 'محادثة جديدة' : 'New conversation')}
                      </span>
                    )}
                  </div>

                  {/* Actions (Rename, Delete, Save) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {isEditing ? (
                      <button
                        type="button"
                        onClick={(e) => handleSaveRename(c.id, e)}
                        className="p-1 rounded-md hover:bg-[var(--surface)] text-emerald-400"
                        title={isAr ? 'حفظ' : 'Save'}
                      >
                        <Check size={12} />
                      </button>
                    ) : isDeleting ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteConfirm(c.id, e)}
                          className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white text-[10px] font-bold"
                        >
                          {isAr ? 'حذف؟' : 'Del?'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(null);
                          }}
                          className="p-1 rounded hover:bg-[var(--surface)] text-[var(--muted)]"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(c, e)}
                          className="p-1 rounded-md hover:bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)]"
                          title={isAr ? 'تعديل العنوان' : 'Rename'}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(c.id);
                          }}
                          className="p-1 rounded-md hover:bg-[var(--surface)] text-[var(--muted)] hover:text-rose-400"
                          title={isAr ? 'حذف' : 'Delete'}
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Memory Status & Settings */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-2)]/50 space-y-2">
          {memoryCount > 0 && (
            <div className="flex items-center justify-between px-2 py-1 text-[11px] text-[var(--muted)] font-medium">
              <span className="flex items-center gap-1.5">
                <Brain size={12} className="text-cyan-400" />
                <span>{isAr ? 'ذاكرة متصلة' : 'Infinite Memory'}</span>
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-mono text-[10px]">
                {memoryCount}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              onOpenSettings();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Settings2 size={15} className="text-[var(--accent)]" />
              <span>{isAr ? 'الإعدادات والمظهر' : 'Settings & Themes'}</span>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}
