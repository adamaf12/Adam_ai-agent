import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Calculator,
  Search,
  BookOpen,
  Copy,
  Check,
  Filter,
  Flame,
  Binary,
  Atom,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import type { AcademicStage } from './types';
import { COMPREHENSIVE_FORMULA_SHEETS } from './formulaSheetsData';

interface FormulaCheatSheetsViewProps {
  language: 'ar' | 'en';
  selectedStage: AcademicStage;
  onNavigateToChat?: (prompt: string) => void;
}

export function FormulaCheatSheetsView({
  language,
  selectedStage,
  onNavigateToChat,
}: FormulaCheatSheetsViewProps) {
  const isAr = language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Available categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    COMPREHENSIVE_FORMULA_SHEETS.forEach((f) => set.add(f.category));
    return ['all', ...Array.from(set)];
  }, []);

  // Filter formulas
  const filteredFormulas = useMemo(() => {
    return COMPREHENSIVE_FORMULA_SHEETS.filter((f) => {
      const matchStage = f.stage === selectedStage;
      const matchCategory = selectedCategory === 'all' || f.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        f.nameAr.toLowerCase().includes(q) ||
        f.nameEn.toLowerCase().includes(q) ||
        f.formula.toLowerCase().includes(q) ||
        f.explanationAr.toLowerCase().includes(q);
      return matchStage && matchCategory && matchQuery;
    });
  }, [selectedStage, selectedCategory, searchQuery]);

  const copyFormula = (formula: string, id: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5" />
              {isAr ? 'كناش القوانين والمعادلات الذهبية' : 'Master Formula Sheets & Reference Cards'}
            </span>
          </div>
          <h2 className="text-xl font-black text-[var(--foreground)]">
            {isAr ? 'القوانين، العلاقات الرياضية والفيزيائية للطور المختار' : 'Essential Mathematical & Physical Formulas'}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1">
            {isAr
              ? 'مكتبة سريعة للقوانين مع الشرح والأمثلة الحسابية لتسهيل الحفظ والمراجعة للامتحانات.'
              : 'Direct formula cheat sheets with explanations and applied examples for immediate exam recall.'}
          </p>
        </div>

        {/* Ask Adam to explain any formula */}
        {onNavigateToChat && (
          <button
            onClick={() => onNavigateToChat(isAr ? 'آدم، اشرح لي برهان قانون فيزيائي أو رياضي خطوة بخطوة' : 'Adam, prove and explain a physics or math formula step by step')}
            className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 flex items-center gap-2 shrink-0 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAr ? 'برهان واستنتاج قانون مع آدم' : 'Derive Formula with Adam'}</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--foreground-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'ابحث عن قانون (مثال: فيثاغورس، أوم، نيوتن، اشتقاق)...' : 'Search formula, theorem, or equation...'}
            className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--foreground)] focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Filter className="w-4 h-4 text-[var(--foreground-muted)] shrink-0 hidden sm:block" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow'
                  : 'bg-[var(--surface)] text-[var(--foreground-muted)] border-[var(--border)] hover:text-[var(--foreground)]'
              }`}
            >
              {cat === 'all' ? (isAr ? 'الكل' : 'All') : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Formulas Grid */}
      {filteredFormulas.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground-muted)] text-xs space-y-2">
          <BookOpen className="w-8 h-8 mx-auto text-[var(--foreground-muted)] opacity-50" />
          <p>{isAr ? 'لم يتم العثور على قوانين مطابقة لبحثك في هذا الطور.' : 'No formulas found matching your filter in this tier.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFormulas.map((f) => {
            const isCopied = copiedId === f.id;
            return (
              <motion.div
                key={f.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-amber-500/40 transition-all shadow-sm space-y-3.5 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {f.category}
                    </span>
                    <h3 className="font-bold text-sm text-[var(--foreground)] mt-1.5">
                      {isAr ? f.nameAr : f.nameEn}
                    </h3>
                  </div>

                  <button
                    onClick={() => copyFormula(f.formula, f.id)}
                    className="p-2 rounded-xl bg-[var(--surface-sunken)] hover:bg-[var(--surface-elevated)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors shrink-0"
                    title={isAr ? 'نسخ القانون' : 'Copy Formula'}
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Formula Highlight Box */}
                <div className="p-3 rounded-2xl bg-neutral-950/80 border border-amber-500/30 text-amber-300 font-mono text-xs sm:text-sm font-black tracking-wide text-center overflow-x-auto shadow-inner">
                  {f.formula}
                </div>

                {/* Explanation */}
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                  {isAr ? f.explanationAr : f.explanationEn}
                </p>

                {/* Applied Example */}
                <div className="p-3 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border)] text-[11px] text-[var(--foreground-muted)]">
                  <span className="font-bold text-emerald-400 block mb-0.5">
                    {isAr ? 'مثال تطبيقي عددي:' : 'Applied Example:'}
                  </span>
                  <span className="text-[var(--foreground)] font-mono">{isAr ? f.exampleAr : f.exampleEn}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
