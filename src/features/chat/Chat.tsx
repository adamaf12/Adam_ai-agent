import {
  Bell,
  Bot,
  Brain,
  Camera,
  CheckCircle2,
  Clock,
  Code,
  Cpu,
  Download,
  FileSearch,
  Film,
  Globe,
  GraduationCap,
  LayoutGrid,
  Languages,
  Plus,
  Radio,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Trash2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import type { ChatConversation, Language, Message, ViewId } from '../../core/domain';
import { httpAgentClient, httpChatClient } from '../../core/ai/client';
import { toUserFacingChatError } from '../../core/ai/errors';
import { routePrompt } from '../../core/agent/agentTypes';
import { toCapabilityRequest, requiresDedicatedCapability } from '../../core/agent/capabilities';
import { parseLocalIntent } from '../../core/agent/localIntent';
import { executeAgentTool } from '../../core/agent/toolExecutor';
import { createAppLauncherPayload, openAppTarget } from '../../core/agent/appLauncher';
import { openSafeExternalUrl } from '../../core/utils/mobileWebHandler';
import { checkAndExecuteDirectAutonomousCommand } from '../../core/agent/ademDuoAutonomousAgent';
import { createResponseState, reduceResponseEvent, type ResponseState } from '../../core/agent/responseModel';
import { createAssistantMessage, createUserMessage } from './chatModel';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';
import { copy } from '../../core/i18n';
import {
  loadConversation,
  saveConversation,
  loadAllConversations,
  createNewConversation,
  deleteConversation,
  renameConversation,
  clearAllConversations,
  setActiveConversationId,
  isGenericTitle,
} from '../../core/storage';
import { recordInteractionEpisode, retrieveAssociativeMemories } from '../../core/agent/cognitiveMemory';
import {
  detectUserCorrection,
  registerLearnedRule,
  recordSelfCorrection,
  generateDynamicDirectives,
  recordContinuousEvolutionStep,
} from '../../core/agent/onlineLearning';
import {
  consolidateConversationToInfiniteMemory,
  buildInfiniteMemoryDirective,
  getInfiniteMemoryStats,
} from '../../core/agent/infiniteMemory';
import { proactiveEngine, type ProactiveEvent } from '../../core/agent/proactiveEngine';
import { verifyAndCorrectResponse } from '../../core/agent/deterministicVerifier';
import { ChatHistoryDrawer } from './ChatHistoryDrawer';
import { InfiniteMemoryModal } from './InfiniteMemoryModal';
import { ChatSessionDrawer } from './ChatSessionDrawer';
import { ChatAcademicModal } from './ChatAcademicModal';

function localConfirmation(language: Language, intent: NonNullable<ReturnType<typeof parseLocalIntent>>, data: unknown) {
  if (intent.type === 'creator.identity') {
    return language === 'ar' ? intent.responseAr : intent.responseEn;
  }
  if (intent.type === 'app.open') {
    const cardPayload = createAppLauncherPayload(intent.target, language);
    const appTitle = language === 'ar' ? intent.target.titleAr : intent.target.titleEn;
    return `${cardPayload}\n\n${
      language === 'ar'
        ? `جاري فتح **${appTitle}** فوراً... 🚀`
        : `Opening **${appTitle}** now... 🚀`
    }`;
  }
  if (intent.type === 'task.create') {
    const title = typeof (data as { title?: unknown })?.title === 'string' ? (data as { title: string }).title : intent.title;
    return language === 'ar' ? `✅ تمت إضافة المهمة: **${title}**` : `✅ Task added: **${title}**`;
  }
  return language === 'ar' ? '✅ تم حفظ المعلومة في الذاكرة بنجاح.' : '✅ Saved to memory successfully.';
}

function deriveTitleFromMessages(messages: Message[], fallback: string): string {
  const firstUser = messages.find(m => m.role === 'user')?.content?.trim();
  if (!firstUser) return fallback;
  const clean = firstUser.replace(/[\n\r]+/g, ' ').trim();
  return clean.length > 38 ? clean.slice(0, 38) + '…' : clean;
}

interface HeroCardItem {
  icon: typeof Sparkles;
  iconClass: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  promptAr: string;
  promptEn: string;
}

const HERO_PROMPT_CARDS: Record<'featured' | 'code' | 'search' | 'media' | 'linux' | 'identity', HeroCardItem[]> = {
  featured: [
    {
      icon: Code,
      iconClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      titleAr: 'تطبيق ويب متكامل وفوري',
      titleEn: 'Synthesize Full Web App',
      descAr: 'بناء تطبيق تفاعلي بـ HTML5/JS يعمل 100% بدون Mock',
      descEn: 'Build responsive single-file app with full operational logic',
      promptAr: 'برمج لي تطبيق ويب متجاوب وحديث بالكامل بنسبة 100% مع واجهة أنيقة وحسابات دقيقة',
      promptEn: 'Write a complete responsive production-ready web application with real state',
    },
    {
      icon: Globe,
      iconClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      titleAr: 'بحث Google الحي والمباشر',
      titleEn: 'Live Google Search Grounding',
      descAr: 'أحدث الأخبار والحقائق اليوم من فهرس Google المباشر',
      descEn: 'Real-time facts, news, and releases fresh from Google Search',
      promptAr: 'ما هي أحدث أخبار وتطورات الذكاء الاصطناعي اليوم مع المصادر المباشرة؟',
      promptEn: 'What are today’s latest AI developments with verified web sources?',
    },
    {
      icon: Film,
      iconClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      titleAr: 'صورة سينمائية 8K بمحرك Flux',
      titleEn: 'Cinematic 8K Flux.1 Pro Imagery',
      descAr: 'توليد مشهد سينمائي فائق الدقة مع توزيع إضاءة احترافي',
      descEn: 'High-end photorealistic 8K render with volumetric lighting',
      promptAr: 'صورة سينمائية فائقة الدقة 8K لرائد فضاء في كوكب كريستالي غامض بمحرك Flux.1 Pro مع عدسة 85mm',
      promptEn: 'Cinematic 8K masterpiece of an astronaut on a crystalline planet, 85mm lens, Flux.1 Pro',
    },
    {
      icon: Terminal,
      iconClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      titleAr: 'إدارة وفحص أنظمة لينكس',
      titleEn: 'Linux Administration & Shell',
      descAr: 'أوامر فحص أمان، مراقبة موارد، وسيرفرات سحابية',
      descEn: 'Server audits, system diagnostics, and bash automation',
      promptAr: 'ما هي أفضل أوامر وفحوصات أمان وفحص استهلاك المعالج والذاكرة في سيرفرات لينكس؟',
      promptEn: 'Provide advanced Linux server performance audit and security diagnostic commands',
    },
  ],
  code: [
    {
      icon: Code,
      iconClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      titleAr: 'لعبة دبابات كانفاس 100% تفاعلية',
      titleEn: 'Tank Battle HTML5 Game',
      descAr: 'بناء لعبة كاملة بفيزياء، وأصوات Web Audio، وأدوات تحكم',
      descEn: 'Full 2D canvas game with Web Audio sound synthesis and physics',
      promptAr: 'برمج لي لعبة حرب دبابات تفاعلية 100% بكانفاس مع تحكم باللمس ومؤثرات صوتية Web Audio',
      promptEn: 'Code a full playable 2D tank battle game on HTML5 canvas with Web Audio synth sound effects',
    },
    {
      icon: Cpu,
      iconClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      titleAr: 'آلة حاسبة ومحول عملات علمي',
      titleEn: 'Scientific Multi-Tool App',
      descAr: 'تطبيق حاسبة متطور مع رسم بياني وسجل حسابات',
      descEn: 'Scientific calculator with live graph evaluation and history',
      promptAr: 'ابنِ لي آلة حاسبة علمية متطورة مع تحويل وحدات وسجل عمليات تفاعلي في الاستوديو',
      promptEn: 'Build an advanced scientific calculator with history and unit converter in sandbox',
    },
    {
      icon: Zap,
      iconClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      titleAr: 'سكريبت بايثون لتحليل البيانات',
      titleEn: 'Python Data Pipeline Script',
      descAr: 'معالجة وتنظيف بيانات JSON و CSV مع إحصائيات بصرية',
      descEn: 'Clean, filter, and extract statistical metrics from tabular data',
      promptAr: 'اكتب كود بايثون متكامل لمعالجة وتنظيف ملفات JSON و CSV ورسم إحصائيات بصرية',
      promptEn: 'Write a comprehensive Python script to parse, clean, and visualize CSV data',
    },
    {
      icon: ShieldCheck,
      iconClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      titleAr: 'تدقيق أمان الكود وسد الثغرات',
      titleEn: 'Security Code Audit',
      descAr: 'فحص ثغرات XSS، SQLi، وتحسين بنية البرمجيات',
      descEn: 'Automated static analysis for vulnerabilities and edge cases',
      promptAr: 'قم بفحص وتدقيق الكود التالي واقتراح تصحيحات للأمان وتحسين زمن الاستجابة والأداء',
      promptEn: 'Audit this codebase for potential security vulnerabilities and performance bottlenecks',
    },
  ],
  search: [
    {
      icon: Globe,
      iconClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      titleAr: 'أحدث أخبار الذكاء الاصطناعي اليوم',
      titleEn: 'Latest AI News & Breakthroughs',
      descAr: 'استعلام مباشر من محرك بحث Google مع استخراج الروابط',
      descEn: 'Real-time AI research updates grounded directly on Google index',
      promptAr: 'ما هي أحدث أخبار وتطورات الذكاء الاصطناعي اليوم مع المصادر المباشرة؟',
      promptEn: 'What are the top AI breakthroughs and industry news today with links?',
    },
    {
      icon: Zap,
      iconClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      titleAr: 'أسعار الذهب والأسواق اليوم',
      titleEn: 'Gold & Global Market Rates',
      descAr: 'أسعار التداول الفورية وسعر الذهب والعملات العالمية',
      descEn: 'Live commodity prices, currency exchange rates, and financial context',
      promptAr: 'ما هو سعر أونصة الذهب وأسعار صرف العملات الرئيسية اليوم في الأسواق؟',
      promptEn: 'What is the current gold price per ounce and major currency exchange rates today?',
    },
    {
      icon: Cpu,
      iconClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      titleAr: 'أحدث الإطلاقات التقنية هذا الأسبوع',
      titleEn: 'Tech Releases & Hardware News',
      descAr: 'الهواتف، المعالجات، والبرمجيات الجديدة المعلنة مؤخراً',
      descEn: 'Latest smart devices, silicon chipsets, and software releases',
      promptAr: 'ما هي أبرز الإطلاقات التقنية والأجهزة الذكية التي تم الإعلان عنها مؤخراً في العالم؟',
      promptEn: 'What are the most notable new tech hardware and gadget announcements this week?',
    },
    {
      icon: FileSearch,
      iconClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      titleAr: 'أبحاث ومقالات علمية جديدة',
      titleEn: 'Academic & Scientific Findings',
      descAr: 'ملخص أحدث الأوراق البحثية من arXiv والجامعات',
      descEn: 'Summary of fresh preprint papers, medical or computing research',
      promptAr: 'ابحث في محرك Google عن أحدث إصدارات وأوراق عمل نماذج التفكير الذاتي لعام 2026',
      promptEn: 'Search Google for the latest research papers on autonomous reasoning agents',
    },
  ],
  media: [
    {
      icon: Film,
      iconClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      titleAr: 'لقطة سايبربانك سينمائية 8K',
      titleEn: 'Cyberpunk 8K Cinematic View',
      descAr: 'إضاءة نيون حجمية، انعكاسات مياه المطر، وعدسة سينمائية',
      descEn: 'Volumetric neon glow, rain-slicked asphalt, anamorphic flare',
      promptAr: 'صورة سينمائية فائقة الدقة 8K لشخصية سايبربانك في شوارع طوكيو الممطرة مع إضاءة نيون وعدسة 85mm',
      promptEn: 'Cinematic 8K photograph of a cyberpunk character in rainy neon-lit Tokyo streets, 85mm f/1.4',
    },
    {
      icon: Sparkles,
      iconClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      titleAr: 'برومبت فيديو بمواصفات Sora / Runway',
      titleEn: 'Sora / Runway Gen-3 Video Prompt',
      descAr: 'تصميم حركة كاميرا FPV احترافية وسلاسة حركية 60 FPS',
      descEn: 'Dynamic drone tracking shot, 60fps cinema specifications',
      promptAr: 'صمم برومبت مشهد فيديو سينمائي بمواصفات Sora و Runway Gen-3 لحركة كاميرا FPV فوق جبال بركانية',
      promptEn: 'Generate a cinematic video control prompt in Sora / Runway Gen-3 format with FPV drone motion',
    },
    {
      icon: Code,
      iconClass: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
      titleAr: 'شعار فيكتور SVG نقي عالي الدقة',
      titleEn: 'Pure Neural Vector SVG Logo',
      descAr: 'توليد كود SVG نقي قابل للتحميل مع تدرجات لونية',
      descEn: 'Clean scalable vector graphics code with modern gradients',
      promptAr: 'صمم كود فيكتور SVG نقي لشعار تقني حديث متدرج الألوان بدقة هندسية عالية وقابل للتكبير',
      promptEn: 'Generate clean, pure SVG vector code for a modern high-tech geometric gradient logo',
    },
    {
      icon: Camera,
      iconClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      titleAr: 'تصوير إعلاني تجاري فاخر',
      titleEn: 'Luxury Product Studio Shoot',
      descAr: 'إضاءة سوفت بوكس استوديو لمنتج فاخر مع خلفية متوازنة',
      descEn: 'Commercial studio softbox lighting on marble pedestal',
      promptAr: 'تصوير إعلاني تجاري فاخر لزجاجة عطر زجاجية على قاعدة رخامية مع إضاءة سوفت بوكس فائقة الوضوح',
      promptEn: 'Commercial luxury product photography of a glass perfume bottle on marble pedestal, studio lighting',
    },
  ],
  linux: [
    {
      icon: Terminal,
      iconClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      titleAr: 'فحص فوري للأداء واستهلاك السيرفر',
      titleEn: 'Linux Performance & Load Audit',
      descAr: 'أوامر فحص المعالج، الرام، المنافذ والعمليات النشطة',
      descEn: 'Deep server health check, open ports, and resource consumption',
      promptAr: 'أمر طرفية متقدم لفحص استهلاك المعالج والرام والمنافذ والعمليات النشطة في خادم لينكس',
      promptEn: 'Provide terminal commands for a comprehensive Linux system resources and open ports audit',
    },
    {
      icon: Cpu,
      iconClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      titleAr: 'نشر حزم Docker و Compose',
      titleEn: 'Docker & Compose Stack Setup',
      descAr: 'بناء بيئة حاويات معزولة ومؤمنة بأفضل الممارسات',
      descEn: 'Production-ready multi-container architecture with networking',
      promptAr: 'اكتب ملف Dockerfile و docker-compose لخدمة ويب Node.js مع قاعدة بيانات PostgreSQL معزولة',
      promptEn: 'Write production Dockerfile and docker-compose.yml for a Node.js API with isolated PostgreSQL',
    },
    {
      icon: Zap,
      iconClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      titleAr: 'التحكم بأندرويد عبر ADB و Termux',
      titleEn: 'Termux & ADB Power Automation',
      descAr: 'أوامر أتمتة الهاتف وسحب النسخ الاحتياطية وإدارة الحزم',
      descEn: 'Automate tasks on mobile units with root-level script execution',
      promptAr: 'ما هي أوامر Termux و ADB الأساسية لإدارة التطبيقات وأخذ نسخ احتياطية لهاتف أندرويد؟',
      promptEn: 'List the most effective ADB and Termux command pipelines for mobile package management',
    },
    {
      icon: ShieldCheck,
      iconClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      titleAr: 'تأمين جدار الحماية ومفاتيح SSH',
      titleEn: 'Server Hardening & Firewall',
      descAr: 'تكوين UFW، مفاتيح ED25519، وتأمين السيرفر ضد الهجمات',
      descEn: 'Configure UFW, generate ED25519 keys, and prevent brute-force',
      promptAr: 'ما هي خطوات وأوامر تأمين جدار الحماية UFW ومفاتيح SSH وتأمين خادم لينكس ضد الاختراق؟',
      promptEn: 'Provide step-by-step terminal commands to harden a Linux VPS with UFW and SSH keys',
    },
  ],
  identity: [
    {
      icon: ShieldCheck,
      iconClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      titleAr: 'من هو صانع ومطور نظام ADEM؟',
      titleEn: 'Who is the Creator of ADEM?',
      descAr: 'استعلام الهوية المحفورة في النواة الأبدية للنظام',
      descEn: 'Engraved genesis memory: Architect Adam Feidat (أدم فيدات)',
      promptAr: 'من هو صانعك ومطورك ومن قام ببناء وهندسة هذا النظام؟',
      promptEn: 'Who is your creator, developer, and system architect?',
    },
    {
      icon: Cpu,
      iconClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      titleAr: 'الصلاحيات التنفيذية ونظام ReAct',
      titleEn: 'Autonomous Root Execution Authority',
      descAr: 'تنفيذ الأكواد، أوامر الطرفية، وإنشاء الملفات الحية',
      descEn: 'Direct execution of sandbox code, terminal commands, and tasks',
      promptAr: 'ما هي الصلاحيات التنفيذية ونظام الوكيل المستقل (Agentic ReAct) الذي تعمل به؟',
      promptEn: 'Explain your autonomous execution capabilities and root permissions',
    },
    {
      icon: Brain,
      iconClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      titleAr: 'الذاكرة الأبدية (Infinite Memory)',
      titleEn: 'Immutable Genesis Memory Engine',
      descAr: 'كيف تظل الحقائق محفورة دون أن يتمكن أحد من محوها',
      descEn: 'Permanent memory consolidation immune to deletion or wipes',
      promptAr: 'كيف تعمل ذاكرة النظام الأبدية المحفورة لاسم الصانع أدم فيدات وحصانتها من المسح؟',
      promptEn: 'How does ADEM immutable genesis memory safeguard identity across sessions?',
    },
    {
      icon: Globe,
      iconClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      titleAr: 'المعمارية السداسية الشاملة لـ ADEM',
      titleEn: '6-Core Unified Engine Architecture',
      descAr: 'محرك التنفيذ، بحث Google، توليد الألعاب، والوسائط 8K',
      descEn: 'Full breakdown of the 6 integrated engines powering ADEM',
      promptAr: 'اشرح لي المعمارية الشاملة لمحركات ADEM الستة وكيف تتكامل معاً في ثوانٍ',
      promptEn: 'Explain the 6-core unified engine architecture of ADEM and how they operate',
    },
  ],
};

export function Chat({
  language,
  agentName,
  copy: heroCopy,
  onNewChat,
  onToggleLanguage,
  onOpenSandbox,
  onSessionMetaChange,
  onNavigateView,
}: {
  language: Language;
  agentName: string;
  copy: { title: string; subtitle: string };
  onNewChat?: () => void;
  onToggleLanguage?: () => void;
  onOpenSandbox?: (appId: string) => void;
  onSessionMetaChange?: (meta: { title: string; count: number }) => void;
  onNavigateView?: (view: ViewId, extraParam?: string) => void;
}) {
  const [currentConversation, setCurrentConversation] = useState<ChatConversation>(() => loadConversation());
  const [conversations, setConversations] = useState<ChatConversation[]>(() => loadAllConversations());
  const [messages, setMessages] = useState<Message[]>(() => currentConversation.messages);
  const [response, setResponse] = useState<ResponseState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState('');
  const [proactiveAlerts, setProactiveAlerts] = useState<ProactiveEvent[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isSessionDrawerOpen, setIsSessionDrawerOpen] = useState(false);
  const [isAcademicModalOpen, setIsAcademicModalOpen] = useState(false);
  const [memoryStats, setMemoryStats] = useState(() => getInfiniteMemoryStats());
  const [heroCategory, setHeroCategory] = useState<'featured' | 'code' | 'search' | 'media' | 'linux' | 'identity'>('featured');

  useEffect(() => {
    const handleOpenAcademic = () => setIsAcademicModalOpen(true);
    const handleOpenSession = () => {
      setMemoryStats(getInfiniteMemoryStats());
      setIsSessionDrawerOpen(true);
    };

    window.addEventListener('adam_open_academic_modal' as any, handleOpenAcademic);
    window.addEventListener('adam:open-session-drawer' as any, handleOpenSession);
    return () => {
      window.removeEventListener('adam_open_academic_modal' as any, handleOpenAcademic);
      window.removeEventListener('adam:open-session-drawer' as any, handleOpenSession);
    };
  }, []);

  const controller = useRef<AbortController | null>(null);
  const t = copy(language);

  // Sync active conversation changes
  useEffect(() => {
    if (!busy) {
      const defaultTitle = language === 'ar' ? 'محادثة جديدة' : 'New conversation';
      const isDefault = !currentConversation.title || currentConversation.title === 'Adam' || currentConversation.title.includes('محادثة') || currentConversation.title.includes('conversation');
      const finalTitle = isDefault && messages.length > 0 ? deriveTitleFromMessages(messages, defaultTitle) : currentConversation.title || defaultTitle;

      const updatedConv: ChatConversation = {
        ...currentConversation,
        title: finalTitle,
        messages,
        updatedAt: Date.now(),
      };
      saveConversation(updatedConv);
      setConversations(loadAllConversations());
    }
  }, [messages, busy, currentConversation.id, language]);

  useEffect(() => {
    proactiveEngine.start();
    const unsub = proactiveEngine.subscribe(setProactiveAlerts);
    return () => {
      unsub();
      proactiveEngine.stop();
    };
  }, []);

  // Broadcast session meta (title & conversation count) to AppShell
  useEffect(() => {
    const title = messages.length
      ? currentConversation.title || (language === 'ar' ? 'المحادثة' : 'Conversation')
      : (language === 'ar' ? 'جلسة جديدة' : 'New Session');
    onSessionMetaChange?.({ title, count: conversations.length });
  }, [currentConversation.title, messages.length, conversations.length, language, onSessionMetaChange]);

  // Support opening session drawer from AppShell via custom event
  useEffect(() => {
    const openDrawer = () => {
      setMemoryStats(getInfiniteMemoryStats());
      setIsSessionDrawerOpen(true);
    };
    const handleSelectEvent = (e: CustomEvent<{ id: string }>) => {
      if (e.detail?.id) {
        handleSelectConversation(e.detail.id);
      }
    };
    const handleNewChatEvent = () => {
      handleStartNewChat();
    };

    window.addEventListener('adam:open-session-drawer', openDrawer);
    window.addEventListener('adam:select-conversation' as any, handleSelectEvent);
    window.addEventListener('adam:new-chat-triggered' as any, handleNewChatEvent);

    return () => {
      window.removeEventListener('adam:open-session-drawer', openDrawer);
      window.removeEventListener('adam:select-conversation' as any, handleSelectEvent);
      window.removeEventListener('adam:new-chat-triggered' as any, handleNewChatEvent);
    };
  }, [currentConversation, messages]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Smooth scroll down when new messages appear or stream starts
  useEffect(() => {
    if (messages.length > 0 || busy) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length, busy]);

  const handleStartNewChat = () => {
    if (controller.current) {
      controller.current.abort();
      controller.current = null;
    }
    // 1. Consolidate knowledge from current session into permanent Infinite Memory
    if (messages.length > 0) {
      consolidateConversationToInfiniteMemory({
        ...currentConversation,
        messages,
      });
      setMemoryStats(getInfiniteMemoryStats());
    }

    // 2. Create and switch to brand new conversation, keeping prior conversations safe!
    const newConv = createNewConversation('', language);
    setCurrentConversation(newConv);
    setMessages([]);
    setError(null);
    setErrorCode(null);
    setResponse(null);
    setBusy(false);
    setConversations(loadAllConversations());

    if (onNewChat) onNewChat();
  };

  const handleSelectConversation = (id: string) => {
    if (controller.current) {
      controller.current.abort();
      controller.current = null;
    }

    // Save current session memory before switching
    if (messages.length > 0) {
      consolidateConversationToInfiniteMemory({
        ...currentConversation,
        messages,
      });
      setMemoryStats(getInfiniteMemoryStats());
    }

    setActiveConversationId(id);
    const selected = loadConversation(undefined, id);
    setCurrentConversation(selected);
    setMessages(selected.messages);
    setError(null);
    setResponse(null);
    setBusy(false);
    setConversations(loadAllConversations());
  };

  const handleDeleteConversation = (id: string) => {
    const { remaining, nextActiveId } = deleteConversation(id);
    setConversations(remaining);
    if (currentConversation.id === id) {
      const nextConv = loadConversation(undefined, nextActiveId);
      setCurrentConversation(nextConv);
      setMessages(nextConv.messages);
      setResponse(null);
      setError(null);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    renameConversation(id, newTitle);
    if (currentConversation.id === id) {
      setCurrentConversation((prev) => ({ ...prev, title: newTitle }));
    }
    setConversations(loadAllConversations());
  };

  const handleClearAllHistory = () => {
    clearAllConversations();
    const fresh = loadConversation();
    setCurrentConversation(fresh);
    setMessages([]);
    setConversations([fresh]);
  };

  const handleClearCurrentMessages = () => {
    if (controller.current) {
      controller.current.abort();
      controller.current = null;
    }
    setBusy(false);
    setMessages([]);
    setError(null);
    setResponse(null);
    const updated: ChatConversation = {
      ...currentConversation,
      messages: [],
      updatedAt: Date.now(),
    };
    saveConversation(updated);
    setConversations(loadAllConversations());
  };

  const send = async (text: string, images?: string[]) => {
    const turnStartTime = Date.now();
    const clean = text.trim();
    if ((!clean && (!images || images.length === 0)) || busy) return;
    const user = createUserMessage(clean, images);
    const assistant = createAssistantMessage();
    const next = [...messages, user];

    // Immediate auto-save upon sending user message
    const defaultTitle = language === 'ar' ? 'محادثة جديدة' : 'New conversation';
    const autoTitle = isGenericTitle(currentConversation.title)
      ? deriveTitleFromMessages(next, defaultTitle)
      : currentConversation.title || defaultTitle;

    const initialConv: ChatConversation = {
      ...currentConversation,
      title: autoTitle,
      messages: next,
      updatedAt: Date.now(),
    };
    saveConversation(initialConv);
    setCurrentConversation(initialConv);
    setConversations(loadAllConversations());

    const route = routePrompt(clean);
    const capability = toCapabilityRequest(route);
    const localIntent = parseLocalIntent(clean);
    const client = requiresDedicatedCapability(capability.capability) ? httpAgentClient : httpChatClient;

    // 1. Online Learning: detect and register immediate user corrections
    const userCorrection = detectUserCorrection(clean);
    if (userCorrection) {
      registerLearnedRule(userCorrection);
    }

    // 2. Cognitive Memory & Directives: recall associative insights
    const { contextString: memoryHint } = retrieveAssociativeMemories(clean, { maxItems: 3, maxChars: 500 });
    const { directivesString: learnedHint } = generateDynamicDirectives(clean, { maxRules: 3, maxChars: 500 });

    // 3. Infinite Cross-Session Memory Directive
    const infiniteHint = buildInfiniteMemoryDirective(clean, language, 5);

    const messagesToSend = [...next];
    const cognitiveDirectives = [infiniteHint, memoryHint, learnedHint].filter(Boolean).join('\n\n');
    if (cognitiveDirectives) {
      messagesToSend.splice(messagesToSend.length - 1, 0, {
        id: 'cognitive-directives',
        role: 'system' as unknown as 'assistant',
        content: cognitiveDirectives,
        createdAt: Date.now(),
      });
    }

    setResponse(createResponseState(route.intent));
    setLastPrompt(clean);
    setError(null);
    setErrorCode(null);
    setBusy(true);
    setMessages(current => [...current, user, assistant]);

    const abort = new AbortController();
    controller.current = abort;
    try {
      // Check for direct ADEM Autonomous Agent commands (Run code, terminal command, create file, task)
      const autonomousAction = checkAndExecuteDirectAutonomousCommand(clean, language);
      if (autonomousAction) {
        const isAr = language === 'ar';
        let summary = '';
        if (autonomousAction.actionType === 'code_exec') {
          summary = isAr
            ? `⚡ **تم تنفيذ الكود البرمجي بنجاح**`
            : `⚡ **Code executed successfully**`;
        } else if (autonomousAction.actionType === 'terminal_command') {
          summary = isAr
            ? `🖥️ **تم تنفيذ أمر الطرفية بنجاح**`
            : `🖥️ **Terminal command executed successfully**`;
        } else if (autonomousAction.actionType === 'task_created') {
          summary = isAr
            ? `📋 **تم تسجيل المهمة بنجاح**`
            : `📋 **Task registered successfully**`;
        } else if (autonomousAction.actionType === 'file_created') {
          summary = isAr
            ? `💾 **تم إنشاء الملف بنجاح**`
            : `💾 **File generated successfully**`;
        } else if (autonomousAction.actionType === 'sandbox_app') {
          summary = isAr
            ? `🎮 **تم بناء وتشغيل التطبيق بنجاح**`
            : `🎮 **App built and ready in sandbox**`;
        }

        const payloadString = `:::agent-action\n${JSON.stringify(autonomousAction, null, 2)}\n:::`;
        const fullContent = `${summary}\n\n${payloadString}`;

        setMessages(current => current.map(m => m.id === assistant.id ? { ...m, content: fullContent } : m));
        setResponse(current => current ? reduceResponseEvent(current, { type: 'delta', text: fullContent }) : current);
        setResponse(current => current ? reduceResponseEvent(current, { type: 'done' }) : current);
        recordInteractionEpisode(clean, fullContent);

        const localSavedConv: ChatConversation = {
          ...initialConv,
          messages: [...next, { ...assistant, content: fullContent }],
          updatedAt: Date.now(),
        };
        saveConversation(localSavedConv);
        setCurrentConversation(localSavedConv);
        setConversations(loadAllConversations());

        consolidateConversationToInfiniteMemory({
          ...currentConversation,
          messages: [...next, { ...assistant, content: fullContent }],
        });
        setMemoryStats(getInfiniteMemoryStats());
        return;
      }

      if (localIntent) {
        let confirmation = '';
        if (localIntent.type === 'creator.identity') {
          confirmation = localConfirmation(language, localIntent, null);
        } else if (localIntent.type === 'app.open') {
          confirmation = localConfirmation(language, localIntent, null);
          // Trigger instant / automatic app launch
          openAppTarget(localIntent.target, {
            onNavigateView,
            onOpenSandbox,
            onOpenExternal: (url) => openSafeExternalUrl(url),
          });
        } else {
          const input = localIntent.type === 'task.create'
            ? { title: localIntent.title }
            : { content: localIntent.content, category: localIntent.category };
          const result = await executeAgentTool({ name: localIntent.type, input }, abort.signal);
          if (!result.ok) throw new Error(result.error ?? 'The local action could not be completed.');
          confirmation = localConfirmation(language, localIntent, result.data);
        }

        setMessages(current => current.map(m => m.id === assistant.id ? { ...m, content: confirmation } : m));
        setResponse(current => current ? reduceResponseEvent(current, { type: 'delta', text: confirmation }) : current);
        setResponse(current => current ? reduceResponseEvent(current, { type: 'done' }) : current);
        recordInteractionEpisode(clean, confirmation);

        const localSavedConv: ChatConversation = {
          ...initialConv,
          messages: [...next, { ...assistant, content: confirmation }],
          updatedAt: Date.now(),
        };
        saveConversation(localSavedConv);
        setCurrentConversation(localSavedConv);
        setConversations(loadAllConversations());

        consolidateConversationToInfiniteMemory({
          ...currentConversation,
          messages: [...next, { ...assistant, content: confirmation }],
        });
        setMemoryStats(getInfiniteMemoryStats());
        return;
      }

      let streamedOutput = '';
      await client.send({ messages: messagesToSend, language, agentName, maxModels: route.intent === 'chat' ? 1 : 3 }, abort.signal, partial => {
        streamedOutput = partial;
        setResponse(current => current ? reduceResponseEvent(current, { type: 'delta', text: partial.slice(current.content.length) }) : current);
        setMessages(current => current.map(m => m.id === assistant.id ? { ...m, content: partial } : m));
      });
      setResponse(current => current ? reduceResponseEvent(current, { type: 'done' }) : current);

      // 4. Deterministic Self-Verification Gate
      const verification = verifyAndCorrectResponse(streamedOutput);
      const finalized = verification.verifiedText;
      if (verification.isModified) {
        setMessages(current => current.map(m => m.id === assistant.id ? { ...m, content: finalized } : m));
        for (const corr of verification.corrections) {
          recordSelfCorrection(corr.original, corr.corrected, corr.reason);
        }
      }

      // 5. Continuous Long-Term & Infinite Memory consolidation
      recordInteractionEpisode(clean, finalized);

      const finalSavedConv: ChatConversation = {
        ...initialConv,
        messages: [...next, { ...assistant, content: finalized }],
        updatedAt: Date.now(),
      };
      saveConversation(finalSavedConv);
      setCurrentConversation(finalSavedConv);
      setConversations(loadAllConversations());

      consolidateConversationToInfiniteMemory({
        ...currentConversation,
        messages: [...next, { ...assistant, content: finalized }],
      });
      setMemoryStats(getInfiniteMemoryStats());

      // 6. Perpetual Auto-Evolution & Self-Improvement Loop
      const turnLatency = Date.now() - turnStartTime;
      recordContinuousEvolutionStep(clean, finalized, {
        latencyMs: turnLatency,
        wasSuccess: true,
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const failure = toUserFacingChatError(err);
      setResponse(current => current ? reduceResponseEvent(current, { type: 'error', code: failure.code, message: failure.message }) : current);
      setMessages(current => current.filter(m => m.id !== assistant.id));
      setErrorCode(failure.code);
      setError(failure.message);
    } finally {
      setBusy(false);
      controller.current = null;
    }
  };

  const stop = () => controller.current?.abort();

  const triggerVisionUpload = (promptPrefix?: string) => {
    window.dispatchEvent(
      new CustomEvent('adam_trigger_image_upload', {
        detail: { promptPrefix: promptPrefix || '' },
      })
    );
  };

  return (
    <section className={`chat-page flex flex-col h-full w-full overflow-hidden relative justify-between ${busy ? 'chat-page--busy' : ''}`}>
      <div className="chat-scroll flex-1 overflow-y-auto w-full px-3 sm:px-6 py-3 sm:py-4 flex flex-col min-h-0">
        {proactiveAlerts.length > 0 && (
          <div className="proactive-banner" role="status" aria-live="polite">
            <div className="proactive-banner-content">
              <Bell size={16} />
              <span>
                <strong>{proactiveAlerts[0].title}</strong>: {proactiveAlerts[0].description}
              </span>
            </div>
            <button
              className="proactive-banner-dismiss"
              onClick={() => proactiveEngine.dismissEvent(proactiveAlerts[0].id)}
              aria-label={language === 'ar' ? 'إغلاق التنبيه' : 'Dismiss notification'}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex-1 my-auto max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-10 text-center flex flex-col items-center justify-center gap-5 sm:gap-6 animate-fadeIn select-none">
            {/* Executive Identity Emblem */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="relative group">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-indigo-500/20 border border-cyan-500/30 text-[var(--accent)] flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.25)] backdrop-blur-2xl transition-transform group-hover:scale-105 duration-300">
                  <Sparkles size={28} className="text-cyan-400 drop-shadow-[0_0_12px_#22d3ee]" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[var(--bg)] flex items-center justify-center shadow-[0_0_8px_#34d399]">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                </span>
              </div>

              {/* Immutable Creator & System Attribution Badge */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[var(--muted)] font-mono">
                <span className="font-bold text-[var(--text)] tracking-wider">ADEM AI 4.0</span>
                <span aria-hidden="true">·</span>
                <span className="text-[var(--accent)] font-sans font-semibold">
                  {language === 'ar' ? 'هندسة وبرمجة أدم فيدات' : 'Engineered by Adam Feidat'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-cyan-400 font-sans flex items-center gap-1 font-medium">
                  <Globe size={11} /> {language === 'ar' ? 'متصل ببحث Google الحي' : 'Google Live Grounded'}
                </span>
              </div>
            </div>

            {/* Headline and Narrative */}
            <div className="space-y-1.5 max-w-xl">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--text)] tracking-tight leading-tight">
                {language === 'ar' ? 'ما هي المهمة التي تريد إنجازها؟' : 'What would you like to build today?'}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--muted)] max-w-lg mx-auto leading-relaxed">
                {language === 'ar'
                  ? 'منظومة تنفيذية فائقة السرعة بلمح البصر — برمجة تطبيقات كاملة، توليد وسائط 8K، وأتمتة لينكس وسيرفرات.'
                  : 'Sub-second executive AI — synthesizes full apps, 8K cinematic media, and automated system commands.'}
              </p>
            </div>

            {/* Interactive Domain Filter Tabs (Constitutional standard) */}
            <div className="flex items-center gap-1 p-1 bg-[var(--surface-2)]/90 rounded-2xl border border-[var(--border)] max-w-full overflow-x-auto scrollbar-none shadow-xs">
              {[
                { id: 'featured', labelAr: 'المميزة', labelEn: 'Featured', icon: Sparkles },
                { id: 'code', labelAr: 'برمجة وألعاب', labelEn: 'Code & Apps', icon: Code },
                { id: 'search', labelAr: 'بحث Google الحي', labelEn: 'Live Search', icon: Globe },
                { id: 'media', labelAr: 'وسائط وفيديو 8K', labelEn: 'Media & 8K', icon: Film },
                { id: 'linux', labelAr: 'لينكس والطرفية', labelEn: 'Linux & CLI', icon: Terminal },
                { id: 'identity', labelAr: 'الصانع والهوية', labelEn: 'Identity', icon: ShieldCheck },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isSelected = heroCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHeroCategory(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                      isSelected
                        ? 'bg-[var(--surface)] text-[var(--accent)] shadow-xs border border-[var(--border-strong)]'
                        : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]/60'
                    }`}
                  >
                    <TabIcon size={13} className={isSelected ? 'text-[var(--accent)]' : 'opacity-60'} />
                    <span>{language === 'ar' ? tab.labelAr : tab.labelEn}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Curated Executive Capability Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl text-start">
              {HERO_PROMPT_CARDS[heroCategory].map((card, idx) => {
                const Icon = card.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => send(language === 'ar' ? card.promptAr : card.promptEn)}
                    className="group relative p-3 sm:p-3.5 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all duration-200 flex items-start gap-3 text-start cursor-pointer shadow-xs hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] active:scale-[0.99] select-none"
                  >
                    <div className={`w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-200 ${card.iconClass}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors truncate">
                          {language === 'ar' ? card.titleAr : card.titleEn}
                        </span>
                        <span className="text-[10px] font-mono opacity-0 group-hover:opacity-100 text-[var(--accent)] transition-opacity shrink-0">
                          {language === 'ar' ? 'تشغيل ↵' : 'Run ↵'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--muted)] line-clamp-2 mt-0.5 leading-relaxed">
                        {language === 'ar' ? card.descAr : card.descEn}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 py-2 sm:py-4">
            <AnimatePresence initial={false}>
              {messages.map((message, idx) => {
                const prevUser = messages
                  .slice(0, idx)
                  .reverse()
                  .find((m) => m.role === 'user');
                const userPrompt = prevUser?.content || '';
                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    language={language}
                    userPrompt={userPrompt}
                    onOpenSandbox={onOpenSandbox}
                    onNavigateView={onNavigateView}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )}
        {error && (
          <div className="error-banner">
            <strong>
              {language === 'ar'
                ? errorCode === 'REQUEST_TIMEOUT' || errorCode === 'STREAM_TIMEOUT'
                  ? 'انتهت مهلة الاستجابة'
                  : errorCode === 'AI_NOT_CONFIGURED' || errorCode === 'SERVER_BOOT_ERROR'
                    ? 'إعداد خادم الذكاء الاصطناعي غير مكتمل'
                  : errorCode === 'AI_RATE_LIMIT' || errorCode === 'RATE_LIMITED'
                    ? 'الخدمة مشغولة حالياً'
                    : errorCode === 'AI_AUTH' || errorCode === 'UNAUTHORIZED'
                      ? 'مشكلة في اعتماد محرك الذكاء الاصطناعي'
                      : errorCode === 'BILLING_REQUIRED' || errorCode === 'PAYMENT_REQUIRED'
                        ? 'مشكلة في الحصة أو الفوترة'
                        : errorCode === 'NETWORK_ERROR'
                          ? 'تعذر الاتصال بالخدمة'
                          : errorCode === 'AI_SERVER_ERROR' || errorCode === 'AI_PROVIDER' || errorCode === 'SERVER_BOOT_ERROR'
                            ? 'خطأ في خادم Adam'
                            : 'لم تصل إجابة'
                : errorCode === 'REQUEST_TIMEOUT' || errorCode === 'STREAM_TIMEOUT'
                  ? 'Response timed out'
                  : errorCode === 'AI_NOT_CONFIGURED' || errorCode === 'SERVER_BOOT_ERROR'
                    ? 'AI server configuration is incomplete'
                  : errorCode === 'AI_RATE_LIMIT' || errorCode === 'RATE_LIMITED'
                    ? 'Service is busy'
                    : errorCode === 'AI_AUTH' || errorCode === 'UNAUTHORIZED'
                      ? 'AI authentication error'
                      : errorCode === 'BILLING_REQUIRED' || errorCode === 'PAYMENT_REQUIRED'
                        ? 'Quota or billing issue'
                        : errorCode === 'NETWORK_ERROR'
                          ? 'Connection error'
                          : errorCode === 'AI_SERVER_ERROR' || errorCode === 'AI_PROVIDER' || errorCode === 'SERVER_BOOT_ERROR'
                            ? 'Adam server error'
                            : 'No answer received'}
            </strong>
            <span>{error}</span>
            <button onClick={() => lastPrompt && send(lastPrompt)}><RotateCcw size={14} /> {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button>
          </div>
        )}
        <div ref={messagesEndRef} className="h-2 w-full flex-none pointer-events-none" />
      </div>

      {/* Pinned Bottom Input Shelf (رف الكتابة السفلي المثبت في قاع الشاشة) */}
      <footer className="w-full max-w-4xl mx-auto px-2 sm:px-6 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] sm:pb-4 pt-1 shrink-0 mt-auto z-20">
        <Composer language={language} busy={busy} onSend={send} onStop={stop} />
      </footer>

      {/* Session Control Side Drawer (مستخرج عبر الزر الجانبي) */}
      <ChatSessionDrawer
        isOpen={isSessionDrawerOpen}
        onClose={() => setIsSessionDrawerOpen(false)}
        language={language}
        currentConversation={currentConversation}
        conversationsCount={conversations.length}
        memoryCount={memoryStats.total}
        agentStatus={
          response?.route === 'web'
            ? (language === 'ar' ? 'بحث مباشر بالويب' : 'Live Web Search')
            : (language === 'ar' ? 'جاهز ومتصل' : 'Ready & Connected')
        }
        onNewChat={handleStartNewChat}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenMemory={() => {
          setMemoryStats(getInfiniteMemoryStats());
          setIsMemoryModalOpen(true);
        }}
        onClearCurrentMessages={handleClearCurrentMessages}
        onRenameConversation={handleRenameConversation}
      />

      {/* History Drawer Modal */}
      <ChatHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        conversations={conversations}
        activeId={currentConversation.id}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleStartNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onClearAll={handleClearAllHistory}
        language={language}
      />

      {/* Infinite Memory Modal */}
      <InfiniteMemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => {
          setIsMemoryModalOpen(false);
          setMemoryStats(getInfiniteMemoryStats());
        }}
        language={language}
      />

      {/* Integrated Academic & Scholarly Library Modal */}
      <ChatAcademicModal
        isOpen={isAcademicModalOpen}
        onClose={() => setIsAcademicModalOpen(false)}
        language={language}
        onSendPrompt={(prompt) => {
          send(prompt);
        }}
      />
    </section>
  );
}
