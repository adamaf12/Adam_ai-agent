import type { ViewId } from '../domain';
import { openSafeExternalUrl } from '../utils/mobileWebHandler';

export type AppTargetType = 'view' | 'sandbox' | 'external';

export interface AppTarget {
  id: string;
  type: AppTargetType;
  titleAr: string;
  titleEn: string;
  categoryAr: string;
  categoryEn: string;
  descriptionAr: string;
  descriptionEn: string;
  iconName: string;
  view?: ViewId;
  sandboxAppId?: string;
  externalUrl?: string;
  aliases: string[];
}

export const REGISTERED_APPS: AppTarget[] = [
  {
    id: 'tasks',
    type: 'view',
    view: 'tasks',
    titleAr: 'إدارة المهام والمواعيد (Tasks)',
    titleEn: 'Tasks & Schedule Manager',
    categoryAr: 'إنتاجية وتنظيم',
    categoryEn: 'Productivity & Planning',
    descriptionAr: 'تنظيم قائمة المهام اليومية، المواعيد الذكية، وتتبع الأولويات.',
    descriptionEn: 'Organize daily tasks, smart deadlines, and priority checklists.',
    iconName: 'CalendarCheck',
    aliases: [
      'مهام', 'المهام', 'قائمة المهام', 'جدول المهام', 'جدول', 'المواعيد', 'مواعيد',
      'تذكيرات', 'تذكير', 'تسكات', 'التسكات', 'أولويات',
      'tasks', 'task', 'todo', 'to-do', 'schedule', 'reminders', 'reminder', 'checklist'
    ],
  },
  {
    id: 'apps',
    type: 'view',
    view: 'apps',
    titleAr: 'مشغل الألعاب والتطبيقات (Apps & Games)',
    titleEn: 'App & Game Sandbox',
    categoryAr: 'ألعاب وبيئة تفاعلية',
    categoryEn: 'Interactive Apps & Games',
    descriptionAr: 'بيئة مستقلة لتشغيل ألعاب الويب وتطبيقات HTML5 التفاعلية مباشرة.',
    descriptionEn: 'Standalone runner to play, inspect, and execute interactive web games and mini-apps.',
    iconName: 'Gamepad2',
    aliases: [
      'العاب', 'ألعاب', 'الألعاب', 'العابي', 'ألعابي', 'لعبة', 'لعبه', 'اللعبة', 'اللعبه',
      'تطبيقات', 'التطبيقات', 'تطبيق', 'التطبيق', 'تطبيقي', 'تطبيقاتي',
      'الألعاب والتطبيقات', 'العاب وتطبيقات', 'تطبيقات والعاب', 'التطبيقات والألعاب',
      'مشغل الألعاب', 'مشغل الالعاب', 'مشغل التطبيقات', 'مشغل ألعاب',
      'استوديو الألعاب', 'استوديو الالعاب', 'استوديو التطبيقات', 'استوديو الألعاب والتطبيقات',
      'صانع الألعاب', 'صانع الالعاب', 'صانع التطبيقات', 'مطور الألعاب', 'مطور الالعاب',
      'تطوير الألعاب', 'تطوير العاب', 'برمجة الألعاب', 'برمجة العاب', 'برمجة لعبة',
      'صنع لعبة', 'صنع العاب', 'إنشاء لعبة', 'انشاء لعبة', 'بناء لعبة',
      'اصنع لعبة', 'اصنع لي لعبة', 'اصنعلي لعبة', 'طور لعبة', 'طور لي لعبة', 'طورلي لعبة',
      'برمج لعبة', 'برمج لي لعبة', 'برمجلي لعبة', 'صمم لعبة', 'صمم لي لعبة', 'صمملي لعبة',
      'اصنع تطبيق', 'اصنع لي تطبيق', 'اصنعلي تطبيق', 'طور تطبيق', 'برمج تطبيق',
      'متجر التطبيقات', 'بيئة التطبيقات', 'بيئة الألعاب', 'ساندبوكس',
      'apps', 'games', 'game', 'sandbox', 'game runner', 'arcade', 'play',
      'game studio', 'app studio', 'create game', 'make game', 'build game',
      'game maker', 'game builder', 'game dev', 'app maker', 'app builder',
      'ue5', 'unreal engine'
    ],
  },
  {
    id: 'apps_space_3d',
    type: 'sandbox',
    view: 'apps',
    sandboxAppId: 'space_shooter_3d',
    titleAr: 'حرب الفضاء ثلاثية الأبعاد (3D Space Defender)',
    titleEn: '3D Space Defender Game',
    categoryAr: 'ألعاب ثلاثية الأبعاد وأكشن',
    categoryEn: '3D & Action Game',
    descriptionAr: 'لعبة حرب فضاء 3D تفاعلية مع ليزر ونيازك ومؤثرات صوتية ونجوم متحركة.',
    descriptionEn: 'Interactive 3D space shooter with lasers, asteroids, Web Audio FX, and starfield.',
    iconName: 'Gamepad2',
    aliases: [
      'فضاء', 'الفضاء', 'حرب الفضاء', 'لعبة فضاء', 'لعبة الفضاء', 'لعبة 3d', 'سفينة فضاء', 'space', 'space game', 'space defender', '3d game', 'shooter'
    ],
  },
  {
    id: 'apps_cyber_breakout',
    type: 'sandbox',
    view: 'apps',
    sandboxAppId: 'cyber_breakout',
    titleAr: 'تكسير الكتل سايبربانك (Cyberpunk Breakout 2026)',
    titleEn: 'Cyberpunk Breakout 2026',
    categoryAr: 'ألعاب أركيد',
    categoryEn: 'Arcade Game',
    descriptionAr: 'لعبة تكسير كتل نيون مع فيزياء ارتداد ومؤثرات صوتية ومكافآت متعددة.',
    descriptionEn: 'Neon breakout arcade game with bounce physics, sound effects, and power-ups.',
    iconName: 'Gamepad2',
    aliases: [
      'بريك اوت', 'بريكأوت', 'تكسير الكتل', 'لعبة تكسير الكتل', 'مضرب وكرة', 'breakout', 'arkanoid', 'cyber breakout'
    ],
  },
  {
    id: 'apps_snake',
    type: 'sandbox',
    view: 'apps',
    sandboxAppId: 'snake_game',
    titleAr: 'لعبة الثعبان الكلاسيكية (Retro Snake)',
    titleEn: 'Retro Snake Game',
    categoryAr: 'ألعاب أركيد',
    categoryEn: 'Arcade Game',
    descriptionAr: 'لعبة الثعبان النيون الكلاسيكية مع عداد النقاط وحفظ الأرقام القياسية.',
    descriptionEn: 'Classic retro snake arcade game with score tracking and high scores.',
    iconName: 'Gamepad2',
    aliases: [
      'ثعبان', 'الثعبان', 'لعبة الثعبان', 'لعبة ثعبان', 'سنيك', 'سناك',
      'snake', 'snake game', 'play snake', 'retro snake'
    ],
  },
  {
    id: 'apps_tic_tac_toe',
    type: 'sandbox',
    view: 'apps',
    sandboxAppId: 'tic_tac_toe',
    titleAr: 'لعبة إكس أو التفاعلية (Tic-Tac-Toe AI)',
    titleEn: 'Tic-Tac-Toe AI Game',
    categoryAr: 'ألعاب ذكاء',
    categoryEn: 'Strategy Game',
    descriptionAr: 'لعبة X / O الذكية ضد خوارزمية الذكاء الاصطناعي مع تصميم أنيق.',
    descriptionEn: 'Interactive Tic-Tac-Toe vs smart AI opponent with polished UI.',
    iconName: 'Gamepad2',
    aliases: [
      'اكس او', 'إكس أو', 'لعبة اكس او', 'لعبة إكس أو', 'تيك تاك تو', 'xo',
      'tic tac toe', 'tic-tac-toe', 'x o', 'play xo'
    ],
  },
  {
    id: 'apps_calculator',
    type: 'sandbox',
    view: 'apps',
    sandboxAppId: 'calculator_app',
    titleAr: 'الآلة الحاسبة الذكية (Smart Calculator)',
    titleEn: 'Smart Calculator App',
    categoryAr: 'أدوات وحسابات',
    categoryEn: 'Calculators & Math',
    descriptionAr: 'آلة حاسبة علمية وعصرية لإجراء العمليات الحسابية والمعادلات بسرعة.',
    descriptionEn: 'Modern scientific & basic calculator for quick math operations.',
    iconName: 'Calculator',
    aliases: [
      'حاسبة', 'الحاسبة', 'آلة حاسبة', 'الة حاسبة', 'الآلة الحاسبة', 'كالكوليتر', 'احسب',
      'calculator', 'calc', 'math', 'smart calculator'
    ],
  },
  {
    id: 'apps_drawing',
    type: 'sandbox',
    view: 'apps',
    sandboxAppId: 'drawing_canvas',
    titleAr: 'استوديو الرسم والتصميم النيون (Drawing Studio)',
    titleEn: 'Neon Drawing & Sketch Studio',
    categoryAr: 'أدوات وإبداع',
    categoryEn: 'Creative & Art',
    descriptionAr: 'تطبيق رسم رقمي تفاعلي مع ألوان نيون وممحاة وتحكم بحجم الفرشاة وتصدير للصور.',
    descriptionEn: 'Interactive digital canvas with neon palette, brush size control and PNG export.',
    iconName: 'Palette',
    aliases: [
      'رسم', 'الرسم', 'استوديو الرسم', 'لوحة الرسم', 'ارسم', 'رسام', 'الرسام', 'كانفاس',
      'drawing', 'draw', 'sketch', 'canvas', 'paint', 'art'
    ],
  },
  {
    id: 'apps_converter',
    type: 'sandbox',
    view: 'apps',
    sandboxAppId: 'unit_converter',
    titleAr: 'محول العملات والوحدات الذكي (Smart Converter)',
    titleEn: 'Unit & Currency Converter',
    categoryAr: 'أدوات وحسابات',
    categoryEn: 'Calculators & Math',
    descriptionAr: 'تحويل سريع ودقيق للعملات العالمية، ووحدات الطول والوزن ومقاييس الحرارة.',
    descriptionEn: 'Fast & accurate converter for global currencies, length, weight, and temperatures.',
    iconName: 'Calculator',
    aliases: [
      'محول', 'المحول', 'تحويل عملات', 'تحويل العملات', 'محول وحدات', 'محول الوحدات', 'تحويل',
      'converter', 'unit converter', 'currency converter', 'convert'
    ],
  },
  {
    id: 'workspace',
    type: 'view',
    view: 'workspace',
    titleAr: 'مساحة العمل والمستندات (Workspace)',
    titleEn: 'Workspace & Studio',
    categoryAr: 'إنتاجية ومستندات',
    categoryEn: 'Productivity & Documents',
    descriptionAr: 'بيئة العمل المتقدمة لكتابة النصوص، تنظيم الملفات، وإدارة المشاريع.',
    descriptionEn: 'Advanced workspace for notes, document drafting, and creative projects.',
    iconName: 'Sparkles',
    aliases: [
      'مساحة العمل', 'مساحة عمل', 'ورك سبيس', 'مستندات', 'المستندات', 'ملفات', 'الملفات',
      'ملاحظات', 'الملاحظات', 'محرر', 'المحرر', 'دفتر',
      'workspace', 'work space', 'documents', 'notes', 'docs', 'editor', 'studio'
    ],
  },
  {
    id: 'media',
    type: 'view',
    view: 'media',
    titleAr: 'استوديو الصور والفيديو والوسائط (Media Studio)',
    titleEn: 'Media & Creative Studio',
    categoryAr: 'وسائط وتوليد صور',
    categoryEn: 'AI Media & Video',
    descriptionAr: 'توليد الصور السينمائية، تعديل الوسائط، ومعاينة الأعمال المرئية.',
    descriptionEn: 'Cinematic AI image creation, video processing, and creative asset gallery.',
    iconName: 'Image',
    aliases: [
      'استوديو الصور', 'استوديو الفيديو', 'استوديو الوسائط', 'صور', 'الصور', 'فيديو', 'الفيديو',
      'وسائط', 'الوسائط', 'معرض', 'معرض الصور', 'توليد صور', 'توليد الصور',
      'media', 'media studio', 'images', 'image studio', 'gallery', 'video studio', 'creative studio'
    ],
  },

  {
    id: 'hermes',
    type: 'view',
    view: 'hermes',
    titleAr: 'محرك هيرمس الذكي (Hermes Engine)',
    titleEn: 'Hermes Engine & Tools',
    categoryAr: 'أدوات بحث وتنقيب',
    categoryEn: 'Autonomous Agents & Web',
    descriptionAr: 'محرك الوكلاء المستقلين وأدوات البحث العميق واستخراج البيانات.',
    descriptionEn: 'Autonomous research engine, web scraping, and multi-agent synthesis.',
    iconName: 'Bot',
    aliases: [
      'هيرمس', 'محرك هيرمس', 'محرك hermes', 'وكيل هيرمس',
      'hermes', 'hermes engine', 'agent tools', 'deep research'
    ],
  },
  {
    id: 'memory',
    type: 'view',
    view: 'memory',
    titleAr: 'سجل الذاكرة المعرفية (Cognitive Memory)',
    titleEn: 'Cognitive Memory Vault',
    categoryAr: 'ذاكرة وإدراك',
    categoryEn: 'Long-term Memory',
    descriptionAr: 'استعراض الذكريات المعرفية الدائمة، التفضيلات المحفوظة، والقواعد المكتسبة.',
    descriptionEn: 'View persistent cross-session memories, learned rules, and knowledge graph.',
    iconName: 'Brain',
    aliases: [
      'ذاكرة', 'الذاكرة', 'سجل الذاكرة', 'ذكريات', 'الذكريات', 'المعلومات المحفوظة',
      'memory', 'memories', 'memory vault', 'second brain'
    ],
  },
  {
    id: 'security',
    type: 'view',
    view: 'security',
    titleAr: 'مختبر الحماية والأمان (Security & WAF)',
    titleEn: 'Security & WAF Shield Lab',
    categoryAr: 'أمان ومراقبة',
    categoryEn: 'Cybersecurity & Monitoring',
    descriptionAr: 'لوحة التحكم بجدار الحماية، فحص الثغرات، ومراقبة تدفق البيانات.',
    descriptionEn: 'Firewall rules, vulnerability scanner, audit logs, and security shield.',
    iconName: 'ShieldCheck',
    aliases: [
      'حماية', 'الحماية', 'أمان', 'الامان', 'الأمان', 'مختبر الحماية', 'جدار الحماية', 'فحص الثغرات',
      'واف', 'حماية النظام',
      'security', 'waf', 'security lab', 'firewall', 'shield', 'cybersecurity'
    ],
  },
  {
    id: 'settings',
    type: 'view',
    view: 'settings',
    titleAr: 'إعدادات النظام والتفضيلات (Settings)',
    titleEn: 'System Preferences & Settings',
    categoryAr: 'إعدادات وتخصيص',
    categoryEn: 'Configuration & Themes',
    descriptionAr: 'تغيير اللغة، الثيم والمظهر، مفاتيح API، وخيارات النظام.',
    descriptionEn: 'Configure language, themes, API credentials, and agent personalization.',
    iconName: 'Settings',
    aliases: [
      'إعدادات', 'اعدادات', 'الإعدادات', 'الاعدادات', 'تفضيلات', 'التفضيلات', 'مظهر', 'الثيم',
      'المظهر', 'الخيارات', 'خيارات',
      'settings', 'preferences', 'theme', 'config', 'configuration'
    ],
  },

  // Popular External Applications & Web Platforms
  {
    id: 'ext_youtube',
    type: 'external',
    titleAr: 'منصة يوتيوب (YouTube)',
    titleEn: 'YouTube Web',
    categoryAr: 'فيديو ومحتوى',
    categoryEn: 'Video & Streaming',
    descriptionAr: 'مشاهدة مقاطع الفيديو، الشورتس، والمحتوى التعليمي والترفيهي.',
    descriptionEn: 'Watch videos, live streams, shorts, and music on YouTube.',
    iconName: 'Youtube',
    externalUrl: 'https://www.youtube.com',
    aliases: ['يوتيوب', 'اليوتيوب', 'شورتس', 'فيديوهات يوتيوب', 'youtube', 'yt', 'youtube.com'],
  },
  {
    id: 'ext_google',
    type: 'external',
    titleAr: 'محرك بحث قوقل (Google Search)',
    titleEn: 'Google Search',
    categoryAr: 'محرك بحث',
    categoryEn: 'Search Engine',
    descriptionAr: 'البحث العالمي عن المعلومات والمواقع والملفات عبر قوقل.',
    descriptionEn: 'Global web search engine for instant answers and web discoveries.',
    iconName: 'Search',
    externalUrl: 'https://www.google.com',
    aliases: ['جوجل', 'قوقل', 'بحث قوقل', 'بحث جوجل', 'محرك بحث', 'google', 'google search'],
  },
  {
    id: 'ext_wikipedia',
    type: 'external',
    titleAr: 'موسوعة ويكيبيديا (Wikipedia)',
    titleEn: 'Wikipedia',
    categoryAr: 'موسوعة ومعرفة',
    categoryEn: 'Encyclopedia & Reference',
    descriptionAr: 'الموسوعة الحرة العالمية للبحث عن المقالات التاريخية والعلمية والثقافية.',
    descriptionEn: 'Free open encyclopedia with millions of factual articles.',
    iconName: 'Globe',
    externalUrl: 'https://ar.wikipedia.org',
    aliases: ['ويكيبيديا', 'الموسوعة', 'الموسوعة الحرة', 'موسوعة', 'wikipedia', 'wiki'],
  },
  {
    id: 'ext_github',
    type: 'external',
    titleAr: 'منصة جيت هب للمطورين (GitHub)',
    titleEn: 'GitHub Developers Platform',
    categoryAr: 'تطوير وبرمجة',
    categoryEn: 'Developer Tools & Code',
    descriptionAr: 'استعراض المستودعات البرمجية، المشاريع مفتوحة المصدر، والأكواد.',
    descriptionEn: 'Source code hosting, developer collaboration, and Git repositories.',
    iconName: 'Code',
    externalUrl: 'https://github.com',
    aliases: ['جيت هب', 'جيثب', 'جتهاب', 'مستودعات', 'github', 'gh'],
  },
  {
    id: 'ext_twitter',
    type: 'external',
    titleAr: 'منصة إكس / تويتر (X / Twitter)',
    titleEn: 'X (formerly Twitter)',
    categoryAr: 'شبكات اجتماعية',
    categoryEn: 'Social Network & News',
    descriptionAr: 'متابعة الأخبار العاجلة، التغريدات، والنقاشات العالمية.',
    descriptionEn: 'Real-time social discussions, live news, and trending topics.',
    iconName: 'Share2',
    externalUrl: 'https://x.com',
    aliases: ['تويتر', 'إكس', 'اكس', 'منصة إكس', 'تغريدات', 'twitter', 'x', 'x.com'],
  },
  {
    id: 'ext_whatsapp',
    type: 'external',
    titleAr: 'واتساب ويب (WhatsApp Web)',
    titleEn: 'WhatsApp Web',
    categoryAr: 'محادثات وتواصل',
    categoryEn: 'Instant Messaging',
    descriptionAr: 'إرسال الرسائل والمحادثات مع جهات الاتصال عبر واتساب ويب.',
    descriptionEn: 'Chat and communicate with contacts on WhatsApp Web.',
    iconName: 'MessageSquare',
    externalUrl: 'https://web.whatsapp.com',
    aliases: ['واتساب', 'واتس', 'واتس اب', 'واتساب ويب', 'whatsapp', 'wa'],
  },
  {
    id: 'ext_telegram',
    type: 'external',
    titleAr: 'تيليجرام ويب (Telegram Web)',
    titleEn: 'Telegram Web',
    categoryAr: 'محادثات وتواصل',
    categoryEn: 'Instant Messaging',
    descriptionAr: 'الوصول إلى قنوات ومحادثات ومجموعات تيليجرام.',
    descriptionEn: 'Access Telegram chats, channels, and groups directly.',
    iconName: 'Send',
    externalUrl: 'https://web.telegram.org',
    aliases: ['تيليجرام', 'تلغرام', 'تليجرام', 'telegram', 'tg'],
  },
  {
    id: 'ext_spotify',
    type: 'external',
    titleAr: 'سبوتيفاي للموسيقى (Spotify)',
    titleEn: 'Spotify Web Player',
    categoryAr: 'صوتيات وموسيقى',
    categoryEn: 'Music & Podcasts',
    descriptionAr: 'الاستماع إلى الموسيقى والبودكاست وقوائم التشغيل العالمية.',
    descriptionEn: 'Stream millions of tracks, albums, and podcasts.',
    iconName: 'Music',
    externalUrl: 'https://open.spotify.com',
    aliases: ['سبوتيفاي', 'موسيقى', 'أغاني', 'اغاني', 'بودكاست', 'spotify'],
  },
  {
    id: 'ext_translate',
    type: 'external',
    titleAr: 'ترجمة قوقل (Google Translate)',
    titleEn: 'Google Translate',
    categoryAr: 'ترجمة ولغات',
    categoryEn: 'Language & Translation',
    descriptionAr: 'الترجمة الفورية للنصوص والمستندات بين مئات اللغات العالمية.',
    descriptionEn: 'Instant translation between hundreds of global languages.',
    iconName: 'Languages',
    externalUrl: 'https://translate.google.com',
    aliases: ['ترجمة قوقل', 'مترجم قوقل', 'ترجمة جوجل', 'ترجمة', 'مترجم', 'google translate', 'translate'],
  },
];

/**
 * Normalizes input text for matching
 */
function cleanQuery(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s.:/-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Matches an app from user text
 */
export function matchAppTarget(rawText: string): AppTarget | null {
  const text = cleanQuery(rawText);
  if (!text) return null;

  // 1. Check for direct URL
  const urlMatch = rawText.match(/(https?:\/\/[^\s]+)/i);
  if (urlMatch) {
    const url = urlMatch[1];
    let domain = 'Website';
    try {
      domain = new URL(url).hostname.replace(/^www\./, '');
    } catch {}
    return {
      id: `custom_${Date.now()}`,
      type: 'external',
      titleAr: `موقع ${domain}`,
      titleEn: `${domain} Web App`,
      categoryAr: 'رابط خارجي',
      categoryEn: 'External Web Link',
      descriptionAr: `فتح الرابط الخارجي: ${url}`,
      descriptionEn: `Opening external URL: ${url}`,
      iconName: 'Globe',
      externalUrl: url,
      aliases: [],
    };
  }

  // 2. Specialized search actions with query extraction (YouTube, Google, Maps)
  const ytSearchMatch = rawText.match(/(?:افتح\s+يوتيوب\s+وابحث\s+عن|ابحث\s+في\s+يوتيوب\s+عن|شغل\s+في\s+يوتيوب|بحث\s+يوتيوب\s+عن|search\s+youtube\s+for|youtube\s+search)\s+(.+)/i);
  if (ytSearchMatch && ytSearchMatch[1]) {
    const term = ytSearchMatch[1].trim();
    const encoded = encodeURIComponent(term);
    return {
      id: `youtube_search_${Date.now()}`,
      type: 'external',
      titleAr: `بحث يوتيوب: "${term}"`,
      titleEn: `YouTube Search: "${term}"`,
      categoryAr: 'فيديو وبحث مرئي',
      categoryEn: 'Video & Streaming',
      descriptionAr: `البحث في YouTube عن: ${term}`,
      descriptionEn: `Searching YouTube for: ${term}`,
      iconName: 'Youtube',
      externalUrl: `https://www.youtube.com/results?search_query=${encoded}`,
      aliases: [],
    };
  }

  const googleSearchMatch = rawText.match(/(?:ابحث\s+في\s+قوقل\s+عن|ابحث\s+في\s+جوجل\s+عن|بحث\s+قوقل\s+عن|search\s+google\s+for|google\s+search)\s+(.+)/i);
  if (googleSearchMatch && googleSearchMatch[1]) {
    const term = googleSearchMatch[1].trim();
    const encoded = encodeURIComponent(term);
    return {
      id: `google_search_${Date.now()}`,
      type: 'external',
      titleAr: `بحث قوقل: "${term}"`,
      titleEn: `Google Search: "${term}"`,
      categoryAr: 'محرك بحث ويب',
      categoryEn: 'Search Engine',
      descriptionAr: `البحث في قوقل عن: ${term}`,
      descriptionEn: `Searching Google for: ${term}`,
      iconName: 'Search',
      externalUrl: `https://www.google.com/search?q=${encoded}`,
      aliases: [],
    };
  }

  const mapsSearchMatch = rawText.match(/(?:افتح\s+(?:الخريطة|الخرائط|خرائط\s+قوقل)\s+وابحث\s+عن|ابحث\s+في\s+(?:الخريطة|الخرائط|خرائط\s+قوقل)\s+عن|موقع\s+مدينة|اين\s+يقع|أين\s+يقع|اين\s+تقع|أين\s+تقع)\s+(.+)/i);
  if (mapsSearchMatch && mapsSearchMatch[1]) {
    const place = mapsSearchMatch[1].trim();
    return {
      id: 'maps-search',
      type: 'external',
      externalUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`,
      titleAr: `خرائط Google: "${place}"`,
      titleEn: `Google Maps: "${place}"`,
      categoryAr: 'خرائط خارجية',
      categoryEn: 'External Maps',
      descriptionAr: `البحث عن "${place}" في خرائط Google الرسمية`,
      descriptionEn: `Search for "${place}" on Google Maps`,
      iconName: 'ExternalLink',
      aliases: [],
    };
  }

  // 3. Extract the target phrase after command verbs
  // Arabic trigger verbs: افتح، ادخل، شغل، وديني، روح، انتقل، توجه، العب، اصنع، انشئ، طور، برمج، صمم، ابني
  const arCommandRegex = /^(?:أرجو أن |ممكن |لو سمحت |ياريت )?(?:افتح(?:لي| لي)?|ادخل(?:لي| لي)?(?: على| إلى| الى)?|شغل(?:لي| لي)?|وديني(?: لـ| ل| إلى| الى)?|روح(?: لـ| ل| إلى| الى)?|انتقل(?: إلى| الى)?|توجه(?: إلى| الى)?|العب(?: لعبة)?|أريد فتح|اريد فتح|افتح لي تطبيق|افتح تطبيق|ادخل على تطبيق|شغل تطبيق|اصنع(?:لي| لي)?|أنشئ(?:لي| لي)?|انشئ(?:لي| لي)?|اعمل(?:لي| لي)?|طور(?:لي| لي)?|برمج(?:لي| لي)?|صمم(?:لي| لي)?|ابني(?:لي| لي)?|بدي|عايز|اريد|أريد)\s+(?:تطبيق |مشغل |استوديو |لعبة |موقع )?(.*)$/i;
  
  // English trigger verbs: open, launch, go to, switch to, navigate to, run, start, play, create, make, build, develop, program, design
  const enCommandRegex = /^(?:please\s+)?(?:open|launch|go to|switch to|navigate to|run|start|play|create|make|build|develop|program|design)\s+(?:me\s+)?(?:a\s+|an\s+|the\s+)?(?:app\s+|application\s+|game\s+|website\s+|studio\s+)?(.*)$/i;

  let query = text;
  const arMatch = rawText.match(arCommandRegex);
  if (arMatch && arMatch[1] !== undefined) {
    const extracted = cleanQuery(arMatch[1]);
    // If the user said "اصنعلي لعبة" and extracted is empty or just "لعبة", fall back to "لعبة"
    query = extracted || (/(?:لعبة|العاب|ألعاب|game)/i.test(rawText) ? 'لعبة' : 'تطبيق');
  } else {
    const enMatch = rawText.match(enCommandRegex);
    if (enMatch && enMatch[1] !== undefined) {
      const extracted = cleanQuery(enMatch[1]);
      query = extracted || (/(?:game|games|play)/i.test(rawText) ? 'game' : 'app');
    }
  }

  // 3. Exact alias match
  for (const app of REGISTERED_APPS) {
    if (app.aliases.some((alias) => alias === query || query === cleanQuery(app.titleAr) || query === cleanQuery(app.titleEn))) {
      return app;
    }
  }

  // 4. Substring / Includes match
  for (const app of REGISTERED_APPS) {
    if (app.aliases.some((alias) => query.includes(alias) || alias.includes(query))) {
      return app;
    }
  }

  // 5. Fallback: Check if user mentions a known domain (e.g. "facebook.com", "linkedin.com", "netflix.com")
  const domainMatch = query.match(/([a-z0-9-]+\.(?:com|org|net|io|co|ai|app|dev))/i);
  if (domainMatch) {
    const fullUrl = `https://${domainMatch[1]}`;
    return {
      id: `domain_${Date.now()}`,
      type: 'external',
      titleAr: `موقع ${domainMatch[1]}`,
      titleEn: `${domainMatch[1]} Web App`,
      categoryAr: 'موقع ويب خارجي',
      categoryEn: 'External Web App',
      descriptionAr: `فتح الموقع الخارجي: ${fullUrl}`,
      descriptionEn: `Opening external web address: ${fullUrl}`,
      iconName: 'Globe',
      externalUrl: fullUrl,
      aliases: [],
    };
  }

  return null;
}

/**
 * Executes or triggers the opening of the target app
 */
export function openAppTarget(
  target: AppTarget,
  callbacks?: {
    onNavigateView?: (view: ViewId, extraParam?: string) => void;
    onOpenSandbox?: (appId: string) => void;
    onOpenExternal?: (url: string) => void;
  }
) {
  if (target.type === 'external' && target.externalUrl) {
    if (callbacks?.onOpenExternal) {
      callbacks.onOpenExternal(target.externalUrl);
    } else {
      openSafeExternalUrl(target.externalUrl, { title: target.titleAr || target.titleEn });
    }
    return;
  }

  if (target.sandboxAppId && callbacks?.onOpenSandbox) {
    callbacks.onOpenSandbox(target.sandboxAppId);
    return;
  }

  if (target.view) {
    if (callbacks?.onNavigateView) {
      callbacks.onNavigateView(target.view, target.sandboxAppId);
    } else {
      window.dispatchEvent(
        new CustomEvent('adam_open_app', {
          detail: {
            view: target.view,
            sandboxAppId: target.sandboxAppId,
            url: target.externalUrl,
          },
        })
      );
    }
  }
}

/**
 * Creates formatted Markdown tag for the launcher card
 */
export function createAppLauncherPayload(target: AppTarget, language: 'ar' | 'en' = 'ar'): string {
  const isAr = language === 'ar';
  const payload = {
    id: target.id,
    type: target.type,
    title: isAr ? target.titleAr : target.titleEn,
    category: isAr ? target.categoryAr : target.categoryEn,
    description: isAr ? target.descriptionAr : target.descriptionEn,
    iconName: target.iconName,
    view: target.view,
    sandboxAppId: target.sandboxAppId,
    externalUrl: target.externalUrl,
    autoLaunch: false,
    countdownSeconds: 2,
  };

  return `:::app-launcher\n${JSON.stringify(payload, null, 2)}\n:::`;
}
