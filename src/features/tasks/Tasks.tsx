import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Check,
  Calendar,
  AlertTriangle,
  Sparkles,
  Flame,
  ArrowRight,
  TrendingUp,
  Tag,
  Filter,
  Copy,
  Download,
  Clock,
  ChevronDown,
  ChevronUp,
  ListTodo,
  CheckCheck,
} from 'lucide-react';
import type { Language, Task, TaskPriority } from '../../core/domain';
import { loadTasks, saveTasks } from '../../core/storage/collections';

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `task_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const i18n = {
  ar: {
    title: 'مركز المهام والإنتاجية التنفيذية',
    subtitle: 'حوّل أهدافك وتوجيهاتك إلى خطوات عمل واضحة وعالية الإنتاجية، مع تتبع نسب الإنجاز ومستويات الأولوية.',
    badge: 'محرك الإنتاجية اليومي',
    all: 'كافة المهام',
    active: 'قيد التنفيذ',
    urgent: 'عاجلة وفورية',
    done: 'مكتملة',
    addPh: 'أدخل المهمة الجديدة (مثلاً: تدقيق إعدادات السيرفر، كتابة كود API)...',
    notesPh: 'ملاحظات تفصيلية أو خطوات تنفيذية (اختياري)...',
    addBtn: 'إضافة المهمة',
    saveNotes: 'حفظ الملاحظة',
    priority: 'الأولوية:',
    priorities: {
      high: 'عاجلة ⚡',
      medium: 'استراتيجية 🎯',
      low: 'مرنة 🌿',
    },
    quickWorkflowsTitle: 'مهام مقترحة للإنتاجية العالية:',
    workflows: [
      {
        title: 'تدقيق أمني وفحص ثغرات السيرفر',
        priority: 'high' as TaskPriority,
        notes: 'مراجعة منافذ Nmap، صلاحيات SSH، وعزل الحاويات في Docker.',
      },
      {
        title: 'تحديث وتطوير أدوات الويب في آدم',
        priority: 'high' as TaskPriority,
        notes: 'تحسين سرعة الاستجابة وجمالية الواجهات وزيادة استقرار الأداء.',
      },
      {
        title: 'تنظيم خطة العمل والجدول الأسبوعي',
        priority: 'medium' as TaskPriority,
        notes: 'تحديد أهم 3 أولويات رئيسية للأسبوع وتوزيع أوقات التركيز.',
      },
      {
        title: 'مزامنة ذاكرة النظام وتوثيق المعارف',
        priority: 'medium' as TaskPriority,
        notes: 'حفظ التفضيلات وقواعد العمل الهامة في خزينة الذاكرة المستمرة.',
      },
    ],
    completionRate: 'نسبة الإنجاز',
    activeTasks: 'مهام نشطة',
    completedTasks: 'مهام منجزة',
    emptyTitle: 'قائمتك فارغة ومنظمة بالكامل',
    emptySub: 'لا توجد مهام مطابقة للمحددات الحالية. أضف مهمة جديدة أو اختر قالباً مقترحاً.',
    markAllDone: 'إتمام الكل',
    clearDone: 'مسح المكتملة',
    copied: 'تم نسخ المهام إلى الحافظة',
    exportTxt: 'تصدير المهام',
    notesLabel: 'ملاحظات وتفاصيل:',
  },
  en: {
    title: 'Executive Task & Productivity Cockpit',
    subtitle: 'Translate objectives and operational directives into high-impact actionable items with priority tracking.',
    badge: 'Daily Execution Engine',
    all: 'All Tasks',
    active: 'In Progress',
    urgent: 'Urgent & Critical',
    done: 'Completed',
    addPh: 'Enter new task (e.g. Audit server configs, build API endpoint)...',
    notesPh: 'Detailed notes or sub-steps (optional)...',
    addBtn: 'Add Task',
    saveNotes: 'Save Note',
    priority: 'Priority:',
    priorities: {
      high: 'Urgent ⚡',
      medium: 'Strategic 🎯',
      low: 'Flexible 🌿',
    },
    quickWorkflowsTitle: 'High-Impact Quick Workflows:',
    workflows: [
      {
        title: 'Server Security Audit & Vulnerability Scan',
        priority: 'high' as TaskPriority,
        notes: 'Review Nmap open ports, SSH permissions, and Docker container isolation.',
      },
      {
        title: 'Upgrade & Refine Adam AI Web Suite',
        priority: 'high' as TaskPriority,
        notes: 'Improve response responsiveness, luxury aesthetics, and performance.',
      },
      {
        title: 'Weekly Focus & Strategic Priority Plan',
        priority: 'medium' as TaskPriority,
        notes: 'Select the top 3 core objectives and allocate dedicated focus blocks.',
      },
      {
        title: 'Sync System Knowledge Vault',
        priority: 'medium' as TaskPriority,
        notes: 'Archive essential preferences and core rules into long-term memory.',
      },
    ],
    completionRate: 'Completion Rate',
    activeTasks: 'Active Tasks',
    completedTasks: 'Finished Tasks',
    emptyTitle: 'Your Checklist is Clear & Organized',
    emptySub: 'No tasks match current filter. Add a task or activate a quick workflow.',
    markAllDone: 'Complete All',
    clearDone: 'Clear Done',
    copied: 'Tasks copied to clipboard',
    exportTxt: 'Export Tasks',
    notesLabel: 'Notes & details:',
  },
};

export function Tasks({ language }: { language: Language }) {
  const t = i18n[language];
  const isAr = language === 'ar';

  const [tasks, setTasks] = useState<Task[]>(() => {
    const loaded = loadTasks();
    if (loaded && loaded.length > 0) return loaded;
    // Seed default starter tasks
    const now = Date.now();
    const starter: Task[] = [
      {
        id: uid(),
        title: isAr ? 'فحص جاهزية التطبيق وجميع صفحاته المحدثة' : 'Verify app responsiveness across all upgraded pages',
        notes: isAr ? 'التأكد من التناسق الفخم وسلاسة الواجهات في الهاتف والحاسوب.' : 'Ensure prestigious consistency across mobile & desktop.',
        completed: true,
        priority: 'high',
        createdAt: now - 3600000 * 2,
        updatedAt: now - 3600000 * 2,
      },
      {
        id: uid(),
        title: isAr ? 'تجربة ألعاب واستوديو التطبيقات السريعة' : 'Test high-speed Arcade & Sandbox web apps',
        notes: isAr ? 'تشغيل لعبة 3D Space Defender وألعاب النيون التفاعلية.' : 'Play 3D Space Defender and neon interactive arcade games.',
        completed: false,
        priority: 'high',
        createdAt: now - 3600000,
        updatedAt: now - 3600000,
      },
      {
        id: uid(),
        title: isAr ? 'تأكيد التفضيلات في خزينة الذاكرة طويلة المدى' : 'Confirm directives in long-term memory vault',
        notes: '',
        completed: false,
        priority: 'medium',
        createdAt: now - 1800000,
        updatedAt: now - 1800000,
      },
    ];
    saveTasks(starter);
    return starter;
  });

  const [draft, setDraft] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>('medium');
  const [filter, setFilter] = useState<'all' | 'active' | 'urgent' | 'done'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Filter tasks
  const visibleTasks = useMemo(() => {
    return tasks.filter((x) => {
      if (filter === 'active') return !x.completed;
      if (filter === 'done') return x.completed;
      if (filter === 'urgent') return !x.completed && x.priority === 'high';
      return true;
    });
  }, [tasks, filter]);

  // Metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((x) => x.completed).length;
    const active = total - completed;
    const urgent = tasks.filter((x) => !x.completed && x.priority === 'high').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, active, urgent, percent };
  }, [tasks]);

  const handleAddTask = (customTitle?: string, customPriority?: TaskPriority, customNotes?: string) => {
    const title = (customTitle ?? draft).trim();
    if (!title) return;
    const now = Date.now();
    const next: Task[] = [
      {
        id: uid(),
        title,
        notes: (customNotes ?? draftNotes).trim(),
        completed: false,
        priority: customPriority ?? selectedPriority,
        createdAt: now,
        updatedAt: now,
      },
      ...tasks,
    ];
    setTasks(next);
    saveTasks(next);
    if (!customTitle) {
      setDraft('');
      setDraftNotes('');
    }
  };

  const handleToggle = (id: string) => {
    const next = tasks.map((x) =>
      x.id === id ? { ...x, completed: !x.completed, updatedAt: Date.now() } : x
    );
    setTasks(next);
    saveTasks(next);
  };

  const handleDelete = (id: string) => {
    const next = tasks.filter((x) => x.id !== id);
    setTasks(next);
    saveTasks(next);
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    const next = tasks.map((x) =>
      x.id === id ? { ...x, notes, updatedAt: Date.now() } : x
    );
    setTasks(next);
    saveTasks(next);
  };

  const handleMarkAllDone = () => {
    const next = tasks.map((x) => ({ ...x, completed: true, updatedAt: Date.now() }));
    setTasks(next);
    saveTasks(next);
  };

  const handleClearDone = () => {
    const next = tasks.filter((x) => !x.completed);
    setTasks(next);
    saveTasks(next);
  };

  const handleExportText = () => {
    let text = `=== Adam AI — Tasks Checklist (${new Date().toLocaleDateString()}) ===\n\n`;
    tasks.forEach((tItem, i) => {
      text += `${i + 1}. [${tItem.completed ? 'X' : ' '}] ${tItem.title} (${t.priorities[tItem.priority]})\n`;
      if (tItem.notes) text += `   Notes: ${tItem.notes}\n`;
    });
    try {
      navigator.clipboard.writeText(text);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    } catch {}
  };

  const getPriorityBadgeClass = (p: TaskPriority) => {
    switch (p) {
      case 'high':
        return 'bg-red-500/15 border-red-500/40 text-red-300';
      case 'medium':
        return 'bg-amber-500/15 border-amber-500/40 text-amber-300';
      case 'low':
        return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300';
    }
  };

  return (
    <section className="feature-page" style={{ maxWidth: '1100px' }} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-subtle)] border border-[var(--border-strong)] text-[var(--accent)] text-xs font-semibold tracking-wider mb-2 shadow-sm">
            <ListTodo size={14} />
            <span>{t.badge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)] tracking-tight">
            {t.title}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 max-w-2xl leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Global Task Actions */}
        <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
          <button
            type="button"
            onClick={handleExportText}
            className="px-3.5 py-1.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Copy size={13} className="text-[var(--accent)]" />
            <span>{copiedNotification ? t.copied : t.exportTxt}</span>
          </button>
          {metrics.active > 0 && (
            <button
              type="button"
              onClick={handleMarkAllDone}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <CheckCheck size={14} className="text-[var(--accent)]" />
              <span>{t.markAllDone}</span>
            </button>
          )}
          {metrics.completed > 0 && (
            <button
              type="button"
              onClick={handleClearDone}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--surface-2)] hover:bg-red-500/15 border border-[var(--border)] hover:border-red-500/40 text-[var(--muted)] hover:text-red-400 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 size={13} />
              <span>{t.clearDone}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Productivity Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {/* Progress Bar Widget */}
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-strong)] shadow-md col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[var(--muted)]">{t.completionRate}</span>
            <span className="text-xs font-bold text-[var(--accent)] font-mono">{metrics.percent}%</span>
          </div>
          <div className="w-full bg-[var(--surface-2)] h-2.5 rounded-full overflow-hidden border border-[var(--border)]">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${metrics.percent}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] text-[var(--muted)] flex justify-between">
            <span>{metrics.completed} / {metrics.total} {isAr ? 'مهمة' : 'tasks'}</span>
            <span className="text-[var(--accent)] font-semibold">{metrics.percent === 100 ? '⭐ 100%' : ''}</span>
          </div>
        </div>

        {/* Active Tasks Widget */}
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] border border-[var(--border-strong)] text-[var(--accent)] flex items-center justify-center shrink-0">
            <TrendingUp size={18} />
          </div>
          <div>
            <strong className="block text-xl font-bold text-[var(--text)] font-mono">{metrics.active}</strong>
            <span className="text-[11px] text-[var(--muted)]">{t.activeTasks}</span>
          </div>
        </div>

        {/* Urgent Tasks Widget */}
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
            <Flame size={18} />
          </div>
          <div>
            <strong className="block text-xl font-bold text-[var(--text)] font-mono">{metrics.urgent}</strong>
            <span className="text-[11px] text-[var(--muted)]">{t.urgent}</span>
          </div>
        </div>

        {/* Completed Tasks Widget */}
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] border border-[var(--border-strong)] text-[var(--accent)] flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <strong className="block text-xl font-bold text-[var(--text)] font-mono">{metrics.completed}</strong>
            <span className="text-[11px] text-[var(--muted)]">{t.completedTasks}</span>
          </div>
        </div>
      </div>

      {/* Task Composer */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border-strong)] shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              placeholder={t.addPh}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl py-3 px-4 text-xs sm:text-sm text-[var(--text)] placeholder-[var(--muted)] outline-none focus:border-[var(--accent)] transition-colors"
            />
            <input
              type="text"
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              placeholder={t.notesPh}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl py-2 px-3 text-xs text-[var(--text)] placeholder-[var(--muted)] outline-none focus:border-[var(--border-strong)] transition-colors"
            />
          </div>

          <div className="flex sm:flex-col items-center justify-between gap-2 shrink-0">
            {/* Priority Selector */}
            <div className="flex items-center gap-1 bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--border)] text-[11px]">
              {(['high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPriority(p)}
                  className={`px-2.5 py-1 rounded-lg transition-all font-semibold cursor-pointer ${
                    selectedPriority === p
                      ? p === 'high'
                        ? 'bg-red-500 text-white shadow-sm'
                        : p === 'medium'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-[var(--accent)] text-slate-950 shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {t.priorities[p]}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleAddTask()}
              disabled={!draft.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-[var(--accent)] text-slate-950 font-bold text-xs transition-all shadow-md active:scale-98 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90"
            >
              <Plus size={15} />
              <span>{t.addBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Instant Executive Workflows */}
      <div className="mb-6 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
        <div className="text-xs font-bold text-[var(--text)] mb-2.5 flex items-center gap-1.5">
          <Sparkles size={14} className="text-[var(--accent)]" />
          <span>{t.quickWorkflowsTitle}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {t.workflows.map((wf, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddTask(wf.title, wf.priority, wf.notes)}
              className="p-3 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-[var(--accent)] text-start transition-all flex items-start justify-between gap-2 group cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <strong className="block text-xs font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors truncate">
                  + {wf.title}
                </strong>
                <span className="text-[10px] text-[var(--muted)] truncate block mt-0.5">
                  {wf.notes}
                </span>
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${getPriorityBadgeClass(
                  wf.priority
                )}`}
              >
                {t.priorities[wf.priority]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 mb-4 bg-[var(--surface)] p-1 rounded-2xl border border-[var(--border)] w-fit text-xs">
        {(['all', 'active', 'urgent', 'done'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-xl transition-all font-semibold flex items-center gap-1.5 cursor-pointer ${
              filter === tab
                ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--border-strong)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <span>{t[tab]}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)] font-mono">
              {tab === 'all'
                ? metrics.total
                : tab === 'active'
                ? metrics.active
                : tab === 'urgent'
                ? metrics.urgent
                : metrics.completed}
            </span>
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5">
        {visibleTasks.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-[var(--surface)] border border-[var(--border)] text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)]">
              <CheckCircle2 size={28} />
            </div>
            <strong className="text-sm font-bold text-[var(--text)]">{t.emptyTitle}</strong>
            <p className="text-xs text-[var(--muted)] max-w-md">{t.emptySub}</p>
          </div>
        ) : (
          visibleTasks.map((task) => {
            const isExpanded = expandedId === task.id;

            return (
              <article
                key={task.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 shadow-md ${
                  task.completed
                    ? 'bg-[var(--surface)] border-[var(--border)] opacity-60'
                    : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggle(task.id)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                      task.completed
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-slate-950 shadow-sm'
                        : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                    }`}
                    title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {task.completed ? <Check size={14} strokeWidth={3} /> : <Circle size={10} />}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <strong
                        className={`text-xs sm:text-sm font-semibold break-words ${
                          task.completed
                            ? 'line-through text-[var(--muted)] font-normal'
                            : 'text-[var(--text)]'
                        }`}
                      >
                        {task.title}
                      </strong>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${getPriorityBadgeClass(
                          task.priority
                        )}`}
                      >
                        {t.priorities[task.priority]}
                      </span>
                    </div>

                    {/* Expandable Notes Section */}
                    {task.notes && !isExpanded && (
                      <p
                        onClick={() => setExpandedId(task.id)}
                        className="text-[11px] text-[var(--muted)] cursor-pointer hover:text-[var(--text)] line-clamp-1 mt-1"
                      >
                        {task.notes}
                      </p>
                    )}

                    {isExpanded && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2 animate-in fade-in duration-150">
                        <label className="block text-[10px] text-[var(--muted)] font-semibold">
                          {t.notesLabel}
                        </label>
                        <textarea
                          value={task.notes}
                          onChange={(e) => handleUpdateNotes(task.id, e.target.value)}
                          rows={2}
                          className="w-full bg-transparent border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Action icons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : task.id)}
                      className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
                      title={isExpanded ? 'Collapse notes' : 'Expand notes'}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-400 hover:bg-red-500/15 transition cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
