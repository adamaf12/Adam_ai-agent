import React, { useMemo, useState, useRef } from 'react';
import {
  Brain,
  Plus,
  Trash2,
  Search,
  Sparkles,
  Edit3,
  Check,
  X,
  Copy,
  Download,
  Upload,
  Layers,
  Target,
  FileText,
  Compass,
  ShieldCheck,
  Tag,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { Language, Memory as MemoryItem, MemoryCategory } from '../../core/domain';
import { loadMemories, saveMemories } from '../../core/storage/collections';

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const i18n = {
  ar: {
    title: 'خزينة الذاكرة طويلة المدى',
    subtitle: 'المعارف والتفضيلات والتعليمات المستمرة التي يتذكرها آدم ويبني عليها قراراته في كافة المحادثات والمهام.',
    badge: 'خزينة معرفية دائمة',
    totalMemories: 'إجمالي الذكريات',
    statActive: 'عنصر نشط',
    searchPh: 'ابحث في الذاكرة بالكلمات أو المفاهيم...',
    addTitle: 'إضافة ذاكرة أو توجيه جديد',
    inputPh: 'اكتب ما ترغب أن يتذكره آدم دائماً (مثلاً: أسلوب الردود، أولويات المشاريع، تفضيلات الكود)...',
    saveBtn: 'حفظ في الذاكرة',
    cancelBtn: 'إلغاء',
    updateBtn: 'تحديث',
    categoryLabel: 'نوع الذاكرة:',
    categories: {
      all: 'جميع المعارف',
      preference: 'تفضيلات المستخدم',
      goal: 'أهداف ومشاريع',
      fact: 'حقائق ومعلومات',
      instruction: 'تعليمات وقواعد تشغيل',
    },
    quickPresetsTitle: 'قوالب توجيه سريعة بنقرة واحدة:',
    presets: [
      {
        label: 'النبرة التنفيذية المباشرة',
        category: 'instruction' as MemoryCategory,
        text: 'أفضّل دائماً الإجابات التنفيذية المباشرة والموجزة، وبدء الحل بالأكواد والخطوات فوراً دون مقدمات أو وعظ.',
      },
      {
        label: 'اللغة الفصحى الرصينة',
        category: 'preference' as MemoryCategory,
        text: 'استخدام اللغة العربية الفصحى الرصينة والواضحة مع المصطلحات التقنية الإنجليزية عند الحاجة.',
      },
      {
        label: 'بيئة العمل والأنظمة',
        category: 'fact' as MemoryCategory,
        text: 'بيئة العمل المفضلة: نظام لينكس (Mint/Debian) وأندرويد (Termux)، مع التركيز على حاويات Docker ومشاريع TypeScript وPython.',
      },
      {
        label: 'بيانات الحساب والمطور',
        category: 'fact' as MemoryCategory,
        text: 'اسم المستخدم الرئيسي: معمر فيدات (Maamar Feidat) - البريد: maamarfeidat@gmail.com.',
      },
      {
        label: 'هدف تطوير التطبيقات',
        category: 'goal' as MemoryCategory,
        text: 'الهدف المستمر: بناء تطبيقات وأدوات عالية الفخامة والإنتاجية بلمسات تقنية متقدمة وتصميم مريح.',
      },
    ],
    emptyTitle: 'خزينة الذاكرة بانتظار توجيهاتك',
    emptySub: 'لم يتم حفظ أي تعليمات بعد. يمكنك إضافة توجيهك الأول أو اختيار أحد القوالب السريعة أعلاه.',
    copied: 'تم النسخ بنجاح',
    exportJson: 'تصدير JSON',
    exportMd: 'تصدير Markdown',
    importBtn: 'استيراد ذاكرة',
    deleteConfirm: 'هل أنت متأكد من حذف هذه الذاكرة؟',
    editTooltip: 'تعديل',
    deleteTooltip: 'حذف',
    copyTooltip: 'نسخ المحتوى',
  },
  en: {
    title: 'Long-Term Memory Vault',
    subtitle: 'Persistent preferences, core directives, and factual knowledge Adam remembers across all sessions.',
    badge: 'Persistent Knowledge',
    totalMemories: 'Total Memories',
    statActive: 'Active Elements',
    searchPh: 'Search memory by keyword or concept...',
    addTitle: 'Add New Directive or Knowledge',
    inputPh: 'Enter what Adam should remember permanently (e.g. response tone, priority projects, coding guidelines)...',
    saveBtn: 'Save to Memory',
    cancelBtn: 'Cancel',
    updateBtn: 'Update',
    categoryLabel: 'Category:',
    categories: {
      all: 'All Knowledge',
      preference: 'User Preferences',
      goal: 'Goals & Milestones',
      fact: 'Facts & Context',
      instruction: 'Rules & Directives',
    },
    quickPresetsTitle: 'Instant Quick Directives:',
    presets: [
      {
        label: 'Direct Executive Tone',
        category: 'instruction' as MemoryCategory,
        text: 'Always provide direct, concise executive answers. Lead immediately with code and solutions without fluff or moralizing.',
      },
      {
        label: 'Professional Eloquence',
        category: 'preference' as MemoryCategory,
        text: 'Use clear, eloquent Arabic or English with precise technical terminology and structured hierarchy.',
      },
      {
        label: 'Operating Environment',
        category: 'fact' as MemoryCategory,
        text: 'Target environment: Linux (Mint/Debian) & Android (Termux). Prioritize Docker, TypeScript, and Python solutions.',
      },
      {
        label: 'Developer Profile',
        category: 'fact' as MemoryCategory,
        text: 'Primary User: Maamar Feidat — Email: maamarfeidat@gmail.com.',
      },
      {
        label: 'App Excellence Goal',
        category: 'goal' as MemoryCategory,
        text: 'Continuous goal: Deliver high-prestige, deeply functional apps with clean luxury aesthetics and maximum productivity.',
      },
    ],
    emptyTitle: 'Memory Vault is Empty',
    emptySub: 'No memories saved yet. Add your first directive or pick a quick preset above.',
    copied: 'Copied to clipboard',
    exportJson: 'Export JSON',
    exportMd: 'Export Markdown',
    importBtn: 'Import Memory',
    deleteConfirm: 'Are you sure you want to delete this memory?',
    editTooltip: 'Edit',
    deleteTooltip: 'Delete',
    copyTooltip: 'Copy Content',
  },
};

export function Memory({ language }: { language: Language }) {
  const t = i18n[language];
  const isAr = language === 'ar';

  const [items, setItems] = useState<MemoryItem[]>(() => {
    const loaded = loadMemories();
    if (loaded && loaded.length > 0) return loaded;
    // Seed with high-value default memory items if empty
    const now = Date.now();
    const seeds: MemoryItem[] = [
      {
        id: uid(),
        content: isAr
          ? 'المستخدم: معمر فيدات (maamarfeidat@gmail.com) — المطور والمالك لتطبيق آدم الذكي.'
          : 'User: Maamar Feidat (maamarfeidat@gmail.com) — Developer and owner of Adam AI.',
        category: 'fact',
        createdAt: now - 3600000 * 24,
        updatedAt: now - 3600000 * 24,
      },
      {
        id: uid(),
        content: isAr
          ? 'أفضّل الأسلوب التنفيذي المباشر: تقديم الحلول والبرمجيات الصريحة والأكواد دون إطالة ولا وعظ.'
          : 'Executive direct style preferred: Deliver direct code, solutions, and actions with zero boilerplate fluff.',
        category: 'instruction',
        createdAt: now - 3600000 * 12,
        updatedAt: now - 3600000 * 12,
      },
    ];
    saveMemories(seeds);
    return seeds;
  });

  const [draft, setDraft] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory>('preference');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | MemoryCategory>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<MemoryCategory>('preference');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter items
  const filtered = useMemo(() => {
    return items.filter((x) => {
      const matchCat = activeFilter === 'all' || x.category === activeFilter;
      const matchQuery =
        !searchQuery.trim() ||
        x.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.categories[x.category]?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [items, activeFilter, searchQuery, t.categories]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: items.length,
      preference: items.filter((x) => x.category === 'preference').length,
      goal: items.filter((x) => x.category === 'goal').length,
      fact: items.filter((x) => x.category === 'fact').length,
      instruction: items.filter((x) => x.category === 'instruction').length,
    };
  }, [items]);

  const handleAdd = (customText?: string, customCat?: MemoryCategory) => {
    const text = (customText ?? draft).trim();
    if (!text) return;
    const cat = customCat ?? selectedCategory;
    const now = Date.now();
    const next: MemoryItem[] = [
      {
        id: uid(),
        content: text,
        category: cat,
        createdAt: now,
        updatedAt: now,
      },
      ...items,
    ];
    setItems(next);
    saveMemories(next);
    if (!customText) setDraft('');
  };

  const handleStartEdit = (item: MemoryItem) => {
    setEditingId(item.id);
    setEditContent(item.content);
    setEditCategory(item.category);
  };

  const handleSaveEdit = (id: string) => {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    const next = items.map((x) =>
      x.id === id ? { ...x, content: trimmed, category: editCategory, updatedAt: Date.now() } : x
    );
    setItems(next);
    saveMemories(next);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const next = items.filter((x) => x.id !== id);
    setItems(next);
    saveMemories(next);
  };

  const handleCopy = (id: string, text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {}
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adam_memory_vault_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMd = () => {
    let md = `# Adam AI — Long-Term Memory Vault\nExported: ${new Date().toLocaleString()}\n\n`;
    items.forEach((x, idx) => {
      md += `### ${idx + 1}. [${t.categories[x.category]}]\n${x.content}\n_Created: ${new Date(x.createdAt).toLocaleDateString()}_\n\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adam_memory_vault_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          const validated: MemoryItem[] = parsed
            .filter((p: any) => p && typeof p.content === 'string')
            .map((p: any) => ({
              id: p.id || uid(),
              content: p.content,
              category: ['preference', 'fact', 'goal', 'instruction'].includes(p.category)
                ? p.category
                : 'preference',
              createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
              updatedAt: Date.now(),
            }));
          const merged = [...validated, ...items.filter((i) => !validated.some((v) => v.id === i.id))];
          setItems(merged);
          saveMemories(merged);
        }
      } catch (err) {
        console.error('Import error', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getCategoryIcon = (cat: MemoryCategory) => {
    switch (cat) {
      case 'preference':
        return <Sparkles size={14} className="text-[var(--accent)]" />;
      case 'goal':
        return <Target size={14} className="text-[var(--accent)]" />;
      case 'instruction':
        return <ShieldCheck size={14} className="text-[var(--accent)]" />;
      case 'fact':
        return <FileText size={14} className="text-[var(--accent)]" />;
    }
  };

  const getCategoryBadgeClass = (cat: MemoryCategory) => {
    switch (cat) {
      case 'preference':
      case 'goal':
      case 'instruction':
      case 'fact':
        return 'bg-[var(--accent-subtle)] border-[var(--border-strong)] text-[var(--accent)]';
    }
  };

  return (
    <section className="feature-page" style={{ maxWidth: '1100px' }} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Hidden File Input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        accept=".json"
        className="hidden"
      />

      {/* Header with Theme Variables */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-subtle)] border border-[var(--border-strong)] text-[var(--accent)] text-xs font-semibold tracking-wider mb-2 shadow-sm">
            <Brain size={14} />
            <span>{t.badge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)] tracking-tight">
            {t.title}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 max-w-2xl leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Global Toolbar: Export & Import */}
        <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Upload size={14} className="text-[var(--muted)]" />
            <span>{t.importBtn}</span>
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="px-3.5 py-1.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download size={14} className="text-[var(--accent)]" />
            <span>{t.exportJson}</span>
          </button>
          <button
            type="button"
            onClick={handleExportMd}
            className="px-3.5 py-1.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download size={14} className="text-[var(--accent)]" />
            <span>{t.exportMd}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] border border-[var(--border-strong)] text-[var(--accent)] flex items-center justify-center shrink-0">
            <Brain size={18} />
          </div>
          <div>
            <strong className="block text-lg font-bold text-[var(--text)]">{stats.total}</strong>
            <span className="text-[11px] text-[var(--muted)]">{t.totalMemories}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] border border-[var(--border-strong)] text-[var(--accent)] flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <strong className="block text-lg font-bold text-[var(--text)]">{stats.instruction}</strong>
            <span className="text-[11px] text-[var(--muted)]">{t.categories.instruction}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] border border-[var(--border-strong)] text-[var(--accent)] flex items-center justify-center shrink-0">
            <Target size={18} />
          </div>
          <div>
            <strong className="block text-lg font-bold text-[var(--text)]">{stats.goal}</strong>
            <span className="text-[11px] text-[var(--muted)]">{t.categories.goal}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] border border-[var(--border-strong)] text-[var(--accent)] flex items-center justify-center shrink-0">
            <FileText size={18} />
          </div>
          <div>
            <strong className="block text-lg font-bold text-[var(--text)]">{stats.fact}</strong>
            <span className="text-[11px] text-[var(--muted)]">{t.categories.fact}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-md flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] border border-[var(--border-strong)] text-[var(--accent)] flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <strong className="block text-lg font-bold text-[var(--text)]">{stats.preference}</strong>
            <span className="text-[11px] text-[var(--muted)]">{t.categories.preference}</span>
          </div>
        </div>
      </div>

      {/* Input Composer Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border-strong)] shadow-xl mb-6">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <span className="text-xs font-bold text-[var(--accent)] flex items-center gap-1.5">
            <Plus size={15} />
            {t.addTitle}
          </span>
          <div className="flex items-center gap-1 bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--border)] text-[11px]">
            {(['preference', 'instruction', 'goal', 'fact'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[var(--accent)] text-slate-950 shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {cat === selectedCategory && getCategoryIcon(cat)}
                <span>{t.categories[cat]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleAdd();
              }
            }}
            placeholder={t.inputPh}
            rows={3}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-3.5 text-xs sm:text-sm text-[var(--text)] placeholder-[var(--muted)] outline-none focus:border-[var(--accent)] transition-colors resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-[var(--muted)] hidden sm:inline">
              {isAr ? 'اضغط Ctrl + Enter للحفظ السريع' : 'Press Ctrl + Enter to save quickly'}
            </span>
            <button
              type="button"
              onClick={() => handleAdd()}
              disabled={!draft.trim()}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-slate-950 font-bold text-xs transition-all shadow-md active:scale-98 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2 self-end cursor-pointer hover:opacity-90"
            >
              <Sparkles size={15} />
              <span>{t.saveBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Instant Presets */}
      <div className="mb-6 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
        <div className="text-xs font-bold text-[var(--text)] mb-2.5 flex items-center gap-1.5">
          <Sparkles size={14} className="text-[var(--accent)]" />
          <span>{t.quickPresetsTitle}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {t.presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAdd(preset.text, preset.category)}
              className="px-3 py-1.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-98 group text-start cursor-pointer"
              title={preset.text}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] group-hover:scale-125 transition-transform" />
              <strong className="font-semibold">{preset.label}</strong>
              <span className="text-[10px] text-[var(--muted)] font-mono">
                + {t.categories[preset.category]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter Category Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        {/* Category Filters */}
        <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-2xl border border-[var(--border)] overflow-x-auto text-xs">
          {(['all', 'instruction', 'preference', 'goal', 'fact'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveFilter(cat)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all font-semibold flex items-center gap-1.5 cursor-pointer ${
                activeFilter === cat
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--border-strong)] shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <span>{t.categories[cat]}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)] font-mono">
                {cat === 'all' ? items.length : stats[cat]}
              </span>
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[240px] sm:max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] rtl:left-auto rtl:right-3"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPh}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl py-2 px-8 text-xs text-[var(--text)] placeholder-[var(--muted)] outline-none focus:border-[var(--accent)] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] rtl:right-auto rtl:left-2.5 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Memory Items Grid / List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-[var(--surface)] border border-[var(--border)] text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)]">
              <Brain size={28} />
            </div>
            <strong className="text-sm font-bold text-[var(--text)]">{t.emptyTitle}</strong>
            <p className="text-xs text-[var(--muted)] max-w-md">{t.emptySub}</p>
          </div>
        ) : (
          filtered.map((item) => {
            const isEditing = editingId === item.id;
            const isCopied = copiedId === item.id;

            return (
              <article
                key={item.id}
                className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-all shadow-md group"
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[var(--text)]">
                        {isAr ? 'تعديل عنصر الذاكرة:' : 'Edit Memory Item:'}
                      </span>
                      <div className="flex items-center gap-1 bg-[var(--surface-2)] p-0.5 rounded-lg border border-[var(--border)] text-[10px]">
                        {(['preference', 'instruction', 'goal', 'fact'] as const).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setEditCategory(cat)}
                            className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                              editCategory === cat
                                ? 'bg-[var(--accent)] text-slate-950'
                                : 'text-[var(--muted)]'
                            }`}
                          >
                            {t.categories[cat]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-3 text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-3.5 py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--text)] text-xs transition cursor-pointer"
                      >
                        {t.cancelBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(item.id)}
                        className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-slate-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                      >
                        <Check size={14} />
                        <span>{t.updateBtn}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${getCategoryBadgeClass(
                          item.category
                        )}`}
                      >
                        {getCategoryIcon(item.category)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCategoryBadgeClass(
                              item.category
                            )}`}
                          >
                            {t.categories[item.category]}
                          </span>
                          <span className="text-[10px] text-[var(--muted)] font-mono flex items-center gap-1">
                            <Clock size={11} />
                            {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-[var(--text)] leading-relaxed break-words whitespace-pre-wrap">
                          {item.content}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, item.content)}
                        className="p-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition cursor-pointer"
                        title={t.copyTooltip}
                      >
                        {isCopied ? (
                          <Check size={14} className="text-[var(--accent)]" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition cursor-pointer"
                        title={t.editTooltip}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-red-500/15 border border-[var(--border)] hover:border-red-500/40 text-[var(--muted)] hover:text-red-400 transition cursor-pointer"
                        title={t.deleteTooltip}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
