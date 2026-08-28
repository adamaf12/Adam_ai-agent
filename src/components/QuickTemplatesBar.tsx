import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  Calendar,
  Code,
  Mail,
  Database,
  Share2,
  Languages,
  Search,
  Lightbulb,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Briefcase,
  PenTool,
  Zap,
} from 'lucide-react';

export interface QuickTemplate {
  id: string;
  labelAr: string;
  labelEn: string;
  promptAr: string;
  promptEn: string;
  category: 'popular' | 'business' | 'writing' | 'coding' | 'productivity';
  iconName: string;
  badgeAr?: string;
  badgeEn?: string;
}

export const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    id: 'summarize',
    labelAr: 'لخص هذا النص 📝',
    labelEn: 'Summarize Text 📝',
    promptAr: 'لخص هذا النص بدقة وأبرز أهم النقاط والنتائج الرئيسية:\n',
    promptEn: 'Summarize this text accurately highlighting key takeaways and action items:\n',
    category: 'popular',
    iconName: 'FileText',
    badgeAr: 'شائع',
    badgeEn: 'Popular',
  },
  {
    id: 'schedule_meeting',
    labelAr: 'جدول اجتماعي 📅',
    labelEn: 'Schedule Meeting 📅',
    promptAr: 'جدول اجتماعي ومواعيدي ونظم الأجندة والأولويات التالية:\n',
    promptEn: 'Schedule my meeting agenda, timing, and action items for the following:\n',
    category: 'business',
    iconName: 'Calendar',
    badgeAr: 'تنظيم',
    badgeEn: 'Planning',
  },
  {
    id: 'code_review',
    labelAr: 'راجع وصحح الكود 💻',
    labelEn: 'Review & Fix Code 💻',
    promptAr: 'قم بمراجعة هذا الكود البرمجي، اكتشف الأخطاء ونقاط الضعف، وقدم النسخة المحسنة مع الشرح:\n```\n\n```',
    promptEn: 'Review this code snippet, identify bugs and performance issues, and provide the refactored clean version:\n```\n\n```',
    category: 'coding',
    iconName: 'Code',
    badgeAr: 'برمجة',
    badgeEn: 'Coding',
  },
  {
    id: 'json_extract',
    labelAr: 'استخراج كـ JSON 📊',
    labelEn: 'Extract as JSON 📊',
    promptAr: 'استخرج كافة البيانات والمعلومات التالية ونظمها في هيكل JSON قياسي ودقيق:\n',
    promptEn: 'Extract and structure all data from the following text into a clean valid JSON format:\n',
    category: 'coding',
    iconName: 'Database',
  },
  {
    id: 'formal_email',
    labelAr: 'صياغة بريد رسمي ✉️',
    labelEn: 'Formal Email ✉️',
    promptAr: 'اكتب بريداً إلكترونياً رسمياً واحترافياً مع عنوان جذاب ومحتوى واضح بخصوص:\n',
    promptEn: 'Draft a professional and polished email with a compelling subject line regarding:\n',
    category: 'business',
    iconName: 'Mail',
  },
  {
    id: 'social_post',
    labelAr: 'منشور تفاعلي 📱',
    labelEn: 'Viral Social Post 📱',
    promptAr: 'اكتب منشوراً تسويقياً جذاباً وتفاعلياً يناسب منصات التواصل (LinkedIn / X) مع هاشتاجات قوية حول:\n',
    promptEn: 'Create an engaging and impactful social media post (LinkedIn / X) with relevant hashtags about:\n',
    category: 'writing',
    iconName: 'Share2',
  },
  {
    id: 'translate_pro',
    labelAr: 'ترجمة احترافية 🌐',
    labelEn: 'Pro Translation 🌐',
    promptAr: 'ترجم هذا النص بدقة وسياق لغوي احترافي بليغ:\n',
    promptEn: 'Translate this text professionally preserving context and nuance:\n',
    category: 'writing',
    iconName: 'Languages',
  },
  {
    id: 'deep_search',
    labelAr: 'بحث وتحليل معمق 🔍',
    labelEn: 'Deep Web Analysis 🔍',
    promptAr: 'ابحث في الويب وحلل أحدث الحقائق والمعلومات المؤكدة حول:\n',
    promptEn: 'Perform deep search and provide verified analysis and latest facts on:\n',
    category: 'popular',
    iconName: 'Search',
  },
  {
    id: 'creative_ideas',
    labelAr: 'توليد أفكار إبداعية 💡',
    labelEn: 'Brainstorm Ideas 💡',
    promptAr: 'اقترح 5 أفكار إبداعية غير تقليدية وحلولاً ذكية لموضوع:\n',
    promptEn: 'Brainstorm 5 innovative, out-of-the-box ideas and solutions for:\n',
    category: 'productivity',
    iconName: 'Lightbulb',
  },
  {
    id: 'action_plan',
    labelAr: 'خطة عمل مرحلية ⚡',
    labelEn: 'Step-by-Step Plan ⚡',
    promptAr: 'ضع خطة عمل تنفيذية مرحلية بالأولويات والخطوات الدقيقة لإنجاز:\n',
    promptEn: 'Generate a step-by-step actionable execution plan with timeline and milestones for:\n',
    category: 'productivity',
    iconName: 'Zap',
  },
];

interface QuickTemplatesBarProps {
  onSelectTemplate: (prompt: string) => void;
  isArabic: boolean;
}

export const QuickTemplatesBar: React.FC<QuickTemplatesBarProps> = ({
  onSelectTemplate,
  isArabic,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeToast, setActiveToast] = useState<string | null>(null);

  const categories = [
    { id: 'all', labelAr: 'الكل ✨', labelEn: 'All ✨', icon: Sparkles },
    { id: 'popular', labelAr: 'الشائعة 🔥', labelEn: 'Popular 🔥', icon: Zap },
    { id: 'business', labelAr: 'الأعمال والجدولة 💼', labelEn: 'Business & Schedule 💼', icon: Briefcase },
    { id: 'writing', labelAr: 'الكتابة والتلخيص ✍️', labelEn: 'Writing & Summary ✍️', icon: PenTool },
    { id: 'coding', labelAr: 'البرمجة والبيانات 💻', labelEn: 'Coding & Data 💻', icon: Code },
    { id: 'productivity', labelAr: 'الإنتاجية ⚡', labelEn: 'Productivity ⚡', icon: Layers },
  ];

  const filteredTemplates =
    selectedCategory === 'all'
      ? QUICK_TEMPLATES
      : QUICK_TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleTemplateClick = (template: QuickTemplate) => {
    const promptText = isArabic ? template.promptAr : template.promptEn;
    onSelectTemplate(promptText);
    
    // Quick feedback toast
    setActiveToast(isArabic ? `تم إدراج: ${template.labelAr}` : `Inserted: ${template.labelEn}`);
    setTimeout(() => setActiveToast(null), 2000);
  };

  const renderIcon = (iconName: string) => {
    const props = { className: 'w-3.5 h-3.5 shrink-0' };
    switch (iconName) {
      case 'FileText':
        return <FileText {...props} className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
      case 'Calendar':
        return <Calendar {...props} className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case 'Code':
        return <Code {...props} className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      case 'Database':
        return <Database {...props} className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
      case 'Mail':
        return <Mail {...props} className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
      case 'Share2':
        return <Share2 {...props} className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
      case 'Languages':
        return <Languages {...props} className="w-3.5 h-3.5 text-teal-500 shrink-0" />;
      case 'Search':
        return <Search {...props} className="w-3.5 h-3.5 text-cyan-500 shrink-0" />;
      case 'Lightbulb':
        return <Lightbulb {...props} className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'Zap':
        return <Zap {...props} className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      default:
        return <Sparkles {...props} className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
    }
  };

  return (
    <div className="w-full select-none" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Top Controls: Toggle Pill Bar & Category Selector */}
      <div className="flex items-center justify-between gap-2 mb-1.5 px-0.5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              isOpen
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
            }`}
            title={isArabic ? 'عرض كافة القوالب والعبارات السريعة' : 'Toggle quick template drawer'}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{isArabic ? 'قوالب سريعة' : 'Quick Templates'}</span>
            {isOpen ? (
              <ChevronUp className="w-3 h-3 opacity-80" />
            ) : (
              <ChevronDown className="w-3 h-3 opacity-80" />
            )}
          </button>

          {/* Quick horizontal preview of top templates (when drawer is closed) */}
          {!isOpen && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {QUICK_TEMPLATES.slice(0, 5).map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateClick(template)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors shrink-0 shadow-2xs hover:border-emerald-500/40"
                >
                  {renderIcon(template.iconName)}
                  <span className="whitespace-nowrap">
                    {isArabic ? template.labelAr : template.labelEn}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Temporary Feedback Notification */}
        {activeToast && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 animate-fade-in bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span className="truncate max-w-[150px]">{activeToast}</span>
          </div>
        )}
      </div>

      {/* Expanded Quick Templates Panel */}
      {isOpen && (
        <div className="p-3 rounded-2xl bg-white/95 dark:bg-slate-800/95 border border-emerald-500/30 shadow-xl shadow-slate-300/30 dark:shadow-black/40 backdrop-blur-md mb-2 animate-fadeIn space-y-2.5">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-slate-100 dark:border-slate-700/60">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{isArabic ? cat.labelAr : cat.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* Grid of Templates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateClick(template)}
                className="flex items-center justify-between gap-2 p-2 rounded-xl text-start bg-slate-50 hover:bg-emerald-50/80 dark:bg-slate-700/50 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-slate-600/60 hover:border-emerald-500/50 transition-all group shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 rounded-lg bg-white dark:bg-slate-800 shadow-2xs border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform">
                    {renderIcon(template.iconName)}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                      {isArabic ? template.labelAr : template.labelEn}
                    </div>
                  </div>
                </div>

                {(template.badgeAr || template.badgeEn) && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-600 text-slate-600 dark:text-slate-200 shrink-0">
                    {isArabic ? template.badgeAr : template.badgeEn}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Footer Tip */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-400 px-1 pt-1">
            <span>
              {isArabic
                ? '💡 انقر على أي قالب لتعبئة مربع الإدخال فوراً وتخصيص التفاصيل.'
                : '💡 Click any template to instantly populate the input box.'}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              {isArabic ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
