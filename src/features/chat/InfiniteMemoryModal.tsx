import { useState, useMemo, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Plus,
  Trash2,
  Search,
  X,
  Tag,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import type { Language } from '../../core/domain';
import {
  getInfiniteMemories,
  addInfiniteMemory,
  removeInfiniteMemory,
  clearInfiniteMemory,
  getInfiniteMemoryStats,
  type InfiniteMemoryEntry,
} from '../../core/agent/infiniteMemory';

interface InfiniteMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export function InfiniteMemoryModal({
  isOpen,
  onClose,
  language,
}: InfiniteMemoryModalProps) {
  const [memories, setMemories] = useState<InfiniteMemoryEntry[]>([]);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<InfiniteMemoryEntry['category']>('preference');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | InfiniteMemoryEntry['category']>('all');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const isArabic = language === 'ar';

  const refresh = () => {
    setMemories(getInfiniteMemories());
  };

  useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen]);

  const stats = useMemo(() => getInfiniteMemoryStats(), [memories]);

  const filtered = useMemo(() => {
    let list = memories;
    if (activeFilter !== 'all') {
      list = list.filter((m) => m.category === activeFilter);
    }
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter((m) => m.content.toLowerCase().includes(q));
    }
    return list;
  }, [memories, activeFilter, searchQuery]);

  if (!isOpen) return null;

  const handleAdd = () => {
    const clean = newContent.trim();
    if (!clean) return;
    addInfiniteMemory(clean, newCategory, 'explicit');
    setNewContent('');
    refresh();
  };

  const handleRemove = (id: string) => {
    removeInfiniteMemory(id);
    refresh();
  };

  const handleClearAll = () => {
    clearInfiniteMemory();
    setShowConfirmClear(false);
    refresh();
  };

  const categoryLabels: Record<InfiniteMemoryEntry['category'], { ar: string; en: string }> = {
    preference: { ar: 'تفضيل', en: 'Preference' },
    fact: { ar: 'حقيقة شخصية', en: 'Fact' },
    instruction: { ar: 'تعليمات دائمة', en: 'Instruction' },
    topic: { ar: 'من محادثة سابقة', en: 'Past Chat Topic' },
    habit: { ar: 'عادة مكتسبة', en: 'Habit' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className="relative z-10 w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100"
        style={{ direction: isArabic ? 'rtl' : 'ltr' }}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-gradient-to-b from-indigo-950/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Brain size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {isArabic ? 'ذاكرة Adam اللانهائية (Infinite Memory)' : "Adam's Infinite Memory"}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {isArabic ? 'متصلة ونشطة' : 'Active'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isArabic
                  ? 'يتذكر Adam سياقك وهويتك وتفضيلاتك عبر جميع المحادثات الجديدة دون فقدان أي معلومة.'
                  : 'Adam remembers your context, identity, and preferences across all new chats forever.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats Row */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/50 flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-indigo-300">
            <Sparkles size={14} />
            <span>{isArabic ? 'إجمالي الذكريات المحفوظة:' : 'Total retained memories:'}</span>
            <strong className="text-white font-mono bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-800/60">
              {stats.total}
            </strong>
          </div>
          <div className="h-3 w-px bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>{isArabic ? 'تفضيلات:' : 'Preferences:'}</span>
            <strong className="text-slate-200">{stats.preferences}</strong>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>{isArabic ? 'حقائق:' : 'Facts:'}</span>
            <strong className="text-slate-200">{stats.facts}</strong>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>{isArabic ? 'سياق جلسات سابقة:' : 'Past topics:'}</span>
            <strong className="text-slate-200">{stats.topics}</strong>
          </div>
        </div>

        {/* Quick Add Form */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/30">
          <span className="text-[11px] font-semibold text-indigo-300 block mb-2">
            {isArabic ? '+ أضف معلومة أو تفضيلاً دائماً إلى ذاكرة Adam:' : '+ Add a permanent rule/preference to memory:'}
          </span>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder={
                isArabic
                  ? 'مثلاً: أفضل كتابة الكود بلغة Python مع تعليقات مفصلة...'
                  : 'E.g., I prefer concise answers with clean TypeScript...'
              }
              className="flex-1 py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as InfiniteMemoryEntry['category'])}
              className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="preference">{categoryLabels.preference[language]}</option>
              <option value="fact">{categoryLabels.fact[language]}</option>
              <option value="instruction">{categoryLabels.instruction[language]}</option>
            </select>
            <button
              onClick={handleAdd}
              disabled={!newContent.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shrink-0 shadow-sm"
            >
              <Plus size={14} />
              <span>{isArabic ? 'تثبيت في الذاكرة' : 'Remember'}</span>
            </button>
          </div>
        </div>

        {/* Filter Pills & Search */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-900/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'preference', 'fact', 'instruction', 'topic'] as const).map((cat) => {
              const active = activeFilter === cat;
              const label = cat === 'all' ? (isArabic ? 'الكل' : 'All') : categoryLabels[cat][language];
              return (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[200px]">
            <Search
              size={13}
              className={`absolute top-2.5 text-slate-400 ${
                isArabic ? 'right-2.5' : 'left-2.5'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isArabic ? 'تصفية الذكريات…' : 'Filter memories…'}
              className={`w-full py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition ${
                isArabic ? 'pr-8 pl-2.5' : 'pl-8 pr-2.5'
              }`}
            />
          </div>
        </div>

        {/* Memories List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ShieldCheck size={36} className="mx-auto mb-2 opacity-30 text-indigo-400" />
              <p className="text-xs">
                {isArabic
                  ? 'لا توجد عناصر في هذا القسم بعد. تحدث مع Adam في أي محادثة وسيستخلص معلوماتك تلقائياً.'
                  : 'No memory entries in this section yet. Chat with Adam and he will automatically capture your preferences.'}
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 flex items-start justify-between gap-3 group transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                      <Tag size={10} />
                      {categoryLabels[item.category]?.[language] || item.category}
                    </span>
                    {item.conversationTitle && (
                      <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                        {isArabic ? `المصدر: ${item.conversationTitle}` : `From: ${item.conversationTitle}`}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed break-words">
                    {item.content}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition shrink-0 opacity-0 group-hover:opacity-100"
                  title={isArabic ? 'حذف من الذاكرة' : 'Delete'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
            <CheckCircle2 size={14} />
            <span>
              {isArabic
                ? 'الذاكرة نشطة ومحقونة تلقائياً في كل محادثة جديدة'
                : 'Memory active and auto-injected into every new chat'}
            </span>
          </div>

          {showConfirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-rose-400 text-xs">
                {isArabic ? 'مسح كل الذاكرة؟' : 'Clear all memory?'}
              </span>
              <button
                onClick={handleClearAll}
                className="px-2.5 py-1 rounded bg-rose-600 text-white text-xs font-bold hover:bg-rose-500"
              >
                {isArabic ? 'نعم، مسح' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="text-slate-400 hover:text-rose-400 text-[11px] transition"
            >
              {isArabic ? 'إعادة ضبط الذاكرة' : 'Reset memory'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
