import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Bell,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  Repeat,
  Zap,
  Bookmark,
  Check,
  Search,
  Tag,
  Layers,
  ArrowRight,
  Filter,
  CalendarDays,
  CalendarRange,
  ListFilter,
  AlertCircle,
  CalendarCheck,
  ChevronDown,
} from 'lucide-react';
import { CalendarEvent, Reminder } from '../types';

export interface TaskTemplate {
  id: string;
  title: string;
  category: 'worship' | 'work' | 'health' | 'productivity' | 'personal';
  icon: string;
  defaultTime: string; // HH:MM
  recurrence: 'daily' | 'weekly' | 'monthly' | 'workdays';
  dayOfWeek?: number; // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  durationMinutes?: number;
  location?: string;
  targetType: 'event' | 'reminder';
  descriptionAr: string;
  descriptionEn: string;
  isCustom?: boolean;
}

export type GroupingMode = 'all' | 'day' | 'week' | 'month';
export type ReminderFilterMode = 'all' | 'pending' | 'completed';

const DEFAULT_TEMPLATES: TaskTemplate[] = [
  {
    id: 'tmpl-friday-prayer',
    title: 'صلاة الجمعة',
    category: 'worship',
    icon: '🕌',
    defaultTime: '12:30',
    recurrence: 'weekly',
    dayOfWeek: 5, // الجمعة
    durationMinutes: 60,
    location: 'المسجد الجامع',
    targetType: 'event',
    descriptionAr: 'تذكير وموعد أسبوعي مكرر للتجهز وأداء صلاة الجمعة',
    descriptionEn: 'Weekly recurring reminder for Friday prayer preparations and attendance',
  },
  {
    id: 'tmpl-weekly-meeting',
    title: 'اجتماع أسبوعي للمكلفين',
    category: 'work',
    icon: '💼',
    defaultTime: '10:00',
    recurrence: 'weekly',
    dayOfWeek: 1, // الإثنين
    durationMinutes: 45,
    location: 'قاعة الاجتماعات / Zoom',
    targetType: 'event',
    descriptionAr: 'متابعة سير العمل وتوزيع المهام الأسبوعية مع الفريق',
    descriptionEn: 'Weekly team sprint review and milestone sync',
  },
  {
    id: 'tmpl-daily-standup',
    title: 'الموجز الصباحي اليومي',
    category: 'productivity',
    icon: '☕',
    defaultTime: '09:00',
    recurrence: 'workdays',
    durationMinutes: 15,
    targetType: 'reminder',
    descriptionAr: 'تذكير الصباح لمراجعة الأولويات وتحديد أهم 3 مهام لليوم',
    descriptionEn: 'Daily morning standup to prioritize top 3 crucial tasks',
  },
  {
    id: 'tmpl-morning-workout',
    title: 'تمارين رياضية صباحية',
    category: 'health',
    icon: '🏃‍♂️',
    defaultTime: '06:30',
    recurrence: 'daily',
    durationMinutes: 30,
    location: 'المنزل / الصالة الرياضية',
    targetType: 'event',
    descriptionAr: 'نصف ساعة من تمارين الكارديو والإحماء لتنشيط الجسم',
    descriptionEn: '30-minute cardio and morning body workout',
  },
  {
    id: 'tmpl-backup-data',
    title: 'نسخ احتياطي للبيانات',
    category: 'work',
    icon: '💾',
    defaultTime: '20:00',
    recurrence: 'weekly',
    dayOfWeek: 4, // الخميس
    durationMinutes: 15,
    targetType: 'reminder',
    descriptionAr: 'التحقق من إتمام النسخ الاحتياطي للملفات والشيفرات البرمجية',
    descriptionEn: 'Weekly project and codebase data backup verification',
  },
  {
    id: 'tmpl-monthly-review',
    title: 'المراجعة الشهرية والتخطيط',
    category: 'productivity',
    icon: '📊',
    defaultTime: '18:00',
    recurrence: 'monthly',
    durationMinutes: 60,
    targetType: 'event',
    descriptionAr: 'تقييم الإنجازات الشهرية، المصاريف، وتحديث الأهداف القادمة',
    descriptionEn: 'End-of-month progress review and strategic planning',
  },
  {
    id: 'tmpl-water-reminder',
    title: 'شرب الماء والترطيب',
    category: 'health',
    icon: '💧',
    defaultTime: '11:00',
    recurrence: 'daily',
    durationMinutes: 5,
    targetType: 'reminder',
    descriptionAr: 'تذكير صحي بشرب كوب من الماء للحفاظ على النشاط والتركيز',
    descriptionEn: 'Daily hydration reminder to drink a glass of fresh water',
  },
  {
    id: 'tmpl-reading-time',
    title: 'وقت القراءة والتعلم',
    category: 'personal',
    icon: '📖',
    defaultTime: '21:30',
    recurrence: 'daily',
    durationMinutes: 30,
    targetType: 'reminder',
    descriptionAr: 'قراءة 20 صفحة من كتاب في التطوير الذاتي أو البرمجة',
    descriptionEn: 'Read 20 pages from a technology or self-improvement book',
  },
];

interface CalendarManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  reminders: Reminder[];
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onDeleteEvent: (id: string) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onAddReminder?: (title: string, targetTimeIso: string) => void;
  onSnoozeReminder?: (id: string, minutes: number) => void;
  isArabic: boolean;
}

export const CalendarManagerModal: React.FC<CalendarManagerModalProps> = ({
  isOpen,
  onClose,
  events,
  reminders,
  onAddEvent,
  onDeleteEvent,
  onToggleReminder,
  onDeleteReminder,
  onAddReminder,
  onSnoozeReminder,
  isArabic,
}) => {
  const [activeTab, setActiveTab] = useState<'events' | 'reminders' | 'templates'>('reminders');
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingReminder, setIsCreatingReminder] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  // Grouping & Filtering States
  const [reminderGroupBy, setReminderGroupBy] = useState<GroupingMode>('day');
  const [reminderFilter, setReminderFilter] = useState<ReminderFilterMode>('all');
  const [eventGroupBy, setEventGroupBy] = useState<GroupingMode>('day');

  // Form state for new event
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(30);
  const [location, setLocation] = useState('');

  // Form state for new direct reminder
  const [remTitle, setRemTitle] = useState('');
  const [remDate, setRemDate] = useState(new Date().toISOString().split('T')[0]);
  const [remTime, setRemTime] = useState('12:00');

  // Form state for custom template
  const [tmplTitle, setTmplTitle] = useState('');
  const [tmplCategory, setTmplCategory] = useState<TaskTemplate['category']>('work');
  const [tmplIcon, setTmplIcon] = useState('📌');
  const [tmplTime, setTmplTime] = useState('10:00');
  const [tmplRecurrence, setTmplRecurrence] = useState<TaskTemplate['recurrence']>('weekly');
  const [tmplDayOfWeek, setTmplDayOfWeek] = useState<number>(5);
  const [tmplDuration, setTmplDuration] = useState<number>(30);
  const [tmplLocation, setTmplLocation] = useState('');
  const [tmplTargetType, setTmplTargetType] = useState<'event' | 'reminder'>('event');
  const [tmplDescription, setTmplDescription] = useState('');

  // Templates state
  const [customTemplates, setCustomTemplates] = useState<TaskTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Load custom templates from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('adam_ai_custom_task_templates');
      if (saved) {
        setCustomTemplates(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const allTemplates = [...DEFAULT_TEMPLATES, ...customTemplates];

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddEvent({
      title: title.trim(),
      date,
      time,
      durationMinutes: duration,
      location,
      createdAt: new Date().toISOString(),
    });
    setTitle('');
    setLocation('');
    setIsCreating(false);
    showFeedback(isArabic ? 'تمت إضافة الحدث بنجاح! 📅' : 'Event added successfully! 📅');
  };

  const handleCreateDirectReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle.trim()) return;

    const [hours, minutes] = (remTime || '12:00').split(':').map(Number);
    const targetDate = new Date(remDate);
    targetDate.setHours(hours || 12, minutes || 0, 0, 0);

    if (onAddReminder) {
      onAddReminder(remTitle.trim(), targetDate.toISOString());
    } else {
      onAddEvent({
        title: remTitle.trim(),
        date: remDate,
        time: remTime,
        durationMinutes: 15,
        location: '',
        createdAt: new Date().toISOString(),
      });
    }

    setRemTitle('');
    setIsCreatingReminder(false);
    showFeedback(isArabic ? 'تمت إضافة التذكير بنجاح! ⏰' : 'Reminder added successfully! ⏰');
  };

  const handleSaveCustomTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmplTitle.trim()) return;

    const newTmpl: TaskTemplate = {
      id: 'tmpl-cust-' + Date.now(),
      title: tmplTitle.trim(),
      category: tmplCategory,
      icon: tmplIcon || '📌',
      defaultTime: tmplTime,
      recurrence: tmplRecurrence,
      dayOfWeek: tmplRecurrence === 'weekly' ? tmplDayOfWeek : undefined,
      durationMinutes: tmplDuration,
      location: tmplLocation,
      targetType: tmplTargetType,
      descriptionAr: tmplDescription || tmplTitle,
      descriptionEn: tmplDescription || tmplTitle,
      isCustom: true,
    };

    const updated = [newTmpl, ...customTemplates];
    setCustomTemplates(updated);
    try {
      localStorage.setItem('adam_ai_custom_task_templates', JSON.stringify(updated));
    } catch {
      // ignore
    }

    setTmplTitle('');
    setTmplDescription('');
    setIsCreatingTemplate(false);
    showFeedback(isArabic ? 'تم حفظ القالب المخصص بنجاح! ⚡' : 'Custom template saved! ⚡');
  };

  const handleDeleteCustomTemplate = (id: string) => {
    const updated = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(updated);
    try {
      localStorage.setItem('adam_ai_custom_task_templates', JSON.stringify(updated));
    } catch {
      // ignore
    }
    showFeedback(isArabic ? 'تم حذف القالب المخصص' : 'Template deleted');
  };

  const calculateNextOccurrence = (template: TaskTemplate) => {
    const now = new Date();
    const [hours, minutes] = (template.defaultTime || '10:00').split(':').map(Number);

    let targetDate = new Date();
    targetDate.setHours(hours || 10, minutes || 0, 0, 0);

    if (template.recurrence === 'daily') {
      if (targetDate <= now) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
    } else if (template.recurrence === 'weekly' && template.dayOfWeek !== undefined) {
      const currentDay = now.getDay(); // 0 = Sun, 5 = Fri
      let daysUntil = (template.dayOfWeek - currentDay + 7) % 7;
      if (daysUntil === 0 && targetDate <= now) {
        daysUntil = 7;
      }
      targetDate.setDate(targetDate.getDate() + daysUntil);
    } else if (template.recurrence === 'monthly') {
      if (targetDate <= now) {
        targetDate.setMonth(targetDate.getMonth() + 1);
      }
    } else if (template.recurrence === 'workdays') {
      if (targetDate <= now) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
      while (targetDate.getDay() === 5 || targetDate.getDay() === 6) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
    } else {
      if (targetDate <= now) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
    }

    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');

    return {
      dateStr: `${yyyy}-${mm}-${dd}`,
      timeStr: template.defaultTime || '10:00',
      isoStr: targetDate.toISOString(),
      displayDate: targetDate.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    };
  };

  const handleApplyTemplate = (template: TaskTemplate) => {
    const occurrence = calculateNextOccurrence(template);

    if (template.targetType === 'event') {
      onAddEvent({
        title: `${template.icon} ${template.title}`,
        date: occurrence.dateStr,
        time: occurrence.timeStr,
        durationMinutes: template.durationMinutes || 30,
        location: template.location || '',
        createdAt: new Date().toISOString(),
      });
    } else {
      if (onAddReminder) {
        onAddReminder(`${template.icon} ${template.title}`, occurrence.isoStr);
      } else {
        // Fallback to event
        onAddEvent({
          title: `${template.icon} ${template.title}`,
          date: occurrence.dateStr,
          time: occurrence.timeStr,
          durationMinutes: 15,
          location: template.location || '',
          createdAt: new Date().toISOString(),
        });
      }
    }

    showFeedback(
      isArabic
        ? `تم جدولة "${template.title}" بنجاح ليوم ${occurrence.displayDate} 🚀`
        : `Scheduled "${template.title}" for ${occurrence.displayDate} 🚀`
    );
  };

  const handleCustomizeTemplate = (template: TaskTemplate) => {
    const occurrence = calculateNextOccurrence(template);
    setTitle(`${template.icon} ${template.title}`);
    setDate(occurrence.dateStr);
    setTime(occurrence.timeStr);
    setDuration(template.durationMinutes || 30);
    setLocation(template.location || '');
    setActiveTab('events');
    setIsCreating(true);
  };

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
  };

  const filteredTemplates = allTemplates.filter((t) => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.descriptionAr && t.descriptionAr.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getDayName = (dayNum?: number) => {
    const daysAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (dayNum === undefined) return '';
    return isArabic ? daysAr[dayNum] : daysEn[dayNum];
  };

  const getRecurrenceLabel = (t: TaskTemplate) => {
    if (t.recurrence === 'daily') return isArabic ? 'يومي' : 'Daily';
    if (t.recurrence === 'monthly') return isArabic ? 'شهري' : 'Monthly';
    if (t.recurrence === 'workdays') return isArabic ? 'أيام العمل' : 'Workdays';
    if (t.recurrence === 'weekly') {
      const dayName = getDayName(t.dayOfWeek);
      return isArabic ? `أسبوعي (${dayName})` : `Weekly (${dayName})`;
    }
    return isArabic ? 'مكرر' : 'Recurring';
  };

  // ==========================================================================
  // REMINDERS & EVENTS GROUPING LOGIC (Day / Week / Month / All)
  // ==========================================================================

  // Filter reminders by status first
  const statusFilteredReminders = useMemo(() => {
    if (reminderFilter === 'pending') return reminders.filter((r) => !r.isCompleted);
    if (reminderFilter === 'completed') return reminders.filter((r) => r.isCompleted);
    return reminders;
  }, [reminders, reminderFilter]);

  // Statistics
  const reminderStats = useMemo(() => {
    const now = new Date();
    const total = reminders.length;
    const completed = reminders.filter((r) => r.isCompleted).length;
    const pending = total - completed;
    const overdue = reminders.filter((r) => !r.isCompleted && new Date(r.targetTime) < now).length;
    return { total, completed, pending, overdue };
  }, [reminders]);

  interface GroupedSection<T> {
    id: string;
    title: string;
    icon: string;
    items: T[];
    datePrefill?: string;
    isOverdue?: boolean;
    isCompletedGroup?: boolean;
  }

  // Helper date calculations
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  // Group Reminders
  const groupedReminders = useMemo((): GroupedSection<Reminder>[] => {
    if (statusFilteredReminders.length === 0) return [];
    if (reminderGroupBy === 'all') {
      return [
        {
          id: 'all-reminders',
          title: isArabic ? 'جميع التذكيرات' : 'All Reminders',
          icon: '🔔',
          items: statusFilteredReminders,
        },
      ];
    }

    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const groupsMap = new Map<string, GroupedSection<Reminder>>();

    if (reminderGroupBy === 'day') {
      // Day Grouping
      for (const rem of statusFilteredReminders) {
        const remDate = new Date(rem.targetTime);
        const remDay = startOfDay(remDate);

        let groupKey: string;
        let groupTitle: string;
        let groupIcon = '📅';
        let isOverdue = false;
        let isCompletedGroup = false;

        if (rem.isCompleted) {
          groupKey = 'completed';
          groupTitle = isArabic ? 'التذكيرات المكتملة' : 'Completed Reminders';
          groupIcon = '✅';
          isCompletedGroup = true;
        } else if (remDate < now) {
          groupKey = 'overdue';
          groupTitle = isArabic ? 'تذكيرات متأخرة ⚠️' : 'Overdue Reminders ⚠️';
          groupIcon = '⚠️';
          isOverdue = true;
        } else if (isSameDay(remDay, today)) {
          groupKey = 'today';
          groupTitle = isArabic ? 'اليوم (🌟)' : 'Today (🌟)';
          groupIcon = '🌟';
        } else if (isSameDay(remDay, tomorrow)) {
          groupKey = 'tomorrow';
          groupTitle = isArabic ? 'غداً (🌅)' : 'Tomorrow (🌅)';
          groupIcon = '🌅';
        } else {
          const yyyy = remDate.getFullYear();
          const mm = String(remDate.getMonth() + 1).padStart(2, '0');
          const dd = String(remDate.getDate()).padStart(2, '0');
          groupKey = `day-${yyyy}-${mm}-${dd}`;
          groupTitle = remDate.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          groupIcon = '🗓️';
        }

        if (!groupsMap.has(groupKey)) {
          const yyyy = remDate.getFullYear();
          const mm = String(remDate.getMonth() + 1).padStart(2, '0');
          const dd = String(remDate.getDate()).padStart(2, '0');
          groupsMap.set(groupKey, {
            id: groupKey,
            title: groupTitle,
            icon: groupIcon,
            items: [],
            datePrefill: `${yyyy}-${mm}-${dd}`,
            isOverdue,
            isCompletedGroup,
          });
        }
        groupsMap.get(groupKey)!.items.push(rem);
      }
    } else if (reminderGroupBy === 'week') {
      // Week Grouping
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as start
      const endOfThisWeek = new Date(startOfWeek);
      endOfThisWeek.setDate(startOfWeek.getDate() + 7);

      const endOfNextWeek = new Date(endOfThisWeek);
      endOfNextWeek.setDate(endOfThisWeek.getDate() + 7);

      const endOfTwoWeeks = new Date(endOfNextWeek);
      endOfTwoWeeks.setDate(endOfNextWeek.getDate() + 7);

      for (const rem of statusFilteredReminders) {
        const remDate = new Date(rem.targetTime);
        let groupKey: string;
        let groupTitle: string;
        let groupIcon = '📆';
        let isOverdue = false;
        let isCompletedGroup = false;

        if (rem.isCompleted) {
          groupKey = 'completed';
          groupTitle = isArabic ? 'التذكيرات المكتملة' : 'Completed Reminders';
          groupIcon = '✅';
          isCompletedGroup = true;
        } else if (remDate < now) {
          groupKey = 'overdue';
          groupTitle = isArabic ? 'تذكيرات متأخرة ⚠️' : 'Overdue Reminders ⚠️';
          groupIcon = '⚠️';
          isOverdue = true;
        } else if (remDate < endOfThisWeek) {
          groupKey = 'this-week';
          groupTitle = isArabic ? 'هذا الأسبوع (Current Week)' : 'This Week';
          groupIcon = '📅';
        } else if (remDate < endOfNextWeek) {
          groupKey = 'next-week';
          groupTitle = isArabic ? 'الأسبوع القادم (Next Week)' : 'Next Week';
          groupIcon = '📆';
        } else if (remDate < endOfTwoWeeks) {
          groupKey = 'two-weeks';
          groupTitle = isArabic ? 'خلال أسبوعين (In 2 Weeks)' : 'In 2 Weeks';
          groupIcon = '🗓️';
        } else {
          groupKey = 'later';
          groupTitle = isArabic ? 'لاحقاً (Later)' : 'Later';
          groupIcon = '⏳';
        }

        if (!groupsMap.has(groupKey)) {
          groupsMap.set(groupKey, {
            id: groupKey,
            title: groupTitle,
            icon: groupIcon,
            items: [],
            isOverdue,
            isCompletedGroup,
          });
        }
        groupsMap.get(groupKey)!.items.push(rem);
      }
    } else if (reminderGroupBy === 'month') {
      // Month Grouping
      const thisMonth = today.getMonth();
      const thisYear = today.getFullYear();

      for (const rem of statusFilteredReminders) {
        const remDate = new Date(rem.targetTime);
        let groupKey: string;
        let groupTitle: string;
        let groupIcon = '🗓️';
        let isOverdue = false;
        let isCompletedGroup = false;

        if (rem.isCompleted) {
          groupKey = 'completed';
          groupTitle = isArabic ? 'التذكيرات المكتملة' : 'Completed Reminders';
          groupIcon = '✅';
          isCompletedGroup = true;
        } else if (remDate < now) {
          groupKey = 'overdue';
          groupTitle = isArabic ? 'تذكيرات متأخرة ⚠️' : 'Overdue Reminders ⚠️';
          groupIcon = '⚠️';
          isOverdue = true;
        } else if (remDate.getFullYear() === thisYear && remDate.getMonth() === thisMonth) {
          groupKey = `month-${thisYear}-${thisMonth}`;
          groupTitle = isArabic
            ? `هذا الشهر (${remDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })})`
            : `This Month (${remDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`;
          groupIcon = '🌟';
        } else {
          const y = remDate.getFullYear();
          const m = remDate.getMonth();
          groupKey = `month-${y}-${m}`;
          groupTitle = remDate.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
            month: 'long',
            year: 'numeric',
          });
          groupIcon = '🗓️';
        }

        if (!groupsMap.has(groupKey)) {
          groupsMap.set(groupKey, {
            id: groupKey,
            title: groupTitle,
            icon: groupIcon,
            items: [],
            isOverdue,
            isCompletedGroup,
          });
        }
        groupsMap.get(groupKey)!.items.push(rem);
      }
    }

    // Sort sections so Overdue comes first, then chronological, then Completed last
    const orderPriority: { [key: string]: number } = {
      overdue: -100,
      today: 1,
      tomorrow: 2,
      'this-week': 1,
      'next-week': 2,
      'two-weeks': 3,
      later: 90,
      completed: 100,
    };

    return Array.from(groupsMap.values()).sort((a, b) => {
      const pA = orderPriority[a.id] ?? 50;
      const pB = orderPriority[b.id] ?? 50;
      if (pA !== pB) return pA - pB;
      return a.id.localeCompare(b.id);
    });
  }, [statusFilteredReminders, reminderGroupBy, isArabic]);

  // Group Calendar Events
  const groupedEvents = useMemo((): GroupedSection<CalendarEvent>[] => {
    if (events.length === 0) return [];
    if (eventGroupBy === 'all') {
      return [
        {
          id: 'all-events',
          title: isArabic ? 'جميع الأحداث المجدولة' : 'All Scheduled Events',
          icon: '📅',
          items: events,
        },
      ];
    }

    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const groupsMap = new Map<string, GroupedSection<CalendarEvent>>();

    if (eventGroupBy === 'day') {
      for (const evt of events) {
        const evtDate = new Date(evt.date);
        const evtDay = startOfDay(evtDate);

        let groupKey: string;
        let groupTitle: string;
        let groupIcon = '📅';

        if (isSameDay(evtDay, today)) {
          groupKey = 'today';
          groupTitle = isArabic ? 'اليوم (🌟)' : 'Today (🌟)';
          groupIcon = '🌟';
        } else if (isSameDay(evtDay, tomorrow)) {
          groupKey = 'tomorrow';
          groupTitle = isArabic ? 'غداً (🌅)' : 'Tomorrow (🌅)';
          groupIcon = '🌅';
        } else {
          groupKey = `day-${evt.date}`;
          groupTitle = evtDate.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          groupIcon = '🗓️';
        }

        if (!groupsMap.has(groupKey)) {
          groupsMap.set(groupKey, {
            id: groupKey,
            title: groupTitle,
            icon: groupIcon,
            items: [],
            datePrefill: evt.date,
          });
        }
        groupsMap.get(groupKey)!.items.push(evt);
      }
    } else if (eventGroupBy === 'week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfThisWeek = new Date(startOfWeek);
      endOfThisWeek.setDate(startOfWeek.getDate() + 7);

      const endOfNextWeek = new Date(endOfThisWeek);
      endOfNextWeek.setDate(endOfThisWeek.getDate() + 7);

      for (const evt of events) {
        const evtDate = new Date(evt.date);
        let groupKey: string;
        let groupTitle: string;
        let groupIcon = '📆';

        if (evtDate < startOfWeek) {
          groupKey = 'past';
          groupTitle = isArabic ? 'أحداث سابقة' : 'Past Events';
          groupIcon = '🕰️';
        } else if (evtDate < endOfThisWeek) {
          groupKey = 'this-week';
          groupTitle = isArabic ? 'هذا الأسبوع (This Week)' : 'This Week';
          groupIcon = '📅';
        } else if (evtDate < endOfNextWeek) {
          groupKey = 'next-week';
          groupTitle = isArabic ? 'الأسبوع القادم (Next Week)' : 'Next Week';
          groupIcon = '📆';
        } else {
          groupKey = 'later';
          groupTitle = isArabic ? 'خلال الأسابيع القادمة' : 'Upcoming Weeks';
          groupIcon = '🗓️';
        }

        if (!groupsMap.has(groupKey)) {
          groupsMap.set(groupKey, {
            id: groupKey,
            title: groupTitle,
            icon: groupIcon,
            items: [],
          });
        }
        groupsMap.get(groupKey)!.items.push(evt);
      }
    } else if (eventGroupBy === 'month') {
      const thisMonth = today.getMonth();
      const thisYear = today.getFullYear();

      for (const evt of events) {
        const evtDate = new Date(evt.date);
        let groupKey: string;
        let groupTitle: string;
        let groupIcon = '🗓️';

        if (evtDate.getFullYear() === thisYear && evtDate.getMonth() === thisMonth) {
          groupKey = `month-${thisYear}-${thisMonth}`;
          groupTitle = isArabic
            ? `هذا الشهر (${evtDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })})`
            : `This Month (${evtDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`;
          groupIcon = '🌟';
        } else {
          const y = evtDate.getFullYear();
          const m = evtDate.getMonth();
          groupKey = `month-${y}-${m}`;
          groupTitle = evtDate.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
            month: 'long',
            year: 'numeric',
          });
          groupIcon = '🗓️';
        }

        if (!groupsMap.has(groupKey)) {
          groupsMap.set(groupKey, {
            id: groupKey,
            title: groupTitle,
            icon: groupIcon,
            items: [],
          });
        }
        groupsMap.get(groupKey)!.items.push(evt);
      }
    }

    return Array.from(groupsMap.values());
  }, [events, eventGroupBy, isArabic]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <CalendarRange className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                  {isArabic ? 'إدارة التقويم وجدولة التذكيرات' : 'Schedule, Calendar & Reminders'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  <span>{isArabic ? 'تصنيف زمني ذكي' : 'Smart Grouping'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isArabic
                  ? 'عرض وتصنيف التذكيرات والمواعيد حسب اليوم، الأسبوع، أو الشهر مع قوالب المهام التلقائية'
                  : 'Group reminders & events by day, week, or month with 1-click presets'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackMessage && (
          <div className="px-5 py-2.5 bg-emerald-500 text-white font-bold text-xs flex items-center justify-between shadow-md animate-slide-down">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{feedbackMessage}</span>
            </div>
            <button onClick={() => setFeedbackMessage(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Primary Tab switcher */}
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('reminders')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'reminders'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{isArabic ? `التذكيرات (${reminders.length})` : `Reminders (${reminders.length})`}</span>
            </button>

            <button
              onClick={() => setActiveTab('events')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'events'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{isArabic ? `الأحداث (${events.length})` : `Events (${events.length})`}</span>
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'templates'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isArabic ? 'قوالب المهام ⚡' : 'Task Templates ⚡'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {activeTab === 'reminders' && (
              <button
                onClick={() => setIsCreatingReminder(!isCreatingReminder)}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isArabic ? 'تذكير جديد +' : 'New Reminder +'}</span>
              </button>
            )}

            {activeTab === 'events' && (
              <button
                onClick={() => setIsCreating(!isCreating)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isArabic ? 'حدث جديد +' : 'New Event +'}</span>
              </button>
            )}

            {activeTab === 'templates' && (
              <button
                onClick={() => setIsCreatingTemplate(!isCreatingTemplate)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isArabic ? 'قالب جديد +' : 'New Template +'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Grouping & Filtering Sub-bar (for Reminders and Events) */}
        {activeTab === 'reminders' && (
          <div className="px-4 sm:px-5 py-2.5 border-b border-slate-200/60 dark:border-slate-800 bg-amber-50/30 dark:bg-amber-950/10 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* Grouping selector: Day / Week / Month / All */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                <span>{isArabic ? 'تجميع حسب:' : 'Group by:'}</span>
              </span>
              <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                {(
                  [
                    { id: 'day', labelAr: 'اليوم 🗓️', labelEn: 'Day' },
                    { id: 'week', labelAr: 'الأسبوع 📆', labelEn: 'Week' },
                    { id: 'month', labelAr: 'الشهر 📅', labelEn: 'Month' },
                    { id: 'all', labelAr: 'الكل 📋', labelEn: 'All' },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setReminderGroupBy(g.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      reminderGroupBy === g.id
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
                    }`}
                  >
                    {isArabic ? g.labelAr : g.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter: All / Pending / Completed */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <ListFilter className="w-3.5 h-3.5 text-slate-400" />
                <span>{isArabic ? 'الحالة:' : 'Status:'}</span>
              </span>
              <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                {(
                  [
                    { id: 'all', labelAr: `الكل (${reminderStats.total})`, labelEn: `All (${reminderStats.total})` },
                    { id: 'pending', labelAr: `انتظار (${reminderStats.pending})`, labelEn: `Pending (${reminderStats.pending})` },
                    { id: 'completed', labelAr: `مكتمل (${reminderStats.completed})`, labelEn: `Done (${reminderStats.completed})` },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setReminderFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      reminderFilter === f.id
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {isArabic ? f.labelAr : f.labelEn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Grouping Sub-bar for Events */}
        {activeTab === 'events' && (
          <div className="px-4 sm:px-5 py-2.5 border-b border-slate-200/60 dark:border-slate-800 bg-blue-50/30 dark:bg-blue-950/10 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>{isArabic ? 'تصنيف الأحداث حسب:' : 'Group events by:'}</span>
              </span>
              <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                {(
                  [
                    { id: 'day', labelAr: 'اليوم 🗓️', labelEn: 'Day' },
                    { id: 'week', labelAr: 'الأسبوع 📆', labelEn: 'Week' },
                    { id: 'month', labelAr: 'الشهر 📅', labelEn: 'Month' },
                    { id: 'all', labelAr: 'الكل 📋', labelEn: 'All' },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setEventGroupBy(g.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      eventGroupBy === g.id
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
                    }`}
                  >
                    {isArabic ? g.labelAr : g.labelEn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Presets Bar */}
        {(activeTab === 'events' || activeTab === 'reminders') && (
          <div className="px-4 py-2 border-b border-slate-200/60 dark:border-slate-800 bg-indigo-50/30 dark:bg-slate-800/20 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 whitespace-nowrap">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>{isArabic ? 'جدولة سريعة:' : 'Quick Schedule:'}</span>
            </span>
            {DEFAULT_TEMPLATES.slice(0, 5).map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => handleApplyTemplate(tmpl)}
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-1.5 whitespace-nowrap shadow-2xs cursor-pointer"
                title={tmpl.descriptionAr}
              >
                <span>{tmpl.icon}</span>
                <span>{tmpl.title}</span>
                <span className="text-[9px] text-indigo-500 font-normal">({tmpl.defaultTime})</span>
              </button>
            ))}
          </div>
        )}

        {/* Create Direct Reminder Form */}
        {isCreatingReminder && activeTab === 'reminders' && (
          <form
            onSubmit={handleCreateDirectReminder}
            className="p-4 border-b border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20 space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-600" />
                <span>{isArabic ? 'إضافة تذكير وتنبيه جديد' : 'Create New Reminder Alarm'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsCreatingReminder(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={remTitle}
              onChange={(e) => setRemTitle(e.target.value)}
              placeholder={isArabic ? 'نص التذكير (مثال: موعد تسليم التقرير، أخذ الدواء)' : 'Reminder text'}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  {isArabic ? 'التاريخ' : 'Date'}
                </label>
                <input
                  type="date"
                  value={remDate}
                  onChange={(e) => setRemDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  {isArabic ? 'الوقت والتنبيه' : 'Time'}
                </label>
                <input
                  type="time"
                  value={remTime}
                  onChange={(e) => setRemTime(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreatingReminder(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{isArabic ? 'حفظ التذكير ⏰' : 'Set Reminder ⏰'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Create Custom Template Form */}
        {isCreatingTemplate && activeTab === 'templates' && (
          <form
            onSubmit={handleSaveCustomTemplate}
            className="p-4 border-b border-slate-200 dark:border-slate-800 bg-indigo-50/50 dark:bg-slate-800/80 space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>{isArabic ? 'إنشاء قالب مهمة مكرر جديد' : 'Create Custom Task Template'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsCreatingTemplate(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={tmplTitle}
                onChange={(e) => setTmplTitle(e.target.value)}
                placeholder={isArabic ? 'اسم القالب (مثال: صلاة الجمعة، رياضة)' : 'Template Title'}
                required
                className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tmplIcon}
                  onChange={(e) => setTmplIcon(e.target.value)}
                  placeholder="رمز/إيموجي 📌"
                  className="w-20 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center font-bold focus:outline-none"
                />
                <select
                  value={tmplCategory}
                  onChange={(e) => setTmplCategory(e.target.value as any)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                >
                  <option value="worship">🕌 عبادات</option>
                  <option value="work">💼 عمل</option>
                  <option value="productivity">🎯 إنتاجية</option>
                  <option value="health">🏃‍♂️ صحة</option>
                  <option value="personal">👤 شخصي</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  {isArabic ? 'التكرار' : 'Recurrence'}
                </label>
                <select
                  value={tmplRecurrence}
                  onChange={(e) => setTmplRecurrence(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
                >
                  <option value="daily">{isArabic ? 'يومي' : 'Daily'}</option>
                  <option value="weekly">{isArabic ? 'أسبوعي' : 'Weekly'}</option>
                  <option value="monthly">{isArabic ? 'شهري' : 'Monthly'}</option>
                  <option value="workdays">{isArabic ? 'أيام العمل' : 'Workdays'}</option>
                </select>
              </div>

              {tmplRecurrence === 'weekly' && (
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                    {isArabic ? 'يوم الأسبوع' : 'Day of Week'}
                  </label>
                  <select
                    value={tmplDayOfWeek}
                    onChange={(e) => setTmplDayOfWeek(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
                  >
                    <option value={5}>{isArabic ? 'الجمعة' : 'Friday'}</option>
                    <option value={0}>{isArabic ? 'الأحد' : 'Sunday'}</option>
                    <option value={1}>{isArabic ? 'الإثنين' : 'Monday'}</option>
                    <option value={2}>{isArabic ? 'الثلاثاء' : 'Tuesday'}</option>
                    <option value={3}>{isArabic ? 'الأربعاء' : 'Wednesday'}</option>
                    <option value={4}>{isArabic ? 'الخميس' : 'Thursday'}</option>
                    <option value={6}>{isArabic ? 'السبت' : 'Saturday'}</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  {isArabic ? 'الوقت الافتراضي' : 'Default Time'}
                </label>
                <input
                  type="time"
                  value={tmplTime}
                  onChange={(e) => setTmplTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  {isArabic ? 'النوع' : 'Target Type'}
                </label>
                <select
                  value={tmplTargetType}
                  onChange={(e) => setTmplTargetType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
                >
                  <option value="event">{isArabic ? 'حدث في التقويم' : 'Calendar Event'}</option>
                  <option value="reminder">{isArabic ? 'تذكير وتنبه' : 'Reminder Alarm'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={tmplLocation}
                onChange={(e) => setTmplLocation(e.target.value)}
                placeholder={isArabic ? 'المكان (اختياري، مثلاً: المسجد/الشركة)' : 'Location'}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
              />
              <input
                type="text"
                value={tmplDescription}
                onChange={(e) => setTmplDescription(e.target.value)}
                placeholder={isArabic ? 'وصف أو ملاحظة القالب' : 'Description'}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreatingTemplate(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isArabic ? 'حفظ القالب' : 'Save Template'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Create Event Form */}
        {isCreating && activeTab === 'events' && (
          <form
            onSubmit={handleCreateEvent}
            className="p-4 border-b border-slate-200 dark:border-slate-800 bg-blue-50/40 dark:bg-slate-800/60 space-y-3"
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isArabic ? 'عنوان الحدث أو الموعد' : 'Event Title'}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={isArabic ? 'المكان (اختياري)' : 'Location'}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                {isArabic ? 'إضافة الحدث' : 'Add Event'}
              </button>
            </div>
          </form>
        )}

        {/* Content Lists */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 theme-scrollbar">
          {/* TAB 1: TEMPLATES */}
          {activeTab === 'templates' ? (
            <div className="space-y-3">
              {/* Filter and Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: 'all', labelAr: 'الكل 🌟', labelEn: 'All' },
                    { id: 'worship', labelAr: '🕌 عبادات', labelEn: 'Worship' },
                    { id: 'work', labelAr: '💼 عمل', labelEn: 'Work' },
                    { id: 'productivity', labelAr: '🎯 إنتاجية', labelEn: 'Productivity' },
                    { id: 'health', labelAr: '🏃‍♂️ صحة', labelEn: 'Health' },
                    { id: 'personal', labelAr: '👤 شخصي', labelEn: 'Personal' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        selectedCategory === cat.id
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {isArabic ? cat.labelAr : cat.labelEn}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isArabic ? 'بحث في القوالب...' : 'Search templates...'}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Templates Grid */}
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  {isArabic ? 'لا توجد قوالب مطابقة للبحث' : 'No matching templates found'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredTemplates.map((tmpl) => {
                    const occurrence = calculateNextOccurrence(tmpl);
                    return (
                      <div
                        key={tmpl.id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-3 group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="text-2xl p-2 rounded-2xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center">
                                {tmpl.icon}
                              </span>
                              <div>
                                <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                                  {tmpl.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center gap-1">
                                    <Repeat className="w-2.5 h-2.5" />
                                    <span>{getRecurrenceLabel(tmpl)}</span>
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>{tmpl.defaultTime}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {tmpl.isCustom && (
                              <button
                                onClick={() => handleDeleteCustomTemplate(tmpl.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                title={isArabic ? 'حذف القالب' : 'Delete template'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                            {tmpl.descriptionAr}
                          </p>

                          {tmpl.location && (
                            <div className="mt-1.5 text-[10px] text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-rose-400" />
                              <span>{tmpl.location}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                            {isArabic ? `الموعد القادم: ${occurrence.displayDate}` : `Next: ${occurrence.displayDate}`}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleCustomizeTemplate(tmpl)}
                              className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                              title={isArabic ? 'تعديل التوقيت والبيانات قبل الإضافة' : 'Customize date & details'}
                            >
                              {isArabic ? 'تخصيص' : 'Customize'}
                            </button>

                            <button
                              onClick={() => handleApplyTemplate(tmpl)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-xs transition flex items-center gap-1 cursor-pointer transform active:scale-95"
                            >
                              <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                              <span>{isArabic ? 'تطبيق القالب 🚀' : 'Apply 🚀'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === 'events' ? (
            /* TAB 2: EVENTS WITH GROUPING */
            groupedEvents.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p>{isArabic ? 'لا توجد أحداث مجدولة في التقويم' : 'No calendar events scheduled'}</p>
                <button
                  onClick={() => setActiveTab('templates')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:underline"
                >
                  {isArabic ? 'استكشاف قوالب المهام المتكررة ⚡' : 'Explore Recurring Templates ⚡'}
                </button>
              </div>
            ) : (
              groupedEvents.map((section) => (
                <div key={section.id} className="space-y-2">
                  {/* Group Header */}
                  <div className="flex items-center justify-between px-2 py-1 bg-slate-100/70 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{section.icon}</span>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        {section.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        {section.items.length}
                      </span>
                    </div>

                    {section.datePrefill && (
                      <button
                        onClick={() => {
                          setDate(section.datePrefill!);
                          setIsCreating(true);
                        }}
                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isArabic ? 'إضافة حدث هنا' : 'Add event here'}</span>
                      </button>
                    )}
                  </div>

                  {/* Group Items */}
                  <div className="space-y-2">
                    {section.items.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between shadow-2xs hover:border-blue-300 transition"
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                            {evt.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-blue-500" />
                              <span>{evt.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>{evt.time}</span>
                            </div>
                            {evt.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                <span>{evt.location}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => onDeleteEvent(evt.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )
          ) : (
            /* TAB 3: REMINDERS WITH GROUPING (DAY / WEEK / MONTH / ALL) */
            groupedReminders.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p>
                  {reminderFilter !== 'all'
                    ? isArabic
                      ? 'لا توجد تذكيرات مطابقة للفلتر المحدد'
                      : 'No reminders match selected filter'
                    : isArabic
                    ? 'لا توجد تذكيرات مسجلة'
                    : 'No reminders set'}
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setIsCreatingReminder(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                  >
                    {isArabic ? 'إضافة تذكير جديد ⏰' : 'Add New Reminder ⏰'}
                  </button>
                  <button
                    onClick={() => setActiveTab('templates')}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:underline"
                  >
                    {isArabic ? 'استكشاف القوالب ⚡' : 'Explore Templates ⚡'}
                  </button>
                </div>
              </div>
            ) : (
              groupedReminders.map((section) => (
                <div key={section.id} className="space-y-2">
                  {/* Group Section Header */}
                  <div
                    className={`flex items-center justify-between px-3 py-1.5 rounded-xl border transition ${
                      section.isOverdue
                        ? 'bg-rose-500/10 dark:bg-rose-950/20 border-rose-500/30 text-rose-700 dark:text-rose-300'
                        : section.isCompletedGroup
                        ? 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100/80 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{section.icon}</span>
                      <h4 className="font-bold text-xs">{section.title}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          section.isOverdue
                            ? 'bg-rose-500 text-white'
                            : section.isCompletedGroup
                            ? 'bg-emerald-500 text-white'
                            : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {section.items.length}
                      </span>
                    </div>

                    {!section.isCompletedGroup && section.datePrefill && (
                      <button
                        onClick={() => {
                          setRemDate(section.datePrefill!);
                          setIsCreatingReminder(true);
                        }}
                        className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isArabic ? 'إضافة تذكير بهذا اليوم' : 'Add reminder on this day'}</span>
                      </button>
                    )}
                  </div>

                  {/* Group Section Items */}
                  <div className="space-y-2">
                    {section.items.map((rem) => {
                      const isItemOverdue = !rem.isCompleted && new Date(rem.targetTime) < new Date();
                      return (
                        <div
                          key={rem.id}
                          className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            rem.isCompleted
                              ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-65'
                              : isItemOverdue
                              ? 'bg-rose-50/40 dark:bg-rose-950/15 border-rose-300/80 dark:border-rose-800/50'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:border-amber-400'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => onToggleReminder(rem.id)}
                              className={`w-5 h-5 rounded-md flex items-center justify-center border transition cursor-pointer shrink-0 ${
                                rem.isCompleted
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : isItemOverdue
                                  ? 'border-rose-400 text-rose-500 hover:border-emerald-500'
                                  : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                              }`}
                              title={rem.isCompleted ? (isArabic ? 'إعادة التعيين' : 'Uncheck') : (isArabic ? 'تحديد كمكتمل' : 'Mark done')}
                            >
                              {rem.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                            </button>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4
                                  className={`font-bold text-xs sm:text-sm ${
                                    rem.isCompleted
                                      ? 'line-through text-slate-400'
                                      : 'text-slate-800 dark:text-slate-100'
                                  }`}
                                >
                                  {rem.title}
                                </h4>
                                {isItemOverdue && !rem.isCompleted && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                    {isArabic ? 'متأخر ⚠️' : 'Overdue ⚠️'}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-amber-500" />
                                <span>{new Date(rem.targetTime).toLocaleString(isArabic ? 'ar-EG' : 'en-US')}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {!rem.isCompleted && onSnoozeReminder && (
                              <div className="flex items-center gap-1 bg-amber-500/10 dark:bg-amber-500/20 p-1 rounded-xl border border-amber-500/30">
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 px-1 hidden xs:inline">
                                  {isArabic ? 'تأجيل ⏰' : 'Snooze'}
                                </span>
                                <button
                                  onClick={() => {
                                    onSnoozeReminder(rem.id, 10);
                                    showFeedback(isArabic ? 'تم تأجيل التذكير 10 دقائق ⏰' : 'Snoozed by 10 minutes ⏰');
                                  }}
                                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[10px] hover:bg-amber-500 hover:text-white transition cursor-pointer shadow-2xs"
                                  title={isArabic ? 'تأجيل 10 دقائق' : 'Snooze 10 minutes'}
                                >
                                  +10m
                                </button>
                                <button
                                  onClick={() => {
                                    onSnoozeReminder(rem.id, 30);
                                    showFeedback(isArabic ? 'تم تأجيل التذكير 30 دقيقة ⏰' : 'Snoozed by 30 minutes ⏰');
                                  }}
                                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[10px] hover:bg-amber-500 hover:text-white transition cursor-pointer shadow-2xs"
                                  title={isArabic ? 'تأجيل 30 دقيقة' : 'Snooze 30 minutes'}
                                >
                                  +30m
                                </button>
                                <button
                                  onClick={() => {
                                    onSnoozeReminder(rem.id, 60);
                                    showFeedback(isArabic ? 'تم تأجيل التذكير 60 دقيقة ⏰' : 'Snoozed by 60 minutes ⏰');
                                  }}
                                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[10px] hover:bg-amber-500 hover:text-white transition cursor-pointer shadow-2xs"
                                  title={isArabic ? 'تأجيل 60 دقيقة' : 'Snooze 60 minutes'}
                                >
                                  +60m
                                </button>
                              </div>
                            )}

                            <button
                              onClick={() => onDeleteReminder(rem.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              title={isArabic ? 'حذف التذكير' : 'Delete reminder'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};
