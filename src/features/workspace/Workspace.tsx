import { Calendar, Cloud, Code, FileText, Gamepad2, Globe, Mail, Sparkles } from 'lucide-react';
import type { Language, ViewId } from '../../core/domain';

interface WorkspaceProps {
  language: Language;
  onSelectAction?: (prompt: string) => void;
  onNavigate?: (view: ViewId) => void;
}

const c = {
  ar: {
    title: 'مساحة العمل',
    subtitle: 'اربط أدواتك وخدماتك للوصول إلى أعلى إنتاجية مع Adam.',
    apps: 'مشغل الألعاب والتطبيقات',
    appsSub: 'بيئة تشغيل تفاعلية مستقلة لتجربة ألعاب وتطبيقات HTML/JS فوراً.',
    google: 'Google Workspace',
    googleSub: 'البحث والوصول إلى ملفات Google Drive والمستندات الذكية.',
    calendar: 'التقويم والمواعيد',
    calendarSub: 'مزامنة المواعيد اليومية وجداول العمل واقتراح الأوقات المناسبة.',
    mail: 'البريد الإلكتروني',
    mailSub: 'صياغة الردود وتلخيص الرسائل الطويلة وإدارة التنبيهات المهمة.',
    github: 'GitHub والمشاريع',
    githubSub: 'فحص مستودعات الأكواد ومراجعة التغييرات وحل المشاكل التقنية.',
    research: 'البحث الحي والويب',
    researchSub: 'البحث في الإنترنت مع استشهادات ومصادر موثوقة ومحدثة.',
    media: 'استوديو الوسائط',
    mediaSub: 'إنشاء المحتوى المرئي وتوليد الصور وتلخيص المقاطع الصوتية.',
  },
  en: {
    title: 'Workspace Hub',
    subtitle: 'Connect your tools and services to amplify your flow with Adam.',
    apps: 'Games & Apps Sandbox',
    appsSub: 'Dedicated interactive environment to run and play HTML/JS apps instantly.',
    google: 'Google Workspace',
    googleSub: 'Search and interact with your Google Drive files and documents.',
    calendar: 'Calendar & Schedule',
    calendarSub: 'Sync daily agendas, manage meetings, and find optimal focus slots.',
    mail: 'Smart Mail',
    mailSub: 'Draft responses, summarize long threads, and surface priorities.',
    github: 'GitHub & Repositories',
    githubSub: 'Inspect code repositories, review commits, and solve bugs.',
    research: 'Live Web Research',
    researchSub: 'Real-time grounded web exploration with citations and fresh data.',
    media: 'Media Studio',
    mediaSub: 'Generate imagery, craft creative copy, and process multimedia.',
  }
};

export function Workspace({ language, onSelectAction, onNavigate }: WorkspaceProps) {
  const t = c[language];

  const tools = [
    {
      id: 'apps',
      icon: Gamepad2,
      title: t.apps,
      desc: t.appsSub,
      prompt: language === 'ar' ? 'اصنع لي لعبة أركيد أو تطبيق تفاعلي' : 'Build me an interactive arcade game or web app',
      primary: true,
    },
    {
      id: 'google',
      icon: Cloud,
      title: t.google,
      desc: t.googleSub,
      prompt: language === 'ar' ? 'افحص ملفاتي في Google Drive ولخص أحدث المستندات.' : 'Check my Google Drive and summarize recent documents.',
    },
    {
      id: 'calendar',
      icon: Calendar,
      title: t.calendar,
      desc: t.calendarSub,
      prompt: language === 'ar' ? 'ما هي مواعيدي المتبقية لهذا اليوم وكيف أنظم وقتي؟' : 'What does my schedule look like today and how should I prioritize?',
    },
    {
      id: 'mail',
      icon: Mail,
      title: t.mail,
      desc: t.mailSub,
      prompt: language === 'ar' ? 'ساعدني في صياغة رد احترافي وموجز على رسالة العمل.' : 'Help me draft a concise professional email reply.',
    },
    {
      id: 'github',
      icon: Code,
      title: t.github,
      desc: t.githubSub,
      prompt: language === 'ar' ? 'حلل هذا الكود واقترح أفضل الممارسات لتحسين الأداء.' : 'Analyze this code structure and suggest performance improvements.',
    },
    {
      id: 'research',
      icon: Globe,
      title: t.research,
      desc: t.researchSub,
      prompt: language === 'ar' ? 'ابحث في أحدث المستجدات في تقنيات الذكاء الاصطناعي اليوم.' : 'Search for the latest breakthroughs in AI agents today.',
    },
    {
      id: 'media',
      icon: Sparkles,
      title: t.media,
      desc: t.mediaSub,
      prompt: language === 'ar' ? 'صمم لي فكرة محتوى إبداعية لمنشور مع صورة توضيحية.' : 'Brainstorm a creative content campaign with visual concept ideas.',
    },
  ];

  const handleCardClick = (id: string, prompt: string) => {
    if (id === 'apps' && onNavigate) {
      onNavigate('apps');
      return;
    }
    if (id === 'media' && onNavigate) {
      onNavigate('media');
      return;
    }
    if (onSelectAction) {
      onSelectAction(prompt);
    } else if (onNavigate) {
      onNavigate('chat');
    }
  };

  return (
    <section className="feature-page">
      <div className="feature-heading">
        <div>
          <span className="eyebrow">ADAM / WORKSPACE</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
      </div>

      <div className="workspace-grid">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              className={`workspace-card ${tool.primary ? 'workspace-card--primary' : ''}`}
              onClick={() => handleCardClick(tool.id, tool.prompt)}
              type="button"
            >
              <div className="workspace-card-icon">
                <Icon size={20} />
              </div>
              <strong>{tool.title}</strong>
              <small>{tool.desc}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
