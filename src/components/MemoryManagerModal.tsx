import React, { useState, useEffect } from 'react';
import { X, Brain, Plus, Trash2, Search, Edit2, Check, Tag, Sparkles, ShieldCheck, UserCheck, LogIn } from 'lucide-react';
import { LongTermMemory } from '../types';
import { auth, fastGoogleSignIn } from '../lib/workspaceAuth';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

import { isAppCreator, maskEmailAddress } from '../lib/quotaManager';

interface MemoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: LongTermMemory[];
  onAddMemory: (fact: string, category: LongTermMemory['category']) => void;
  onUpdateMemory?: (id: string, newFact: string, category?: LongTermMemory['category']) => void;
  onDeleteMemory: (id: string) => void;
  onClearAll: () => void;
  isArabic: boolean;
}

export const MemoryManagerModal: React.FC<MemoryManagerModalProps> = ({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onClearAll,
  isArabic,
}) => {
  const [newFact, setNewFact] = useState('');
  const [category, setCategory] = useState<LongTermMemory['category']>('preference');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
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

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    onAddMemory(newFact.trim(), category);
    setNewFact('');
  };

  const startEditing = (mem: LongTermMemory) => {
    setEditingId(mem.id);
    setEditText(mem.fact);
  };

  const saveEdit = (id: string) => {
    if (editText.trim() && onUpdateMemory) {
      onUpdateMemory(id, editText.trim());
    }
    setEditingId(null);
  };

  const filteredMemories = memories.filter((m) => {
    const matchesQuery = m.fact.toLowerCase().includes(query.toLowerCase());
    const matchesCat = selectedCategoryFilter === 'all' || m.category === selectedCategoryFilter;
    return matchesQuery && matchesCat;
  });

  const categoriesMap: Record<string, { ar: string; en: string }> = {
    preference: { ar: 'تفضيل شخصي', en: 'Preference' },
    personal_info: { ar: 'معلومة شخصية', en: 'Personal Info' },
    habit: { ar: 'عادة وسلوك', en: 'Habit' },
    work: { ar: 'عمل ومشاريع', en: 'Work' },
    other: { ar: 'أخرى', en: 'Other' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-500/5 via-transparent to-purple-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>{isArabic ? 'الذاكرة طويلة المدى الذكية (Smart Memory)' : 'Smart Long-term Memory'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500 text-white font-black shadow-xs">
                  RAG Auto-Search 🧠
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isArabic
                  ? 'الحقائق والتفضيلات المعرفة عنك. يتعلمها الوكيل تلقائياً أو يمكنك إدارتها وتعديلها يدويًا.'
                  : 'Facts & preferences learned automatically or added manually for personalized responses.'}
              </p>
            </div>
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
            <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-200 text-xs">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <div className="min-w-0 flex-1 text-[11px] leading-tight">
                <span className="font-bold block truncate">{googleUser.displayName || maskEmailAddress(googleUser.email)}</span>
                <span className="text-[10px] opacity-80">
                  {isArabic
                    ? '🔒 الذاكرة والحقائق والتفضيلات محفوظة بشكل آمن ودائم على حسابك في Google.'
                    : '🔒 Your long-term memories and facts are securely saved to your Google account.'}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-tight">
                  <span className="font-bold block mb-0.5">{isArabic ? 'وضع الضيف المؤقت (الذاكرة غير دائمة)' : 'Guest Mode (No Permanent Memory)'}</span>
                  <span className="text-[10px] opacity-90">
                    {isArabic
                      ? 'الحقائق والذكريات لا يتم حفظها بشكل دائم بدون تسجيل الدخول. سجّل دخولك بحساب Google لتذكر كافة تفاصيلك ومحادثاتك.'
                      : 'Memories and facts are not saved permanently without sign-in. Sign in with Google to enable permanent memory.'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isArabic ? 'تسجيل الدخول بحساب Google' : 'Sign in with Google'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Form to add new memory */}
        <form onSubmit={handleAdd} className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>{isArabic ? 'إضافة حقيقة أو تفضيل جديد للذاكرة:' : 'Add a manual fact to memory:'}</span>
          </label>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <input
              type="text"
              value={newFact}
              onChange={(e) => setNewFact(e.target.value)}
              placeholder={isArabic ? 'مثال: أعمل كمصمم برمجيات، أفضل استخدام الوضع الليلي' : 'e.g., Software engineer, prefers concise code'}
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="preference">{isArabic ? 'تفضيل' : 'Preference'}</option>
              <option value="personal_info">{isArabic ? 'معلومة شخصية' : 'Personal Info'}</option>
              <option value="habit">{isArabic ? 'عادة' : 'Habit'}</option>
              <option value="work">{isArabic ? 'عمل ومشاريع' : 'Work'}</option>
              <option value="other">{isArabic ? 'أخرى' : 'Other'}</option>
            </select>
            <button
              type="submit"
              disabled={!newFact.trim()}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-purple-600/20 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isArabic ? 'حفظ الحقيقة' : 'Save Fact'}</span>
            </button>
          </div>
        </form>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isArabic ? 'البحث أو التصفية بالكلمات المفتاحية (RAG Search)...' : 'Search facts (RAG keyword filter)...'}
              className="w-full pl-9 rtl:pl-3 rtl:pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
                selectedCategoryFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {isArabic ? 'الكل' : 'All'} ({memories.length})
            </button>
            {Object.keys(categoriesMap).map((catKey) => {
              const count = memories.filter((m) => m.category === catKey).length;
              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategoryFilter(catKey)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
                    selectedCategoryFilter === catKey
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {isArabic ? categoriesMap[catKey].ar : categoriesMap[catKey].en} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Memory List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 theme-scrollbar">
          {filteredMemories.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs space-y-2">
              <Brain className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p>{isArabic ? 'لا توجد حقائق مطابقة بالذاكرة' : 'No matching facts found in memory'}</p>
            </div>
          ) : (
            filteredMemories.map((mem) => {
              const isEditing = editingId === mem.id;
              const catLabel = categoriesMap[mem.category] ? (isArabic ? categoriesMap[mem.category].ar : categoriesMap[mem.category].en) : mem.category;

              return (
                <div
                  key={mem.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 shadow-xs hover:border-purple-300 dark:hover:border-purple-800/50 transition"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                        {catLabel}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(mem.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-purple-500 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none"
                        />
                        <button
                          onClick={() => saveEdit(mem.id)}
                          className="p-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                        {mem.fact}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!isEditing && onUpdateMemory && (
                      <button
                        onClick={() => startEditing(mem)}
                        className="p-2 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition"
                        title={isArabic ? 'تعديل الحقيقة' : 'Edit memory'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteMemory(mem.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title={isArabic ? 'مسح هذه المعلومة' : 'Delete memory'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {memories.length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {isArabic ? `إجمالي الحقائق المخزنة: ${memories.length}` : `Total saved facts: ${memories.length}`}
            </span>
            <button
              onClick={onClearAll}
              className="font-bold text-rose-600 dark:text-rose-400 hover:underline"
            >
              {isArabic ? 'مسح كافة حقائق الذاكرة' : 'Clear All Memories'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
