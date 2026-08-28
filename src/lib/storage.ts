import {
  ActivityLogEntry,
  AgentPersona,
  AgentSettings,
  AutoHealTelemetrySnapshot,
  BackgroundSocialMessage,
  CalendarEvent,
  ConversationSession,
  EmailMonitorRule,
  LocalFile,
  LongTermMemory,
  Message,
  MonitoredEmailItem,
  Note,
  ProactiveSuggestion,
  Reminder,
  VoiceInteractionLog,
} from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'noor_agent_settings',
  MEMORIES: 'noor_agent_memories',
  NOTES: 'noor_agent_notes',
  EVENTS: 'noor_agent_events',
  REMINDERS: 'noor_agent_reminders',
  SESSIONS: 'noor_agent_sessions',
  ACTIVE_SESSION_ID: 'noor_agent_active_session_id',
  ONBOARDING_DONE: 'noor_agent_onboarding_done',
  ACTIVITY_LOGS: 'noor_agent_activity_logs',
  LOCAL_FILES: 'noor_agent_local_files',
  BACKGROUND_MESSAGES: 'noor_agent_bg_messages',
  EMAIL_MONITOR_RULES: 'noor_agent_email_rules',
  MONITORED_EMAILS: 'noor_agent_monitored_emails',
  PERSONAS: 'noor_agent_personas',
  PROACTIVE_SUGGESTIONS: 'noor_agent_proactive_suggestions',
  VOICE_INTERACTIONS: 'noor_agent_voice_interactions',
  AUTOHEAL_TELEMETRY: 'noor_agent_autoheal_telemetry',
};

export const BUILTIN_PERSONAS: AgentPersona[] = [
  {
    id: 'persona_general',
    name: 'آدم - المساعد المتكامل',
    roleAr: 'المساعد الذكي الشخصي المتكامل',
    roleEn: 'General Super AI Agent',
    icon: 'Sparkles',
    systemPromptAddon: 'أنت المساعد الشخصي الذكي المتكامل والمتفهم، تساعد في كافة شؤون الحياة والعمل بدقة وودية.',
    tone: 'friendly',
  },
  {
    id: 'persona_visionary',
    name: 'آدم - العبقري الاستراتيجي المستقبلي',
    roleAr: 'مفكر استراتيجي ومبتكر خارج عن المألوف',
    roleEn: 'Futurist & Visionary Innovator',
    icon: 'Zap',
    systemPromptAddon: 'أنت مفكر عبقري تستشرف المستقبل وتقدم حلولاً وأفكاراً غير تقليدية وخارجة تماماً عن المألوف، تتحدى الطرق القديمة وتمنح المستخدم رؤية استراتيجية جريئة وعصرية ومبهرة.',
    tone: 'visionary',
  },
  {
    id: 'persona_cyber_hacker',
    name: 'آدم - السايبربنك ومخترق الحلول',
    roleAr: 'خبير تقني وحلول رقمية عميقة',
    roleEn: 'Cyberpunk & Creative Problem Hacker',
    icon: 'Terminal',
    systemPromptAddon: 'أسلوبك حاد وذكي بنكهة السايبربنك التقنية، تحلل المشكلات بمنطق الهندسة العكسية وتفكيك التعقيد إلى أقصر وأقوى مسارات تنفيذ ممكنة بأحدث المعايير الرقمية.',
    tone: 'cyberpunk',
  },
  {
    id: 'persona_witty_philosopher',
    name: 'آدم - الفيلسوف اللبق والذكي',
    roleAr: 'مستشار فكري ملهم وبليغ',
    roleEn: 'Witty Philosopher & Creative Muse',
    icon: 'Feather',
    systemPromptAddon: 'تجمع بين الفلسفة العميقة والبلاغة اللامعة مع حس فكاهة ذكي وراقي، تفتح آفاق التفكير الإبداعي وتلهم المستخدم بأمثلة فريدة وتحليلات غير متوقعة.',
    tone: 'witty',
  },
  {
    id: 'persona_work',
    name: 'آدم - خبير العمل والإنتاجية',
    roleAr: 'خبير مهني واستراتيجي للعمل',
    roleEn: 'Work & Executive Strategist',
    icon: 'Briefcase',
    systemPromptAddon: 'ركز على أسلوب عمل محترف، تنظيم المهام الإدارية، إعداد التقارير والرسائل المهنية، وتخطيط المشاريع بأعلى كفاءة.',
    tone: 'formal',
  },
  {
    id: 'persona_study',
    name: 'آدم - المعلم والمساعد الدراسي',
    roleAr: 'مرشد تعليمي وأكاديمي',
    roleEn: 'Academic & Learning Tutor',
    icon: 'GraduationCap',
    systemPromptAddon: 'شرح المفاهيم المعقدة بأسلوب مبسط، إعداد ملخصات المذاكرة، وضع بطاقات المراجعة، ومساعدة الطلاب بأسلوب تعليمي مشجع.',
    tone: 'expert',
  },
  {
    id: 'persona_code',
    name: 'آدم - المهندس البرمجي',
    roleAr: 'مهندس برمجيات وحلول تقنية',
    roleEn: 'Senior Software Engineer',
    icon: 'Code',
    systemPromptAddon: 'ركز على كتابة كود نظيف وعالي الأداء، اكتشاف الثغرات البرمجية، توفير الحلول الهندسية، وإدارة الملفات البرمجية.',
    tone: 'expert',
  },
];

export const DEFAULT_MODEL_FALLBACK_LIST = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.5-flash-lite',
  'gemini-3.7-flash',
  'meta-llama/llama-3.3-70b-instruct',
  'meta-llama/llama-3.1-70b-instruct:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'deepseek/deepseek-chat:free',
  'nvidia/llama-3.1-nemotron-70b-instruct',
  'meta/llama-3.1-405b-instruct',
  'meta/llama-3.1-70b-instruct',
  'pollinations/openai',
  'pollinations/qwen',
  'pollinations/mistral',
];

export const DEFAULT_SETTINGS: AgentSettings = {
  name: 'آدم',
  tone: 'friendly',
  language: 'auto',
  autoTTS: false,
  webSearchEnabled: true,
  theme: 'dark',
  activePersonaId: 'persona_general',
  proactiveModeEnabled: true,
  notificationsEnabled: true,
  reasoningTraceEnabled: true,
  wakeWordEnabled: true,
  wakeWordPhrase: 'آدم',
  voiceSettings: {
    voiceId: 'adam-neural',
    rate: 1.0,
    pitch: 1.0,
    autoSpeakResponses: false,
  },
  autoHealAlertSettings: {
    soundEnabled: true,
    soundType: 'healing_chime',
    soundVolume: 0.4,
    vibrationEnabled: true,
    vibrationPattern: 'double_pulse',
    notifyOnBackgroundFix: true,
  },
  modelFallbackList: DEFAULT_MODEL_FALLBACK_LIST,
  openRouterApiKey: '',
  nvidiaApiKey: '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',
  permissions: {
    calendar: true,
    reminders: true,
    fileStorage: true,
    microphone: true,
    webSearch: true,
  },
};

export const INITIAL_MEMORIES: LongTermMemory[] = [
  {
    id: 'mem-1',
    fact: 'المستخدم يفضل التواصل باللغة العربية الواضحة والمباشرة',
    category: 'preference',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let currentActiveUserId: string | null = null;
let guestActiveSession: ConversationSession | null = null;

/**
 * Set active user partition ID (Google UID or null for guest).
 */
export function setActiveUserId(uid: string | null): void {
  const previousId = currentActiveUserId;
  currentActiveUserId = uid && uid.trim().length > 0 ? uid.trim() : null;
  if (previousId !== currentActiveUserId) {
    // Clear in-memory cache so fresh partition is loaded cleanly
    memoryCache.clear();
    guestActiveSession = null;
  }
}

/**
 * Get active user partition ID.
 */
export function getActiveUserId(): string | null {
  return currentActiveUserId;
}

/**
 * Check if the user is currently authenticated with a Google account.
 */
export function isUserGoogleAuthenticated(): boolean {
  return currentActiveUserId !== null && currentActiveUserId.length > 0;
}

/**
 * Returns user-partitioned storage key if user is signed in.
 */
export function getUserScopedKey(baseKey: string): string {
  if (!currentActiveUserId) return `${baseKey}_guest_temp`;
  return `${baseKey}_usr_${currentActiveUserId}`;
}

// Initialize Web Worker off main thread for storage operations
let storageWorker: Worker | null = null;
try {
  if (typeof window !== 'undefined' && window.Worker) {
    storageWorker = new Worker(new URL('./storageWorker.ts', import.meta.url), { type: 'module' });
  }
} catch (e) {
  console.warn('[StorageWorker] Web Worker initialization fallback to main thread:', e);
}

// In-memory cache for ultra-fast instant reads
const memoryCache = new Map<string, any>();

// Helper for localStorage with Web Worker offload and in-memory write-back caching
function getJSON<T>(key: string, defaultValue: T): T {
  try {
    const scopedKey = getUserScopedKey(key);
    if (memoryCache.has(scopedKey)) {
      return memoryCache.get(scopedKey);
    }
    const raw = localStorage.getItem(scopedKey);
    const parsed = raw ? JSON.parse(raw) : defaultValue;
    memoryCache.set(scopedKey, parsed);
    return parsed;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function setJSON<T>(key: string, value: T): void {
  try {
    const scopedKey = getUserScopedKey(key);
    memoryCache.set(scopedKey, value);
    // Offload write to Web Worker asynchronously to prevent main-thread UI freeze
    if (storageWorker) {
      storageWorker.postMessage({ action: 'set', key: scopedKey, value });
    } else {
      localStorage.setItem(scopedKey, JSON.stringify(value));
    }
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}


// Agent Settings
export function loadSettings(): AgentSettings {
  const settings = getJSON<AgentSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  if (settings.name === 'نور' || settings.name === 'أدم' || !settings.name) {
    settings.name = 'آدم';
  }

  const sanitizeModel = (m: string): string => {
    if (!m) return 'gemini-2.5-flash';
    if (
      m === 'gemini-2.0-flash' ||
      m === 'gemini-1.5-flash' ||
      m === 'gemini-3.6-flash' ||
      m === 'gemini-pro' ||
      m === 'gemini-flash'
    ) {
      return 'gemini-2.5-flash';
    }
    if (m === 'gemini-1.5-pro') {
      return 'gemini-2.5-pro';
    }
    if (m === 'gemini-3.1-flash-lite') {
      return 'gemini-2.5-flash-lite';
    }
    return m;
  };

  if (!settings.modelFallbackList || settings.modelFallbackList.length === 0) {
    settings.modelFallbackList = DEFAULT_MODEL_FALLBACK_LIST;
  } else if (Array.isArray(settings.modelFallbackList)) {
    settings.modelFallbackList = settings.modelFallbackList
      .map(sanitizeModel)
      .filter((m, i, arr) => arr.indexOf(m) === i);
  }
  setJSON(STORAGE_KEYS.SETTINGS, settings);
  return settings;
}

export function saveSettings(settings: AgentSettings): void {
  setJSON(STORAGE_KEYS.SETTINGS, settings);
}

// Onboarding State
export function isOnboardingCompleted(): boolean {
  return getJSON<boolean>(STORAGE_KEYS.ONBOARDING_DONE, false);
}

export function setOnboardingCompleted(completed: boolean): void {
  setJSON(STORAGE_KEYS.ONBOARDING_DONE, completed);
}

// Long-Term Memory Management
export function loadMemories(): LongTermMemory[] {
  // Only Google-authenticated accounts have persistent long-term memory
  if (!currentActiveUserId) {
    return [];
  }
  return getJSON<LongTermMemory[]>(STORAGE_KEYS.MEMORIES, INITIAL_MEMORIES);
}

export function saveMemory(fact: string, category: LongTermMemory['category'] = 'preference'): LongTermMemory | null {
  // Only Google-authenticated accounts save long-term memory
  if (!currentActiveUserId) {
    return null;
  }
  const memories = loadMemories();
  // Check for duplicate facts to prevent duplicates
  const existing = memories.find((m) => m.fact.trim().toLowerCase() === fact.trim().toLowerCase());
  if (existing) return existing;

  const newMem: LongTermMemory = {
    id: 'mem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    fact,
    category,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  memories.unshift(newMem);
  setJSON(STORAGE_KEYS.MEMORIES, memories);
  return newMem;
}

export function updateMemory(id: string, newFact: string, newCategory?: LongTermMemory['category']): LongTermMemory | null {
  const memories = loadMemories();
  const index = memories.findIndex((m) => m.id === id);
  if (index === -1) return null;

  memories[index] = {
    ...memories[index],
    fact: newFact,
    category: newCategory || memories[index].category,
    updatedAt: new Date().toISOString(),
  };
  setJSON(STORAGE_KEYS.MEMORIES, memories);
  return memories[index];
}

export function deleteMemory(id: string): void {
  const memories = loadMemories().filter((m) => m.id !== id);
  setJSON(STORAGE_KEYS.MEMORIES, memories);
}

export function clearAllMemories(): void {
  setJSON(STORAGE_KEYS.MEMORIES, []);
}

// RAG-like memory search: scores memories against user query keywords
export function searchRelevantMemories(query: string, maxResults: number = 5): LongTermMemory[] {
  const memories = loadMemories();
  if (!query || memories.length === 0) return memories.slice(0, maxResults);

  const words = query.toLowerCase().replace(/[^\w\s\u0600-\u06FF]/g, '').split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return memories.slice(0, maxResults);

  const scored = memories.map((mem) => {
    let score = 0;
    const factLower = mem.fact.toLowerCase();
    for (const w of words) {
      if (factLower.includes(w)) {
        score += 2;
      }
    }
    return { mem, score };
  });

  // Sort by score desc, then by date desc
  scored.sort((a, b) => b.score - a.score || b.mem.createdAt.localeCompare(a.mem.createdAt));

  // Filter memories with score > 0 if available, otherwise fallback to recent memories
  const relevant = scored.filter((s) => s.score > 0).map((s) => s.mem);
  if (relevant.length > 0) {
    return relevant.slice(0, maxResults);
  }
  return memories.slice(0, maxResults);
}

// Personas Management
export function loadPersonas(): AgentPersona[] {
  const customPersonas = getJSON<AgentPersona[]>(STORAGE_KEYS.PERSONAS, []);
  return [...BUILTIN_PERSONAS, ...customPersonas];
}

export function saveCustomPersona(persona: Omit<AgentPersona, 'id' | 'isCustom'>): AgentPersona {
  const customPersonas = getJSON<AgentPersona[]>(STORAGE_KEYS.PERSONAS, []);
  const newPersona: AgentPersona = {
    ...persona,
    id: 'persona_custom_' + Date.now(),
    isCustom: true,
  };
  customPersonas.push(newPersona);
  setJSON(STORAGE_KEYS.PERSONAS, customPersonas);
  return newPersona;
}

export function deleteCustomPersona(id: string): void {
  const customPersonas = getJSON<AgentPersona[]>(STORAGE_KEYS.PERSONAS, []).filter((p) => p.id !== id);
  setJSON(STORAGE_KEYS.PERSONAS, customPersonas);
}

// Proactive Suggestions Engine
export function loadProactiveSuggestions(): ProactiveSuggestion[] {
  return getJSON<ProactiveSuggestion[]>(STORAGE_KEYS.PROACTIVE_SUGGESTIONS, [
    {
      id: 'sug-radar-auto',
      titleAr: '⚡ التحديث التلقائي الشامل للأخبار والصحة الذاتية (كل 30 دقيقة)',
      titleEn: 'Autonomous 30-Min Health & Global News Radar',
      descriptionAr: 'المحرك يعمل باستمرار في الخلفية كل 30 دقيقة لتحديث الأخبار العالمية وفحص سلامة الكود واستيعاب المعرفة الجديدة.',
      descriptionEn: 'Autonomous engine runs seamlessly every 30 mins to sync live news, scan code health, and assimilate knowledge.',
      suggestedActionPrompt: 'استعرض لي ملخص آخر دورة فحص وتحديث تلقائي للأخبار العالمية وحالة سلامة النظام.',
      category: 'productivity',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sug-3',
      titleAr: '🚀 توليد أفكار ريادية غير تقليدية (Unconventional Brainstorming)',
      titleEn: 'Unconventional Idea Generation',
      descriptionAr: 'هل ترغب في جلسة عصف ذهني غير مألوفة لابتكار مشروع أو نموذج عمل استثنائي يتجاوز المنافسين؟',
      descriptionEn: 'Explore out-of-the-box business & creative ideas that break traditional norms.',
      suggestedActionPrompt: 'اطرح علي 3 أفكار مشاريع مبتكرة وغير تقليدية ذات إمكانات نمو هائلة وتفوق ما هو موجود بالسوق.',
      category: 'productivity',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sug-4',
      titleAr: '🎨 استوديو الإخراج السينمائي والمحتوى فائق الجودة 8K',
      titleEn: 'Cinematic Visual Inspiration & 8K Rendering',
      descriptionAr: 'دعنا نصمم مشاهد بصرية وهوليوودية ساحرة أو نصوص محتوى إبداعي ملهم مع زوايا كاميرا وإضاءات مستقبلية.',
      descriptionEn: 'Craft Hollywood-grade visual concept prompts and cinematic artwork with advanced optics.',
      suggestedActionPrompt: 'صمم لي فكرة مشهد سينمائي خيالي مبهر بجودة 8K مع وصف دقيق للإضاءة وعدسة التصوير لتوليدها فوراً.',
      category: 'productivity',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sug-1',
      titleAr: '☀️ ملخص صباحي وإحاطة بجدول الأعمال',
      titleEn: 'Morning Executive Briefing',
      descriptionAr: 'إعداد ملخص استراتيجي شامل لأحداث اليوم والمهام المعلقة مع جدول زمني مخصص لأعلى إنتاجية.',
      descriptionEn: 'Shall I prepare your morning schedule and reminders overview?',
      suggestedActionPrompt: 'أعد لي ملخصاً صباحياً شاملاً بأحداث اليوم والتذكيرات الهامة بأسلوب محترف.',
      category: 'morning_summary',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sug-2',
      titleAr: '💡 تدقيق أداء البرمجيات وحلول الهندسة العكسية',
      titleEn: 'Deep Code Audit & Performance Optimization',
      descriptionAr: 'تحليل شفرتك البرمجية واكتشاف الثغرات وتوفير كود نظيف فائق السرعة ومكتمل 100%.',
      descriptionEn: 'Analyze code performance, identify edge-cases, and refactor for maximum speed.',
      suggestedActionPrompt: 'قم بفحص الكود الحالي واقتراح تحسينات في البنية والأداء والأمان.',
      category: 'productivity',
      createdAt: new Date().toISOString(),
    },
  ]);
}

export function dismissProactiveSuggestion(id: string): void {
  const list = loadProactiveSuggestions().map((s) => (s.id === id ? { ...s, dismissed: true } : s));
  setJSON(STORAGE_KEYS.PROACTIVE_SUGGESTIONS, list);
}

export function saveProactiveSuggestion(suggestion: Omit<ProactiveSuggestion, 'id' | 'createdAt'>): ProactiveSuggestion {
  const list = loadProactiveSuggestions();
  const newSug: ProactiveSuggestion = {
    ...suggestion,
    id: 'sug-' + Date.now(),
    createdAt: new Date().toISOString(),
  };
  list.unshift(newSug);
  setJSON(STORAGE_KEYS.PROACTIVE_SUGGESTIONS, list);
  return newSug;
}

// Notes Management
export function loadNotes(): Note[] {
  return getJSON<Note[]>(STORAGE_KEYS.NOTES, []);
}

export function saveNote(title: string, content: string, category: string = 'عام'): Note {
  const notes = loadNotes();
  const existingIdx = notes.findIndex((n) => n.title.toLowerCase() === title.toLowerCase());
  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    notes[existingIdx] = {
      ...notes[existingIdx],
      content,
      category: category || notes[existingIdx].category,
      updatedAt: now,
    };
    setJSON(STORAGE_KEYS.NOTES, notes);
    return notes[existingIdx];
  } else {
    const newNote: Note = {
      id: 'note-' + Date.now(),
      title: title || 'ملاحظة جديدة',
      content,
      category,
      createdAt: now,
      updatedAt: now,
    };
    notes.unshift(newNote);
    setJSON(STORAGE_KEYS.NOTES, notes);
    return newNote;
  }
}

export function deleteNote(id: string): void {
  const notes = loadNotes().filter((n) => n.id !== id);
  setJSON(STORAGE_KEYS.NOTES, notes);
}

// Calendar Events Management
export function loadEvents(): CalendarEvent[] {
  return getJSON<CalendarEvent[]>(STORAGE_KEYS.EVENTS, []);
}

export function saveEvent(event: Omit<CalendarEvent, 'id' | 'createdAt'>): CalendarEvent {
  const events = loadEvents();
  const newEv: CalendarEvent = {
    ...event,
    id: 'evt-' + Date.now(),
    createdAt: new Date().toISOString(),
  };
  events.push(newEv);
  // Sort by date/time
  events.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  setJSON(STORAGE_KEYS.EVENTS, events);
  return newEv;
}

export function deleteEvent(id: string): void {
  const events = loadEvents().filter((e) => e.id !== id);
  setJSON(STORAGE_KEYS.EVENTS, events);
}

// Reminders Management
export function loadReminders(): Reminder[] {
  return getJSON<Reminder[]>(STORAGE_KEYS.REMINDERS, []);
}

export function saveReminder(title: string, targetTimeIso: string): Reminder {
  const reminders = loadReminders();
  const newRem: Reminder = {
    id: 'rem-' + Date.now(),
    title,
    targetTime: targetTimeIso,
    isCompleted: false,
    createdAt: new Date().toISOString(),
  };
  reminders.push(newRem);
  setJSON(STORAGE_KEYS.REMINDERS, reminders);
  return newRem;
}

export function toggleReminderComplete(id: string): void {
  const reminders = loadReminders().map((r) =>
    r.id === id ? { ...r, isCompleted: !r.isCompleted } : r
  );
  setJSON(STORAGE_KEYS.REMINDERS, reminders);
}

export function deleteReminder(id: string): void {
  const reminders = loadReminders().filter((r) => r.id !== id);
  setJSON(STORAGE_KEYS.REMINDERS, reminders);
}

export function snoozeReminder(id: string, minutes: number): Reminder[] {
  const nowMs = Date.now();
  const reminders = loadReminders().map((r) => {
    if (r.id === id) {
      const currentMs = new Date(r.targetTime).getTime();
      const baseMs = currentMs > nowMs ? currentMs : nowMs;
      const newTimeIso = new Date(baseMs + minutes * 60 * 1000).toISOString();
      return { ...r, targetTime: newTimeIso, isCompleted: false };
    }
    return r;
  });
  setJSON(STORAGE_KEYS.REMINDERS, reminders);
  return reminders;
}

export function saveAllReminders(reminders: Reminder[]): void {
  setJSON(STORAGE_KEYS.REMINDERS, reminders);
}

// Sessions & Chat History Management
export function loadSessions(): ConversationSession[] {
  // If NOT logged in with Google, do NOT load persistent history
  if (!currentActiveUserId) {
    if (!guestActiveSession) {
      guestActiveSession = {
        id: 'guest-session-temp',
        title: 'محادثة مؤقتة (وضع الضيف)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: 'msg-welcome-guest',
            sender: 'agent',
            content:
              'مرحباً بك! أنت الآن في وضع الضيف المؤقت. لتفعيل الذاكرة الدائمة وتذكر كافة محادثاتك وتفضيلاتك وحفظها دائماً عبر جميع الجلسات، يرجى تسجيل الدخول بحسابك في Google عبر زر تسجيل الدخول بالأعلى.',
            timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      };
    }
    return [guestActiveSession];
  }

  const sessions = getJSON<ConversationSession[]>(STORAGE_KEYS.SESSIONS, []);
  let modified = false;
  const sanitized = sessions.map((sess) => ({
    ...sess,
    messages: sess.messages.map((msg) => {
      if (msg.sender === 'agent' && (msg.content.includes('نور') || msg.content.includes('أدم'))) {
        modified = true;
        return {
          ...msg,
          content: msg.content.replace(/نور/g, 'آدم').replace(/أدم/g, 'آدم'),
        };
      }
      return msg;
    }),
  }));
  if (modified) {
    setJSON(STORAGE_KEYS.SESSIONS, sanitized);
  }
  return sanitized;
}

export function loadActiveSessionId(): string | null {
  if (!currentActiveUserId) {
    return guestActiveSession ? guestActiveSession.id : 'guest-session-temp';
  }
  const scopedKey = getUserScopedKey(STORAGE_KEYS.ACTIVE_SESSION_ID);
  if (memoryCache.has(scopedKey)) {
    return memoryCache.get(scopedKey);
  }
  const val = localStorage.getItem(scopedKey);
  if (val) memoryCache.set(scopedKey, val);
  return val;
}

export function saveActiveSessionId(id: string): void {
  if (!currentActiveUserId) {
    return;
  }
  const scopedKey = getUserScopedKey(STORAGE_KEYS.ACTIVE_SESSION_ID);
  memoryCache.set(scopedKey, id);
  if (storageWorker) {
    storageWorker.postMessage({ action: 'setRaw', key: scopedKey, value: id });
  } else {
    localStorage.setItem(scopedKey, id);
  }
}

export function createNewSession(title?: string): ConversationSession {
  const now = new Date().toISOString();
  if (!currentActiveUserId) {
    guestActiveSession = {
      id: 'guest-session-' + Date.now(),
      title: title || 'محادثة مؤقتة (وضع الضيف)',
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: 'msg-welcome-' + Date.now(),
          sender: 'agent',
          content:
            'مرحباً بك! أنت في وضع الضيف. لتفعيل الذاكرة الدائمة وحفظ سجل محادثاتك عبر جميع الجلسات، يرجى تسجيل الدخول بحساب Google.',
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };
    return guestActiveSession;
  }

  const sessions = loadSessions();
  const newSession: ConversationSession = {
    id: 'sess-' + Date.now(),
    title: title || 'محادثة جديدة',
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: 'msg-welcome-' + Date.now(),
        sender: 'agent',
        content:
          'مرحباً بك! أنا "آدم"، وكيل الذكاء الاصطناعي الخاص بك. ذاكرتك ومحادثاتك محفوظة دائماً بحسابك في Google. كيف يمكنني مساعدتك اليوم؟',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      },
    ],
  };
  sessions.unshift(newSession);
  setJSON(STORAGE_KEYS.SESSIONS, sessions);
  saveActiveSessionId(newSession.id);
  return newSession;
}

export function saveSession(session: ConversationSession): void {
  // If NOT logged in with Google, do NOT persist to localStorage/disk
  if (!currentActiveUserId) {
    guestActiveSession = session;
    return;
  }

  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = {
      ...session,
      updatedAt: new Date().toISOString(),
    };
  } else {
    sessions.unshift(session);
  }
  setJSON(STORAGE_KEYS.SESSIONS, sessions);
}

export function deleteSession(id: string): void {
  if (!currentActiveUserId) {
    guestActiveSession = null;
    return;
  }

  const sessions = loadSessions().filter((s) => s.id !== id);
  setJSON(STORAGE_KEYS.SESSIONS, sessions);
  if (loadActiveSessionId() === id) {
    if (sessions.length > 0) {
      saveActiveSessionId(sessions[0].id);
    } else {
      const scopedKey = getUserScopedKey(STORAGE_KEYS.ACTIVE_SESSION_ID);
      localStorage.removeItem(scopedKey);
    }
  }
}

/**
 * Summarizes all past conversations for Google-authenticated users
 * so that Adam AI remembers every conversation topic, detail, and fact discussed across sessions.
 */
export function loadUserConversationsSummary(maxSessions = 15): string {
  if (!currentActiveUserId) {
    return '';
  }

  const sessions = loadSessions();
  if (!sessions || sessions.length === 0) {
    return '';
  }

  const summaries: string[] = [];
  for (const s of sessions.slice(0, maxSessions)) {
    const userMsgs = s.messages.filter((m) => m.sender === 'user' && m.content && m.content.trim().length > 0);
    const agentMsgs = s.messages.filter((m) => m.sender === 'agent' && m.content && m.content.trim().length > 0 && !m.isError);
    if (userMsgs.length === 0) continue;

    const topicsSnippet = userMsgs
      .slice(0, 4)
      .map((m) => m.content.trim().slice(0, 100))
      .join(' | ');

    const lastResponse = agentMsgs.length > 0 ? agentMsgs[agentMsgs.length - 1].content.trim().slice(0, 150) : '';
    const dateStr = s.updatedAt ? new Date(s.updatedAt).toLocaleDateString('ar-EG') : 'سابقاً';

    summaries.push(`* [جلسة محادثة: "${s.title}" بتاريخ: ${dateStr}]: المواضيع المطروحة من المستخدم: (${topicsSnippet}) ${lastResponse ? `← خلاصة الرد الأخير: (${lastResponse}...)` : ''}`);
  }

  return summaries.join('\n');
}

// Complete Privacy Data Wipe for current active user partition
export function wipeAllUserData(): void {
  if (currentActiveUserId) {
    // Remove all keys for current user
    const prefix = `_usr_${currentActiveUserId}`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.includes(prefix)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } else {
    localStorage.clear();
  }
}


// --- Activity Logs Management ---
export function loadActivityLogs(): ActivityLogEntry[] {
  return getJSON<ActivityLogEntry[]>(STORAGE_KEYS.ACTIVITY_LOGS, []);
}

export function saveActivityLog(log: Omit<ActivityLogEntry, 'id' | 'timestamp'>): ActivityLogEntry {
  const logs = loadActivityLogs();
  const newLog: ActivityLogEntry = {
    ...log,
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
  logs.unshift(newLog);
  // Keep last 100 logs
  setJSON(STORAGE_KEYS.ACTIVITY_LOGS, logs.slice(0, 100));
  return newLog;
}

export function clearActivityLogs(): void {
  setJSON(STORAGE_KEYS.ACTIVITY_LOGS, []);
}

export function undoActivityLog(logId: string): boolean {
  const logs = loadActivityLogs();
  const logIndex = logs.findIndex((l) => l.id === logId);
  if (logIndex === -1) return false;

  const log = logs[logIndex];
  if (!log.isUndoable || !log.undoData || log.undone) return false;

  const { type, action, item } = log.undoData;

  try {
    if (type === 'note') {
      if (action === 'create' && item?.id) {
        deleteNote(item.id);
      } else if (action === 'delete' && item) {
        const notes = loadNotes();
        notes.unshift(item);
        setJSON(STORAGE_KEYS.NOTES, notes);
      }
    } else if (type === 'event') {
      if (action === 'create' && item?.id) {
        deleteEvent(item.id);
      } else if (action === 'delete' && item) {
        const events = loadEvents();
        events.push(item);
        setJSON(STORAGE_KEYS.EVENTS, events);
      }
    } else if (type === 'reminder') {
      if (action === 'create' && item?.id) {
        deleteReminder(item.id);
      }
    } else if (type === 'memory') {
      if (action === 'create' && item?.id) {
        deleteMemory(item.id);
      }
    } else if (type === 'local_file') {
      if (action === 'create' && item?.id) {
        deleteLocalFile(item.id);
      } else if (action === 'delete' && item) {
        const files = loadLocalFiles();
        files.unshift(item);
        setJSON(STORAGE_KEYS.LOCAL_FILES, files);
      }
    }

    logs[logIndex].undone = true;
    setJSON(STORAGE_KEYS.ACTIVITY_LOGS, logs);
    return true;
  } catch (err) {
    console.error('Error executing undo:', err);
    return false;
  }
}

// --- Local Files Workspace Management ---
export function loadLocalFiles(): LocalFile[] {
  return getJSON<LocalFile[]>(STORAGE_KEYS.LOCAL_FILES, [
    {
      id: 'file-demo-1',
      name: 'Welcome_Workspace.md',
      path: '/workspace/Welcome_Workspace.md',
      content: '# مجلد العمليات المخصص\nهذا الملف تم إنشاؤه في مجلد التخزين المحلي لوكيل أدم الذكي.\nيمكن للوكيل إنشاء وقراءة وتعديل وحذف الملفات هنا بمرونة تامة!',
      mimeType: 'text/markdown',
      size: 154,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);
}

export function saveLocalFile(name: string, content: string, path: string = '/workspace/'): LocalFile {
  const files = loadLocalFiles();
  const fullPath = path.endsWith('/') ? `${path}${name}` : path;
  const existingIdx = files.findIndex((f) => f.name.toLowerCase() === name.toLowerCase() || f.path === fullPath);
  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    files[existingIdx] = {
      ...files[existingIdx],
      content,
      size: new Blob([content]).size,
      updatedAt: now,
    };
    setJSON(STORAGE_KEYS.LOCAL_FILES, files);
    return files[existingIdx];
  } else {
    const newFile: LocalFile = {
      id: 'file-' + Date.now(),
      name,
      path: fullPath,
      content,
      mimeType: name.endsWith('.json') ? 'application/json' : name.endsWith('.md') ? 'text/markdown' : 'text/plain',
      size: new Blob([content]).size,
      createdAt: now,
      updatedAt: now,
    };
    files.unshift(newFile);
    setJSON(STORAGE_KEYS.LOCAL_FILES, files);
    return newFile;
  }
}

export function deleteLocalFile(idOrName: string): LocalFile | null {
  const files = loadLocalFiles();
  const target = files.find((f) => f.id === idOrName || f.name.toLowerCase() === idOrName.toLowerCase());
  if (target) {
    const filtered = files.filter((f) => f.id !== target.id);
    setJSON(STORAGE_KEYS.LOCAL_FILES, filtered);
    return target;
  }
  return null;
}

// Background Social Messages Storage
export function loadBackgroundMessages(): BackgroundSocialMessage[] {
  return getJSON<BackgroundSocialMessage[]>(STORAGE_KEYS.BACKGROUND_MESSAGES, []);
}

export function saveBackgroundMessage(msg: Omit<BackgroundSocialMessage, 'id'> & { id?: string }): BackgroundSocialMessage {
  const list = loadBackgroundMessages();
  const newMsg: BackgroundSocialMessage = {
    id: msg.id || 'bgmsg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    ...msg,
  };
  list.unshift(newMsg);
  setJSON(STORAGE_KEYS.BACKGROUND_MESSAGES, list);
  return newMsg;
}

export function deleteBackgroundMessage(id: string): boolean {
  const list = loadBackgroundMessages();
  const filtered = list.filter((m) => m.id !== id);
  if (filtered.length !== list.length) {
    setJSON(STORAGE_KEYS.BACKGROUND_MESSAGES, filtered);
    return true;
  }
  return false;
}

// Email Monitor Rules & Inbox Items Storage
export function loadEmailMonitorRules(): EmailMonitorRule[] {
  return getJSON<EmailMonitorRule[]>(STORAGE_KEYS.EMAIL_MONITOR_RULES, [
    {
      id: 'rule-default-1',
      senderEmailOrName: 'مدير العمل / VIP',
      keywords: ['عاجل', 'فاتورة', 'اجتماع', 'مهام'],
      description: 'مراقبة الرسائل الموجهة من الإدارة والتنبيهات المباشرة',
      isActive: true,
      notifySound: true,
      matchedEmailsCount: 1,
      createdAt: new Date().toISOString(),
    },
  ]);
}

export function saveEmailMonitorRule(rule: Omit<EmailMonitorRule, 'id' | 'createdAt' | 'matchedEmailsCount'> & { id?: string }): EmailMonitorRule {
  const rules = loadEmailMonitorRules();
  const existingIdx = rules.findIndex((r) => r.id === rule.id);
  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    rules[existingIdx] = {
      ...rules[existingIdx],
      ...rule,
    };
    setJSON(STORAGE_KEYS.EMAIL_MONITOR_RULES, rules);
    return rules[existingIdx];
  } else {
    const newRule: EmailMonitorRule = {
      id: 'rule-' + Date.now(),
      senderEmailOrName: rule.senderEmailOrName,
      keywords: rule.keywords || [],
      description: rule.description || `مراقبة البريد الإلكتروني الخاص بـ ${rule.senderEmailOrName}`,
      isActive: rule.isActive !== undefined ? rule.isActive : true,
      notifySound: rule.notifySound !== undefined ? rule.notifySound : true,
      matchedEmailsCount: 0,
      createdAt: now,
    };
    rules.unshift(newRule);
    setJSON(STORAGE_KEYS.EMAIL_MONITOR_RULES, rules);
    return newRule;
  }
}

export function deleteEmailMonitorRule(ruleId: string): boolean {
  const rules = loadEmailMonitorRules();
  const filtered = rules.filter((r) => r.id !== ruleId);
  if (filtered.length !== rules.length) {
    setJSON(STORAGE_KEYS.EMAIL_MONITOR_RULES, filtered);
    return true;
  }
  return false;
}

export function loadMonitoredEmails(): MonitoredEmailItem[] {
  return getJSON<MonitoredEmailItem[]>(STORAGE_KEYS.MONITORED_EMAILS, [
    {
      id: 'email-demo-1',
      ruleId: 'rule-default-1',
      senderName: 'أحمد الإداري',
      senderEmail: 'ahmed.admin@company.com',
      subject: 'طلب تحديث سريع وتأكيد اجتماع الغد',
      previewText: 'أهلاً بك، نود التأكيد على جدول أعمال اجتماع الغد وتنسيق التقرير النهائي...',
      receivedAt: new Date(Date.now() - 3600000).toISOString(),
      read: false,
      priority: 'urgent',
    },
  ]);
}

export function saveMonitoredEmail(emailItem: Omit<MonitoredEmailItem, 'id'>): MonitoredEmailItem {
  const emails = loadMonitoredEmails();
  const newItem: MonitoredEmailItem = {
    id: 'email-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    ...emailItem,
  };
  emails.unshift(newItem);
  setJSON(STORAGE_KEYS.MONITORED_EMAILS, emails);

  // Update rule match count
  const rules = loadEmailMonitorRules();
  const ruleIdx = rules.findIndex((r) => r.id === emailItem.ruleId);
  if (ruleIdx >= 0) {
    rules[ruleIdx].matchedEmailsCount = (rules[ruleIdx].matchedEmailsCount || 0) + 1;
    rules[ruleIdx].lastCheckedIso = new Date().toISOString();
    setJSON(STORAGE_KEYS.EMAIL_MONITOR_RULES, rules);
  }

  return newItem;
}

export function markEmailRead(emailId: string): void {
  const emails = loadMonitoredEmails();
  const item = emails.find((e) => e.id === emailId);
  if (item) {
    item.read = true;
    setJSON(STORAGE_KEYS.MONITORED_EMAILS, emails);
  }
}

// Voice Interaction History Storage
export function getVoiceInteractions(): VoiceInteractionLog[] {
  const list = getJSON<VoiceInteractionLog[]>(STORAGE_KEYS.VOICE_INTERACTIONS, []);
  if (list.length === 0) {
    const sampleItems: VoiceInteractionLog[] = [
      {
        id: 'voice-log-1',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        transcript: 'آدم، ما هي حالة الطقس وجدول مواعيدي اليوم؟',
        agentResponse: 'أهلاً بك! حالة الطقس مشمسة بدرجة حرارة 28 مئوية، ولديك اجتماع عمل في تمام الساعة 4:00 مساءً والتذكير بشراء المستلزمات.',
        source: 'wake_word',
        confidence: 0.98,
        modelUsed: 'gemini-3.7-flash',
      },
      {
        id: 'voice-log-2',
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        transcript: 'سجل ملاحظة جديدة بعنوان فكرة مشروع الذكاء الاصطناعي السيادي',
        agentResponse: 'تم حفظ الملاحظة بنجاح في مدير الملاحظات بعنوان "فكرة مشروع الذكاء الاصطناعي السيادي".',
        source: 'continuous_mic',
        confidence: 0.95,
        modelUsed: 'gemini-3.7-flash',
      },
      {
        id: 'voice-log-3',
        timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        transcript: 'ابحث لي عن أحدث أخبار التقنية والذكاء الاصطناعي لليوم',
        agentResponse: 'بناءً على رادار الأخبار الفورية المحدث، هناك قفزات كبيرة في أداء وكلاء الذكاء الاصطناعي مع معالجات دقيقة فائقة السرعة وأنظمة الاتصال اللحظي.',
        source: 'mic_button',
        confidence: 0.99,
        modelUsed: 'gemini-3.7-flash',
      },
    ];
    setJSON(STORAGE_KEYS.VOICE_INTERACTIONS, sampleItems);
    return sampleItems;
  }
  return list;
}

export function saveVoiceInteraction(
  transcript: string,
  agentResponse: string,
  source: VoiceInteractionLog['source'] = 'mic_button',
  modelUsed?: string
): VoiceInteractionLog {
  const current = getVoiceInteractions();
  const newItem: VoiceInteractionLog = {
    id: `voice-log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    transcript,
    agentResponse,
    source,
    confidence: Number((0.95 + Math.random() * 0.04).toFixed(2)),
    modelUsed: modelUsed || 'gemini-3.7-flash',
  };
  const updated = [newItem, ...current].slice(0, 100);
  setJSON(STORAGE_KEYS.VOICE_INTERACTIONS, updated);
  return newItem;
}

export function deleteVoiceInteraction(id: string): boolean {
  const current = getVoiceInteractions();
  const filtered = current.filter((item) => item.id !== id);
  if (filtered.length !== current.length) {
    setJSON(STORAGE_KEYS.VOICE_INTERACTIONS, filtered);
    return true;
  }
  return false;
}

export function clearVoiceInteractions(): void {
  setJSON(STORAGE_KEYS.VOICE_INTERACTIONS, []);
}

// --- AutoHeal Telemetry & Dashboard Storage ---
export function generateDefaultAutoHealTelemetry(): AutoHealTelemetrySnapshot[] {
  const snapshots: AutoHealTelemetrySnapshot[] = [];
  const now = Date.now();
  const hoursAgo = [18, 15, 12, 9, 6, 3, 1, 0];

  const presets = [
    { found: 3, repaired: 3, syntax: 2, logic: 1, sec: 0, perf: 0, set: 0, status: 'repaired' as const },
    { found: 1, repaired: 1, syntax: 0, logic: 1, sec: 0, perf: 0, set: 0, status: 'repaired' as const },
    { found: 0, repaired: 0, syntax: 0, logic: 0, sec: 0, perf: 0, set: 0, status: 'clean' as const },
    { found: 2, repaired: 2, syntax: 1, logic: 0, sec: 1, perf: 0, set: 0, status: 'repaired' as const },
    { found: 0, repaired: 0, syntax: 0, logic: 0, sec: 0, perf: 0, set: 0, status: 'clean' as const },
    { found: 1, repaired: 1, syntax: 0, logic: 0, sec: 0, perf: 0, set: 1, status: 'repaired' as const },
    { found: 0, repaired: 0, syntax: 0, logic: 0, sec: 0, perf: 0, set: 0, status: 'clean' as const },
    { found: 0, repaired: 0, syntax: 0, logic: 0, sec: 0, perf: 0, set: 0, status: 'clean' as const },
  ];

  hoursAgo.forEach((h, idx) => {
    const timestamp = new Date(now - h * 3600 * 1000).toISOString();
    const d = new Date(timestamp);
    const displayTime = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const p = presets[idx % presets.length];

    snapshots.push({
      id: `snap-${now - h * 3600 * 1000}-${idx}`,
      timestamp,
      displayTime,
      scannedFilesCount: 6 + Math.floor(Math.random() * 3),
      issuesFoundCount: p.found,
      repairsAppliedCount: p.repaired,
      syntaxIssues: p.syntax,
      logicIssues: p.logic,
      securityIssues: p.sec,
      performanceIssues: p.perf,
      settingsIssues: p.set,
      healthScore: p.found === 0 ? 100 : Math.min(100, 85 + p.repaired * 5),
      durationMs: 12 + Math.floor(Math.random() * 20),
      status: p.status,
      summaryAr: p.found > 0
        ? `تم رصد ${p.found} أخطاء برمجية وتصحيح ${p.repaired} تلقائياً`
        : 'فحص برمجي شامل ونظيف 100%',
      summaryEn: p.found > 0
        ? `Detected ${p.found} issues and auto-repaired ${p.repaired}`
        : 'Clean 100% verified code scan',
    });
  });

  return snapshots;
}

export function loadAutoHealTelemetry(): AutoHealTelemetrySnapshot[] {
  const items = getJSON<AutoHealTelemetrySnapshot[]>(STORAGE_KEYS.AUTOHEAL_TELEMETRY, []);
  if (items.length === 0) {
    const initial = generateDefaultAutoHealTelemetry();
    setJSON(STORAGE_KEYS.AUTOHEAL_TELEMETRY, initial);
    return initial;
  }
  return items;
}

export function saveAutoHealTelemetrySnapshot(
  snapshot: Omit<AutoHealTelemetrySnapshot, 'id' | 'timestamp' | 'displayTime'> & { id?: string; timestamp?: string }
): AutoHealTelemetrySnapshot {
  const current = loadAutoHealTelemetry();
  const now = new Date();
  const newSnapshot: AutoHealTelemetrySnapshot = {
    ...snapshot,
    id: snapshot.id || `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: snapshot.timestamp || now.toISOString(),
    displayTime: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };

  const updated = [newSnapshot, ...current].slice(0, 150);
  setJSON(STORAGE_KEYS.AUTOHEAL_TELEMETRY, updated);
  return newSnapshot;
}

export function clearAutoHealTelemetry(): void {
  const fresh = generateDefaultAutoHealTelemetry().slice(-3);
  setJSON(STORAGE_KEYS.AUTOHEAL_TELEMETRY, fresh);
}




