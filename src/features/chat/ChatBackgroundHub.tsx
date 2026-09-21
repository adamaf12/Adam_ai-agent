import { useState } from 'react';
import {
  GraduationCap,
  Palette,
  Terminal,
  Gamepad2,
  Brain,
  Compass,
  Database,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';
import type { ViewId } from '../../core/domain';

interface ChatBackgroundHubProps {
  language: 'ar' | 'en';
  onExecutePrompt: (prompt: string) => void;
  onNavigateView: (view: ViewId) => void;
  onOpenAcademicModal?: () => void;
}

interface EngineInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  viewId: ViewId;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgLight: string;
  borderLight: string;
  quickActions: Array<{ labelAr: string; labelEn: string; prompt: string }>;
  status: string;
}

export function ChatBackgroundHub({
  language,
  onExecutePrompt,
  onNavigateView,
  onOpenAcademicModal,
}: ChatBackgroundHubProps) {
  const isAr = language === 'ar';
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('academic');

  const engines: EngineInfo[] = [
    {
      id: 'academic',
      nameAr: 'المرشد الأكاديمي والمكتبات',
      nameEn: 'Academic & World Libraries',
      viewId: 'chat',
      icon: GraduationCap,
      color: 'text-indigo-400',
      bgLight: 'bg-indigo-500/10',
      borderLight: 'border-indigo-500/30',
      status: 'active',
      quickActions: [
        {
          labelAr: 'كناش القوانين وصيغ الامتحانات',
          labelEn: 'Scientific Formula Vault',
          prompt: 'اعرض لي كناش أهم القوانين الرياضية والفيزيائية مع فخاخ الامتحانات والقواعد الذهبية',
        },
        {
          labelAr: 'حل مسألة بالخطوات والبرهان',
          labelEn: 'Proof & Step Solver',
          prompt: 'حل لي مسألة علمية متقدمة خطوة بخطوة بالاستدلال المنطقي والتحليل البعدي',
        },
        {
          labelAr: 'عيادة تشخيص الأخطاء وفخاخ الباك',
          labelEn: 'Exam Traps & Mistake Clinic',
          prompt: 'حلل لي أشهر أخطاء وفخاخ الامتحانات والبكالوريا مع الشفرات الذهبية لتفاديها',
        },
        {
          labelAr: 'كويز تفاعلي فوري لتقييم الفهم',
          labelEn: 'Instant Diagnostic Quiz',
          prompt: 'اطرح علي كويز دراسي تفاعلي فوري مع خيارات متعددة وتفسير نموذجي للحل',
        },
        {
          labelAr: 'أوراق بحثية ومصادر OpenAlex',
          labelEn: 'OpenAlex Scholarly Papers',
          prompt: 'ابحث لي في مصادر OpenAlex وDOAJ عن أحدث الأوراق البحثية المحكمة مفتوحة المصدر',
        },
      ],
    },
    {
      id: 'media',
      nameAr: 'استوديو الميديا والمرئيات',
      nameEn: 'Media & Visual Studio',
      viewId: 'chat',
      icon: Palette,
      color: 'text-purple-400',
      bgLight: 'bg-purple-500/10',
      borderLight: 'border-purple-500/30',
      status: 'active',
      quickActions: [
        {
          labelAr: 'لوحة ألوان سايبربنك',
          labelEn: 'Cyberpunk Palette',
          prompt: 'استخرج لي لوحة ألوان متناسقة لتطبيق سايبربنك مع أكواد HEX وCSS',
        },
        {
          labelAr: 'توليد رسم متجهي SVG',
          labelEn: 'Generate Vector SVG',
          prompt: 'اكتب لي كود رسم متجهي SVG احترافي لرمز ذكاء اصطناعي وأيقونة هندسية',
        },
        {
          labelAr: 'موجه Midjourney سينمائي',
          labelEn: 'Midjourney Prompt',
          prompt: 'صمم لي موجه Midjourney v6 احترافي عالي الدقة 8K لإضاءة سينمائية وتفاصيل بصرية',
        },
      ],
    },
    {
      id: 'terminal',
      nameAr: 'الطرفية والأنظمة',
      nameEn: 'Linux & Terminal',
      viewId: 'chat',
      icon: Terminal,
      color: 'text-emerald-400',
      bgLight: 'bg-emerald-500/10',
      borderLight: 'border-emerald-500/30',
      status: 'active',
      quickActions: [
        {
          labelAr: 'فحص موارد المعالج والذاكرة',
          labelEn: 'System Health Check',
          prompt: 'فحص النظام: نفذ تشخيص شامل لاستهلاك الرام والمعالج والشبكة',
        },
        {
          labelAr: 'أوامر Termux الأساسية',
          labelEn: 'Termux Android Guide',
          prompt: 'اعطني سكربت أندرويد Termux لتثبيت بايثون وحزم التطوير بنقرة واحدة',
        },
      ],
    },
    {
      id: 'sandbox',
      nameAr: 'تطبيقات وساندبوكس الكانفاس',
      nameEn: 'Apps & Canvas Sandbox',
      viewId: 'chat',
      icon: Gamepad2,
      color: 'text-rose-400',
      bgLight: 'bg-rose-500/10',
      borderLight: 'border-rose-500/30',
      status: 'active',
      quickActions: [
        {
          labelAr: 'آلة حاسبة علمية تفاعلية',
          labelEn: 'Interactive Calculator',
          prompt: 'حاسبة تفاعلية',
        },
        {
          labelAr: 'مؤقت وساعة إيقاف دقيقة',
          labelEn: 'Precision Timer',
          prompt: 'مؤقت',
        },
        {
          labelAr: 'لوحة رسم رقمية نيون',
          labelEn: 'Canvas Paint Studio',
          prompt: 'تطبيق رسم',
        },
        {
          labelAr: 'لعبة الثعبان التفاعلية',
          labelEn: 'Neon Snake Game',
          prompt: 'لعبة ثعبان',
        },
      ],
    },
    {
      id: 'iq',
      nameAr: 'الذكاء والاستدلال المنطقي',
      nameEn: 'Cognitive IQ & Logic',
      viewId: 'chat',
      icon: Brain,
      color: 'text-cyan-400',
      bgLight: 'bg-cyan-500/10',
      borderLight: 'border-cyan-500/30',
      status: 'active',
      quickActions: [
        {
          labelAr: 'تحدي ذكاء منطقي متقدم',
          labelEn: 'High-IQ Logic Challenge',
          prompt: 'اطرح علي لغز ذكاء منطقي متقدم مع خيارات متدرجة وبرهان تحليلي',
        },
        {
          labelAr: 'مصفوفة رافن للأنماط',
          labelEn: 'Raven Pattern Matrix',
          prompt: 'أعطني مسألة استدلال تجريدي للتعرف على الأنماط الهندسية وحلها الرياضي',
        },
      ],
    },
    {
      id: 'geospatial',
      nameAr: 'الملاحة والخرائط الجغرافية',
      nameEn: 'Geospatial Navigation',
      viewId: 'chat',
      icon: Compass,
      color: 'text-teal-400',
      bgLight: 'bg-teal-500/10',
      borderLight: 'border-teal-500/30',
      status: 'active',
      quickActions: [
        {
          labelAr: 'تخطيط مسار رحلة ومعالم',
          labelEn: 'Plan Travel Route',
          prompt: 'احسب لي مسار سفر مثالي بين مدينتين مع الإحداثيات والمعالم السياحية وزمن الرحلة',
        },
      ],
    },
    {
      id: 'memory',
      nameAr: 'الذاكرة الدائمة الموحدة',
      nameEn: 'Unified Long-Term Memory',
      viewId: 'memory',
      icon: Database,
      color: 'text-blue-400',
      bgLight: 'bg-blue-500/10',
      borderLight: 'border-blue-500/30',
      status: 'active',
      quickActions: [
        {
          labelAr: 'استرجاع الحقائق المحفوظة',
          labelEn: 'Review Stored Facts',
          prompt: 'ما هي أهم الحقائق والتفضيلات المحفوظة عني في ذاكرتك الدائمة؟',
        },
      ],
    },
  ];

  const currentEngine = engines.find((e) => e.id === activeTab) || engines[0];
  const CurrentIcon = currentEngine.icon;

  return (
    <div className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-3 py-2 transition-all">
      {/* Top Bar: Active Indicator and Quick Engine Chips */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {/* Status pill */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-medium shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isAr ? '8 محركات تعمل بالخلفية' : '8 Background Engines Active'}</span>
          </div>

          {/* Engine quick selectors */}
          {engines.map((engine) => {
            const Icon = engine.icon;
            const isSelected = activeTab === engine.id;
            return (
              <button
                key={engine.id}
                type="button"
                onClick={() => {
                  setActiveTab(engine.id);
                  if (!isExpanded) setIsExpanded(true);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer shrink-0 border ${
                  isSelected
                    ? `${engine.bgLight} ${engine.borderLight} ${engine.color} font-semibold shadow-sm`
                    : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
                title={isAr ? engine.nameAr : engine.nameEn}
              >
                <Icon size={13} className={engine.color} />
                <span className="hidden sm:inline">{isAr ? engine.nameAr : engine.nameEn}</span>
              </button>
            );
          })}
        </div>

        {/* Toggle Expand / Collapse Button */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          title={isAr ? 'عرض/إخفاء إجراءات المحركات السريعة' : 'Toggle Engine Dock'}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded Engine Action Panel */}
      {isExpanded && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/60 animate-fadeIn space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <CurrentIcon size={15} className={currentEngine.color} />
              <span className="font-bold text-slate-100">
                {isAr ? currentEngine.nameAr : currentEngine.nameEn}
              </span>
              <span className="text-[10px] text-slate-500">({isAr ? 'مدمج في الخلفية' : 'Integrated Background Daemon'})</span>
            </div>

            {currentEngine.id === 'academic' ? (
              <button
                type="button"
                onClick={() => onOpenAcademicModal?.()}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 transition-all cursor-pointer font-medium flex items-center gap-1"
              >
                <GraduationCap size={12} />
                <span>{isAr ? 'فتح المكتبة والأكاديمية 🎓' : 'Open Academic Hub 🎓'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onExecutePrompt(currentEngine.quickActions[0]?.prompt || currentEngine.nameAr)}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
              >
                {isAr ? 'تشغيل المحرك في الشات ⚡' : 'Run in Chat ⚡'}
              </button>
            )}
          </div>

          {/* Quick 1-Click Action Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500 shrink-0">
              {isAr ? 'إجراءات لحظية في الشات:' : 'In-Chat Actions:'}
            </span>
            {currentEngine.quickActions.map((action, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onExecutePrompt(action.prompt)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 bg-slate-900 border-slate-800 hover:${currentEngine.borderLight} text-slate-300 hover:${currentEngine.color}`}
              >
                <Zap size={11} className={currentEngine.color} />
                <span>{isAr ? action.labelAr : action.labelEn}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
