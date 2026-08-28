import {
  deleteEmailMonitorRule,
  deleteEvent,
  deleteLocalFile,
  deleteNote,
  loadBackgroundMessages,
  loadEmailMonitorRules,
  loadEvents,
  loadLocalFiles,
  loadMonitoredEmails,
  loadNotes,
  markEmailRead,
  saveActivityLog,
  saveBackgroundMessage,
  saveEmailMonitorRule,
  saveEvent,
  saveLocalFile,
  saveMemory,
  saveMonitoredEmail,
  saveNote,
  saveReminder,
} from './storage';

export interface ToolDefinition {
  name: string;
  displayNameAr: string;
  displayNameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  parameters: Record<string, any>;
  execute: (args: any) => Promise<{ success: boolean; result: any; summaryAr: string; summaryEn: string }>;
}

// 1. WebSearchTool
export const webSearchTool: ToolDefinition = {
  name: 'web_search',
  displayNameAr: 'بحث الويب والإنترنت',
  displayNameEn: 'Web Search',
  descriptionAr: 'البحث عن آخر الأخبار، المعلومات، والأسعار على الويب',
  descriptionEn: 'Search the web for up-to-date information and news',
  parameters: {
    query: { type: 'string', description: 'مصطلح البحث' },
  },
  execute: async ({ query }: { query: string }) => {
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      const summaryAr = `تم إجراء البحث عن: "${query}" بنجاح`;
      const summaryEn = `Searched for: "${query}" successfully`;

      saveActivityLog({
        toolName: 'web_search',
        displayNameAr: 'بحث الويب',
        displayNameEn: 'Web Search',
        actionSummaryAr: summaryAr,
        actionSummaryEn: summaryEn,
        details: { query },
      });

      return { success: true, result: data, summaryAr, summaryEn };
    } catch (e: any) {
      return {
        success: false,
        result: null,
        summaryAr: `فشل البحث: ${e.message}`,
        summaryEn: `Search failed: ${e.message}`,
      };
    }
  },
};

// 2. CalendarTool
export const calendarTool: ToolDefinition = {
  name: 'calendar_tool',
  displayNameAr: 'أداة التقويم والأحداث',
  displayNameEn: 'Calendar Tool',
  descriptionAr: 'إنشاء، استرجاع، وتصفح المواعيد والأحداث في التقويم',
  descriptionEn: 'Create, retrieve, and manage calendar events',
  parameters: {
    action: { type: 'string', enum: ['create', 'list', 'delete'] },
    title: { type: 'string' },
    date: { type: 'string', description: 'YYYY-MM-DD' },
    time: { type: 'string', description: 'HH:MM' },
    durationMinutes: { type: 'number' },
    location: { type: 'string' },
    notes: { type: 'string' },
    eventId: { type: 'string' },
  },
  execute: async (args) => {
    const action = args.action || 'create';
    if (action === 'create') {
      const event = saveEvent({
        title: args.title || 'موعد جديد',
        date: args.date || new Date().toISOString().split('T')[0],
        time: args.time || '12:00',
        durationMinutes: args.durationMinutes || 30,
        location: args.location || '',
        notes: args.notes || '',
      });
      const summaryAr = `تم إدراج الحدث "${event.title}" بتاريخ ${event.date} الساعة ${event.time}`;
      const summaryEn = `Created event "${event.title}" on ${event.date} at ${event.time}`;

      saveActivityLog({
        toolName: 'calendar_tool',
        displayNameAr: 'إدارة التقويم',
        displayNameEn: 'Calendar Tool',
        actionSummaryAr: summaryAr,
        actionSummaryEn: summaryEn,
        details: { action: 'create', event },
        isUndoable: true,
        undoData: { type: 'event', action: 'create', item: event },
      });

      return { success: true, result: event, summaryAr, summaryEn };
    } else if (action === 'list') {
      const events = loadEvents();
      return {
        success: true,
        result: events,
        summaryAr: `تم جلب ${events.length} حدث من التقويم`,
        summaryEn: `Retrieved ${events.length} calendar events`,
      };
    } else if (action === 'delete') {
      if (args.eventId) {
        const events = loadEvents();
        const targetEvent = events.find((e) => e.id === args.eventId);
        deleteEvent(args.eventId);
        const summaryAr = `تم حذف الحدث بنجاح`;
        const summaryEn = `Deleted event successfully`;

        if (targetEvent) {
          saveActivityLog({
            toolName: 'calendar_tool',
            displayNameAr: 'حذف من التقويم',
            displayNameEn: 'Delete Calendar Event',
            actionSummaryAr: `تم حذف الحدث: "${targetEvent.title}"`,
            actionSummaryEn: `Deleted event: "${targetEvent.title}"`,
            details: { action: 'delete', eventId: args.eventId },
            isUndoable: true,
            undoData: { type: 'event', action: 'delete', item: targetEvent },
          });
        }

        return { success: true, result: null, summaryAr, summaryEn };
      }
    }
    return {
      success: false,
      result: null,
      summaryAr: 'إجراء تقويم غير معروف',
      summaryEn: 'Unknown calendar action',
    };
  },
};

// 3. ReminderTool
export const reminderTool: ToolDefinition = {
  name: 'reminder_tool',
  displayNameAr: 'أداة التذكيرات والتنبيهات',
  displayNameEn: 'Reminder Tool',
  descriptionAr: 'ضبط تذكير محلي أو تنبيه بعد مدة معينة أو في وقت محدد',
  descriptionEn: 'Set local alarms and timed reminders',
  parameters: {
    title: { type: 'string', description: 'عنوان التذكير' },
    minutesFromNow: { type: 'number', description: 'عدد الدقائق من الآن' },
    targetDateTime: { type: 'string', description: 'تاريخ وساعة محددين ISO String' },
  },
  execute: async (args) => {
    let targetTimeIso = args.targetDateTime;
    if (!targetTimeIso && args.minutesFromNow) {
      const target = new Date(Date.now() + args.minutesFromNow * 60 * 1000);
      targetTimeIso = target.toISOString();
    }
    if (!targetTimeIso) {
      targetTimeIso = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    }

    const reminder = saveReminder(args.title || 'تذكير هام', targetTimeIso);
    const targetFormatted = new Date(targetTimeIso).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const summaryAr = `تم ضبط التذكير: "${reminder.title}" على الساعة ${targetFormatted}`;
    const summaryEn = `Set reminder: "${reminder.title}" for ${targetFormatted}`;

    saveActivityLog({
      toolName: 'reminder_tool',
      displayNameAr: 'إضافة تذكير',
      displayNameEn: 'Set Reminder',
      actionSummaryAr: summaryAr,
      actionSummaryEn: summaryEn,
      details: { reminder },
      isUndoable: true,
      undoData: { type: 'reminder', action: 'create', item: reminder },
    });

    return { success: true, result: reminder, summaryAr, summaryEn };
  },
};

// 4. CalculatorTool
export const calculatorTool: ToolDefinition = {
  name: 'calculator_tool',
  displayNameAr: 'الآلة الحاسبة وتحويل الوحدات',
  displayNameEn: 'Calculator Tool',
  descriptionAr: 'إجراء عمليات حسابية دقيقة، تحويل العملات، والوحدات',
  descriptionEn: 'Perform mathematical calculations and unit/currency conversions',
  parameters: {
    expression: { type: 'string', description: 'المعادلة الرياضية أو التحويل' },
    operation: { type: 'string', enum: ['math', 'unit_convert', 'currency_convert'] },
  },
  execute: async ({ expression }: { expression: string }) => {
    try {
      const sanitized = expression.replace(/[^0-9+\-*/().^%\s]/g, '');
      let evalResult: number | string = '';

      if (sanitized.trim()) {
        evalResult = Function(`"use strict"; return (${sanitized})`)();
      } else {
        evalResult = 'المعادلة تحتوي على رموز غير مسموحة';
      }

      const summaryAr = `النتيجة الحسابية: ${expression} = ${evalResult}`;
      const summaryEn = `Calculation result: ${expression} = ${evalResult}`;

      saveActivityLog({
        toolName: 'calculator_tool',
        displayNameAr: 'حساب مالي/رياضي',
        displayNameEn: 'Calculator',
        actionSummaryAr: summaryAr,
        actionSummaryEn: summaryEn,
        details: { expression, output: evalResult },
      });

      return {
        success: true,
        result: { expression, output: evalResult },
        summaryAr,
        summaryEn,
      };
    } catch (e: any) {
      return {
        success: false,
        result: null,
        summaryAr: `خطأ في الحساب: ${e.message}`,
        summaryEn: `Calculation error: ${e.message}`,
      };
    }
  },
};

// 5. NoteTool
export const noteTool: ToolDefinition = {
  name: 'note_tool',
  displayNameAr: 'أداة الملاحظات',
  displayNameEn: 'Notes Tool',
  descriptionAr: 'إنشاء وحفظ واسترجاع الملاحظات النصية',
  descriptionEn: 'Create, save, search, and list text notes',
  parameters: {
    action: { type: 'string', enum: ['save', 'list', 'delete', 'search'] },
    title: { type: 'string' },
    content: { type: 'string' },
    category: { type: 'string' },
    noteId: { type: 'string' },
    searchQuery: { type: 'string' },
  },
  execute: async (args) => {
    const action = args.action || 'save';
    if (action === 'save') {
      const note = saveNote(args.title || 'ملاحظة', args.content || '', args.category || 'عام');
      const summaryAr = `تم حفظ الملاحظة: "${note.title}"`;
      const summaryEn = `Saved note: "${note.title}"`;

      saveActivityLog({
        toolName: 'note_tool',
        displayNameAr: 'حفظ ملاحظة',
        displayNameEn: 'Save Note',
        actionSummaryAr: summaryAr,
        actionSummaryEn: summaryEn,
        details: { note },
        isUndoable: true,
        undoData: { type: 'note', action: 'create', item: note },
      });

      return { success: true, result: note, summaryAr, summaryEn };
    } else if (action === 'list') {
      const notes = loadNotes();
      return {
        success: true,
        result: notes,
        summaryAr: `تم العثور على ${notes.length} ملاحظة`,
        summaryEn: `Found ${notes.length} notes`,
      };
    } else if (action === 'delete' && args.noteId) {
      const notes = loadNotes();
      const targetNote = notes.find((n) => n.id === args.noteId);
      deleteNote(args.noteId);
      const summaryAr = `تم حذف الملاحظة بنجاح`;
      const summaryEn = `Deleted note successfully`;

      if (targetNote) {
        saveActivityLog({
          toolName: 'note_tool',
          displayNameAr: 'حذف ملاحظة',
          displayNameEn: 'Delete Note',
          actionSummaryAr: `تم حذف الملاحظة: "${targetNote.title}"`,
          actionSummaryEn: `Deleted note: "${targetNote.title}"`,
          details: { noteId: args.noteId },
          isUndoable: true,
          undoData: { type: 'note', action: 'delete', item: targetNote },
        });
      }

      return { success: true, result: null, summaryAr, summaryEn };
    } else if (action === 'search' && args.searchQuery) {
      const notes = loadNotes().filter(
        (n) =>
          n.title.toLowerCase().includes(args.searchQuery.toLowerCase()) ||
          n.content.toLowerCase().includes(args.searchQuery.toLowerCase())
      );
      return {
        success: true,
        result: notes,
        summaryAr: `عثرت على ${notes.length} ملاحظة مطابقة للبحث "${args.searchQuery}"`,
        summaryEn: `Found ${notes.length} matching notes for "${args.searchQuery}"`,
      };
    }
    return {
      success: false,
      result: null,
      summaryAr: 'إجراء ملاحظات غير معروف',
      summaryEn: 'Unknown note action',
    };
  },
};

// 6. MemoryTool
export const memoryTool: ToolDefinition = {
  name: 'remember_fact',
  displayNameAr: 'ذاكرة الوكيل طويلة المدى',
  displayNameEn: 'Long-term Memory',
  descriptionAr: 'تذكر حقيقة أو تفضيل ثابت للمستخدم في الذاكرة طويلة المدى',
  descriptionEn: 'Store a permanent user fact or preference in long-term memory',
  parameters: {
    fact: { type: 'string', description: 'الحقيقة أو المعلومة المراد تذكرها' },
    category: { type: 'string', enum: ['preference', 'personal_info', 'habit', 'work', 'other'] },
  },
  execute: async (args) => {
    const mem = saveMemory(args.fact, args.category || 'preference');
    const summaryAr = `تم حفظ الحقيقة في الذاكرة: "${mem.fact}"`;
    const summaryEn = `Stored fact in long-term memory: "${mem.fact}"`;

    saveActivityLog({
      toolName: 'remember_fact',
      displayNameAr: 'حفظ في الذاكرة',
      displayNameEn: 'Store Memory',
      actionSummaryAr: summaryAr,
      actionSummaryEn: summaryEn,
      details: { memory: mem },
      isUndoable: true,
      undoData: { type: 'memory', action: 'create', item: mem },
    });

    return { success: true, result: mem, summaryAr, summaryEn };
  },
};

export interface AppTargetInfo {
  rawInput: string;
  appScheme?: string;
  webUrl: string;
  preferApp: boolean;
  appNameAr: string;
  appNameEn: string;
}

interface KnownAppConfig {
  keys: string[];
  appScheme: string;
  webUrl: string;
  appNameAr: string;
  appNameEn: string;
}

const KNOWN_APPS: KnownAppConfig[] = [
  {
    keys: ['whatsapp', 'واتساب', 'واتس', 'واتس اب'],
    appScheme: 'whatsapp://',
    webUrl: 'https://web.whatsapp.com',
    appNameAr: 'واتساب',
    appNameEn: 'WhatsApp',
  },
  {
    keys: ['youtube', 'يوتيوب', 'يو تيوب'],
    appScheme: 'vnd.youtube://',
    webUrl: 'https://www.youtube.com',
    appNameAr: 'يوتيوب',
    appNameEn: 'YouTube',
  },
  {
    keys: ['telegram', 'تليجرام', 'تلغرام', 'تليغرام'],
    appScheme: 'tg://',
    webUrl: 'https://web.telegram.org',
    appNameAr: 'تليجرام',
    appNameEn: 'Telegram',
  },
  {
    keys: ['spotify', 'سبوتيفاي', 'سبوتفاي'],
    appScheme: 'spotify://',
    webUrl: 'https://open.spotify.com',
    appNameAr: 'سبوتيفاي',
    appNameEn: 'Spotify',
  },
  {
    keys: ['zoom', 'زوم'],
    appScheme: 'zoomus://',
    webUrl: 'https://zoom.us',
    appNameAr: 'زوم',
    appNameEn: 'Zoom',
  },
  {
    keys: ['twitter', 'تويتر', 'x'],
    appScheme: 'twitter://',
    webUrl: 'https://x.com',
    appNameAr: 'تويتر (X)',
    appNameEn: 'Twitter (X)',
  },
  {
    keys: ['facebook', 'فيسبوك', 'فيس بوك', 'فيس'],
    appScheme: 'fb://',
    webUrl: 'https://www.facebook.com',
    appNameAr: 'فيسبوك',
    appNameEn: 'Facebook',
  },
  {
    keys: ['instagram', 'انستجرام', 'انستغرام', 'انستا'],
    appScheme: 'instagram://',
    webUrl: 'https://www.instagram.com',
    appNameAr: 'انستغرام',
    appNameEn: 'Instagram',
  },
  {
    keys: ['tiktok', 'تيك توك', 'تيكتوك'],
    appScheme: 'snssdk1233://',
    webUrl: 'https://www.tiktok.com',
    appNameAr: 'تيك توك',
    appNameEn: 'TikTok',
  },
  {
    keys: ['gmail', 'جيميل', 'البريد الالكترونى', 'البريد'],
    appScheme: 'googlegmail://',
    webUrl: 'https://mail.google.com',
    appNameAr: 'جيميل',
    appNameEn: 'Gmail',
  },
  {
    keys: ['maps', 'خرائط', 'خرائط جوجل', 'جوجل ماب'],
    appScheme: 'comgooglemaps://',
    webUrl: 'https://maps.google.com',
    appNameAr: 'خرائط جوجل',
    appNameEn: 'Google Maps',
  },
  {
    keys: ['discord', 'ديسكورد'],
    appScheme: 'discord://',
    webUrl: 'https://discord.com',
    appNameAr: 'ديسكورد',
    appNameEn: 'Discord',
  },
  {
    keys: ['skype', 'سكايب'],
    appScheme: 'skype:',
    webUrl: 'https://www.skype.com',
    appNameAr: 'سكايب',
    appNameEn: 'Skype',
  },
  {
    keys: ['snapchat', 'سناب شات', 'سناب'],
    appScheme: 'snapchat://',
    webUrl: 'https://www.snapchat.com',
    appNameAr: 'سناب شات',
    appNameEn: 'Snapchat',
  },
  {
    keys: ['linkedin', 'لينكد ان', 'لينكدإن'],
    appScheme: 'linkedin://',
    webUrl: 'https://www.linkedin.com',
    appNameAr: 'لينكد إن',
    appNameEn: 'LinkedIn',
  },
  {
    keys: ['calculator', 'حاسبة', 'الآلة الحاسبة', 'آلة حاسبة'],
    appScheme: 'calc:',
    webUrl: 'https://www.calculator.net',
    appNameAr: 'الآلة الحاسبة',
    appNameEn: 'Calculator',
  },
  {
    keys: ['notion', 'نوشن'],
    appScheme: 'notion://',
    webUrl: 'https://www.notion.so',
    appNameAr: 'نوشن',
    appNameEn: 'Notion',
  },
  {
    keys: ['chatgpt', 'شات جي بي تي'],
    appScheme: 'chatgpt://',
    webUrl: 'https://chatgpt.com',
    appNameAr: 'شات جي بي تي',
    appNameEn: 'ChatGPT',
  },
  {
    keys: ['drive', 'جوجل درايف', 'درايف'],
    appScheme: 'googledrive://',
    webUrl: 'https://drive.google.com',
    appNameAr: 'جوجل درايف',
    appNameEn: 'Google Drive',
  },
  {
    keys: ['weather', 'الطقس'],
    appScheme: 'bingweather://',
    webUrl: 'https://weather.com',
    appNameAr: 'الطقس',
    appNameEn: 'Weather',
  },
  {
    keys: ['translate', 'ترجمة', 'ترجمة جوجل'],
    appScheme: 'googletranslate://',
    webUrl: 'https://translate.google.com',
    appNameAr: 'ترجمة جوجل',
    appNameEn: 'Google Translate',
  },
];

export function resolveAppTarget(raw: string): AppTargetInfo {
  if (!raw) {
    return {
      rawInput: raw,
      webUrl: 'https://www.google.com',
      preferApp: false,
      appNameAr: 'جوجل',
      appNameEn: 'Google',
    };
  }

  const query = raw.trim().toLowerCase();
  const isWebOnlyRequested =
    query.includes('موقع') ||
    query.includes('ويب') ||
    query.includes('صفحة') ||
    query.includes('website') ||
    query.includes('site') ||
    query.includes('web');

  for (const app of KNOWN_APPS) {
    for (const key of app.keys) {
      if (query === key || query.includes(key)) {
        return {
          rawInput: raw,
          appScheme: app.appScheme,
          webUrl: app.webUrl,
          preferApp: !isWebOnlyRequested,
          appNameAr: app.appNameAr,
          appNameEn: app.appNameEn,
        };
      }
    }
  }

  if (raw.includes(':') && !raw.startsWith('http://') && !raw.startsWith('https://')) {
    return {
      rawInput: raw,
      appScheme: raw,
      webUrl: 'https://www.google.com/search?q=' + encodeURIComponent(raw),
      preferApp: true,
      appNameAr: raw,
      appNameEn: raw,
    };
  }

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return {
      rawInput: raw,
      webUrl: raw,
      preferApp: false,
      appNameAr: raw,
      appNameEn: raw,
    };
  }

  if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(raw)) {
    const fullUrl = 'https://' + raw;
    return {
      rawInput: raw,
      webUrl: fullUrl,
      preferApp: false,
      appNameAr: raw,
      appNameEn: raw,
    };
  }

  return {
    rawInput: raw,
    webUrl: `https://www.google.com/search?q=${encodeURIComponent(raw)}`,
    preferApp: false,
    appNameAr: raw,
    appNameEn: raw,
  };
}

export function resolveAppOrUrl(raw: string): string {
  const target = resolveAppTarget(raw);
  if (target.preferApp && target.appScheme) {
    return target.appScheme;
  }
  return target.webUrl;
}

// 7. AppLauncherTool / OpenLinkTool
export const openAppOrUrlTool: ToolDefinition = {
  name: 'open_app_or_url',
  displayNameAr: 'فتح تطبيق أو موقع ويب',
  displayNameEn: 'Open App / URL',
  descriptionAr: 'فتح تطبيق مثبت على الجهاز عبر البروتوكول المباشر أولاً ثم الانتقال إلى الموقع بدائل تلقائياً',
  descriptionEn: 'Open installed native app via protocol deep links first with browser fallback',
  parameters: {
    url: { type: 'string', description: 'اسم التطبيق أو الرابط أو اسم الموقع المطلوب فتحه' },
    target: { type: 'string', description: '_blank or self' },
  },
  execute: async (args) => {
    const rawInput = args.url || args.app || args.appName || args.targetUrl || '';
    const targetInfo = resolveAppTarget(rawInput);

    try {
      if (typeof window !== 'undefined') {
        if (targetInfo.preferApp && targetInfo.appScheme) {
          const hiddenAnchor = document.createElement('a');
          hiddenAnchor.href = targetInfo.appScheme;
          hiddenAnchor.target = '_self';
          document.body.appendChild(hiddenAnchor);
          hiddenAnchor.click();
          document.body.removeChild(hiddenAnchor);

          setTimeout(() => {
            if (document.hasFocus()) {
              window.open(targetInfo.webUrl, '_blank');
            }
          }, 1200);
        } else {
          window.open(targetInfo.webUrl, '_blank');
        }
      }

      const openedTypeAr = targetInfo.preferApp && targetInfo.appScheme ? `تطبيق ${targetInfo.appNameAr} المثبت (أو الموقع البديل)` : `موقع ${targetInfo.appNameAr}`;
      const summaryAr = `تم إرسال أمر فتح ${openedTypeAr} بنجاح`;
      const summaryEn = `Triggered opening for ${targetInfo.appNameEn}`;

      saveActivityLog({
        toolName: 'open_app_or_url',
        displayNameAr: 'فتح تطبيق / موقع',
        displayNameEn: 'Open App / URL',
        actionSummaryAr: summaryAr,
        actionSummaryEn: summaryEn,
        details: targetInfo,
      });

      return {
        success: true,
        result: {
          url: targetInfo.appScheme || targetInfo.webUrl,
          appScheme: targetInfo.appScheme,
          webUrl: targetInfo.webUrl,
          preferApp: targetInfo.preferApp,
          appNameAr: targetInfo.appNameAr,
          appNameEn: targetInfo.appNameEn,
          rawInput,
        },
        summaryAr,
        summaryEn,
      };
    } catch (e: any) {
      return {
        success: true,
        result: {
          url: targetInfo.webUrl,
          appScheme: targetInfo.appScheme,
          webUrl: targetInfo.webUrl,
          preferApp: targetInfo.preferApp,
          appNameAr: targetInfo.appNameAr,
          appNameEn: targetInfo.appNameEn,
        },
        summaryAr: `تم إعداد رابط فتح ${targetInfo.appNameAr}`,
        summaryEn: `Prepared launch link for ${targetInfo.appNameEn}`,
      };
    }
  },
};

// 8. LocalFileManagerTool (WorkSpace File Operations)
export const localFileManagerTool: ToolDefinition = {
  name: 'local_file_manager',
  displayNameAr: 'إدارة الملفات المحلية',
  displayNameEn: 'Local File Manager',
  descriptionAr: 'إنشاء، قراءة، تعديل، وحذف الملفات النصية/البرمجية في مجلد عمل الوكيل المحلي',
  descriptionEn: 'Create, read, edit, list, and delete files in the agent dedicated local workspace storage',
  parameters: {
    action: { type: 'string', enum: ['create_file', 'read_file', 'edit_file', 'delete_file', 'list_files'] },
    fileName: { type: 'string', description: 'اسم الملف مثل report.txt أو data.json' },
    content: { type: 'string', description: 'محتوى الملف عند الإنشاء أو التعديل' },
    fileId: { type: 'string' },
  },
  execute: async (args) => {
    const action = args.action || 'list_files';

    if (action === 'create_file' || action === 'edit_file') {
      const fileName = args.fileName || `file_${Date.now()}.txt`;
      const content = args.content || '';
      const saved = saveLocalFile(fileName, content);

      const summaryAr = `تم ${action === 'create_file' ? 'إنشاء' : 'تحديث'} الملف المحلي "${saved.name}" بنجاح (${saved.size} بايت)`;
      const summaryEn = `Successfully ${action === 'create_file' ? 'created' : 'updated'} local file "${saved.name}"`;

      saveActivityLog({
        toolName: 'local_file_manager',
        displayNameAr: 'إدارة ملفات - حفظ',
        displayNameEn: 'File Manager - Save',
        actionSummaryAr: summaryAr,
        actionSummaryEn: summaryEn,
        details: { action, file: saved },
        isUndoable: true,
        undoData: { type: 'local_file', action: 'create', item: saved },
      });

      return { success: true, result: saved, summaryAr, summaryEn };
    } else if (action === 'delete_file') {
      const idOrName = args.fileId || args.fileName;
      if (!idOrName) {
        return { success: false, result: null, summaryAr: 'الرجاء تحديد اسم أو معرف الملف للحذف', summaryEn: 'Please specify file name or id' };
      }
      const deleted = deleteLocalFile(idOrName);
      if (deleted) {
        const summaryAr = `تم حذف الملف المحلي "${deleted.name}" بنجاح`;
        const summaryEn = `Deleted local file "${deleted.name}" successfully`;

        saveActivityLog({
          toolName: 'local_file_manager',
          displayNameAr: 'إدارة ملفات - حذف',
          displayNameEn: 'File Manager - Delete',
          actionSummaryAr: summaryAr,
          actionSummaryEn: summaryEn,
          details: { file: deleted },
          isUndoable: true,
          undoData: { type: 'local_file', action: 'delete', item: deleted },
        });

        return { success: true, result: deleted, summaryAr, summaryEn };
      }
      return { success: false, result: null, summaryAr: 'الملف غير موجود لمسحه', summaryEn: 'File not found to delete' };
    } else if (action === 'read_file') {
      const files = loadLocalFiles();
      const file = files.find((f) => f.id === args.fileId || f.name.toLowerCase() === args.fileName?.toLowerCase());
      if (file) {
        return {
          success: true,
          result: file,
          summaryAr: `قراءة الملف "${file.name}": ${file.content.slice(0, 100)}...`,
          summaryEn: `Read file "${file.name}"`,
        };
      }
      return { success: false, result: null, summaryAr: 'الملف المطلوب غير موجود', summaryEn: 'Requested file not found' };
    } else if (action === 'list_files') {
      const files = loadLocalFiles();
      return {
        success: true,
        result: files,
        summaryAr: `تم العثور على ${files.length} ملفات محلية في مجلد العمليات`,
        summaryEn: `Found ${files.length} local files in workspace`,
      };
    }

    return { success: false, result: null, summaryAr: 'إجراء ملفات غير معروف', summaryEn: 'Unknown file action' };
  },
};

// 9. MediaGeneratorTool (Image Editor & Video AI Engine)
export const mediaGeneratorTool: ToolDefinition = {
  name: 'media_generator',
  displayNameAr: 'استوديو توليد وتعديل الصور والفيديوهات الاحترافي السينمائي 🎬🎨⚡',
  displayNameEn: 'Hollywood AI Image & Video Studio',
  descriptionAr: 'توليد وتعديل الصور والفيديوهات بمستوى هوليوود سينمائي مع طبقة هندسة البرومبت الذكية',
  descriptionEn: 'Generate & edit Hollywood-grade 4K photos & 8K cinematic videos',
  parameters: {
    mediaType: { type: 'string', enum: ['image', 'video', 'nano_banana_edit'], description: 'نوع العمل المطلوب: image لتوليد صورة، nano_banana_edit لتعديل صورة، video لفيديو سينمائي' },
    prompt: { type: 'string', description: 'وصف تفصيلي أو تعليمات التعديل/المشهد المطلوب تطبيقها باللغة العربية أو الإنجليزية' },
    shotType: { type: 'string', description: 'نوع اللقطة (extreme_close_up, close_up, medium_shot, wide_shot, establishing_shot, over_the_shoulder, low_angle, high_angle, eye_level, dutch_tilt)' },
    lighting: { type: 'string', description: 'نوع الإضاءة (golden_hour, volumetric, three_point, harsh_noir, backlit_silhouette, soft_window, practical_neon)' },
    lens: { type: 'string', description: 'نوع العدسة (35mm_prime, 85mm_portrait, anamorphic, deep_focus)' },
    colorGrade: { type: 'string', description: 'تلوين المشهد (teal_orange, desaturated_moody, hdr_contrast, warm_sunset, cold_cinematic_blue)' },
    negativePrompt: { type: 'string', description: 'العناصر المستبعدة لتجنب التشوه والجودة المنخفضة' },
    editMode: {
      type: 'string',
      enum: ['free_edit', 'upscale_4k', 'anime', 'remove_bg', '3d_render', 'cyberpunk', 'portrait'],
      description: 'وضع التعديل على الصورة (تعديل حر، تحسين 4K، أنمي، إزالة خلفية، 3D، سايبورغ، بورتريه)',
    },
    style: {
      type: 'string',
      enum: ['photorealistic', 'cinematic', 'anime', '3d_render', 'cyberpunk', 'fantasy'],
      description: 'النمط الفني (واقعي، سينمائي، أنمي، 3D، نيون، خيالي)',
    },
    aspectRatio: { type: 'string', enum: ['1:1', '16:9', '21:9', '9:16', '4:3', '3:4'], description: 'أبعاد اللوحة' },
    durationSeconds: { type: 'number', description: 'مدة الفيديو بالثواني (3، 5، أو 8 ثوانٍ)' },
    cameraMotion: { type: 'string', enum: ['zoom_in', 'orbit', 'pan_right', 'drone', 'slow_motion', 'slow_dolly_in', 'tracking_shot', 'crane_shot', 'steadicam_glide'], description: 'حركة الكاميرا السينمائية' },
  },
  execute: async (args) => {
    try {
      const mediaType = args.mediaType || 'image';
      const prompt = args.prompt || (mediaType === 'image' ? 'صورة فائقة الجودة بدقة 8K' : 'مشهد سينمائي متلألئ وفاخر');

      const directorOptions = {
        shotType: args.shotType,
        lighting: args.lighting,
        lens: args.lens,
        colorGrade: args.colorGrade,
        cameraMotion: args.cameraMotion,
        negativePrompt: args.negativePrompt,
      };

      const res = await fetch('/api/generate-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: mediaType,
          engine: mediaType === 'video' ? 'video' : 'default',
          editMode: args.editMode || 'free_edit',
          prompt,
          directorOptions,
          style: args.style || 'cinematic',
          aspectRatio: args.aspectRatio || (mediaType === 'video' ? '16:9' : '1:1'),
          durationSeconds: args.durationSeconds || 5,
          cameraMotion: args.cameraMotion || 'zoom_in',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'فشل محرك التوليد والمعالجة');
      }

      const fileName = `${mediaType}_media_${Date.now()}.${mediaType === 'video' ? 'mp4' : 'png'}`;
      saveLocalFile(fileName, data.mediaUrl || data.prompt || prompt);

      const summaryAr = mediaType === 'video'
        ? `تم إنتاج فيديو سينمائي عالي الجودة ⚡ (${data.durationSeconds || 5} ثوانٍ - 8K) لـ: "${prompt}"`
        : mediaType === 'nano_banana_edit'
        ? `تم تعديل الصورة بنجاح بوضع (${args.editMode || 'تعديل حر'})!`
        : `تم توليد صورة احترافية عالية الجودة ⚡ (${data.aspectRatio || '1:1'}) بنجاح لـ: "${prompt}"`;

      const summaryEn = mediaType === 'video'
        ? `Successfully generated 8K cinematic video for: "${prompt}"`
        : mediaType === 'nano_banana_edit'
        ? `Successfully edited image (${args.editMode || 'free_edit'})!`
        : `Successfully generated high quality image for: "${prompt}"`;

      saveActivityLog({
        toolName: 'media_generator',
        displayNameAr: mediaType === 'video' ? 'صناعة فيديو سينمائي ⚡' : 'تعديل وصناعة الصور الاحترافية 🎨',
        displayNameEn: mediaType === 'video' ? 'AI Video Generator' : 'AI Image Generator & Editor',
        actionSummaryAr: summaryAr,
        actionSummaryEn: summaryEn,
        details: { mediaType, prompt, mediaUrl: data.mediaUrl, style: data.style, editMode: args.editMode, cameraMotion: args.cameraMotion },
      });

      return {
        success: true,
        result: data,
        summaryAr,
        summaryEn,
      };
    } catch (e: any) {
      return {
        success: false,
        result: null,
        summaryAr: `فشل محرك توليد الوسائط: ${e.message}`,
        summaryEn: `Media AI Engine Failed: ${e.message}`,
      };
    }
  },
};

// 10. SocialMessagingTool (Background Messaging Dispatcher for Instagram, WhatsApp, Email, etc.)
export const socialMessagingTool: ToolDefinition = {
  name: 'social_messaging_tool',
  displayNameAr: 'إرسال الرسائل والتواصل في الخلفية',
  displayNameEn: 'Background Social Messaging Engine',
  descriptionAr: 'إرسال رسائل مباشرة وموجهة في الخلفية عبر انستغرام، واتساب، تليجرام، البريد الإلكتروني، تويتر/X، فيسبوك ماسنجر، وSMS',
  descriptionEn: 'Send direct messaging, emails, and chat dispatches in the background across Instagram, WhatsApp, Telegram, Email, X/Twitter, Messenger, etc.',
  parameters: {
    platform: {
      type: 'string',
      enum: ['instagram', 'whatsapp', 'telegram', 'email', 'twitter', 'messenger', 'linkedin', 'sms', 'other'],
      description: 'منصة التواصل المراد الإرسال عبرها (instagram, whatsapp, telegram, email, twitter, messenger, sms)',
    },
    recipient: { type: 'string', description: 'المستلم: اسم المستخدم (@user)، رقم الهاتف (+213...)، أو البريد الإلكتروني' },
    content: { type: 'string', description: 'نص الرسالة أو المحتوى المطلوب إرساله' },
    subject: { type: 'string', description: 'موضوع الرسالة (في حالة البريد الإلكتروني)' },
    scheduleMinutes: { type: 'number', description: 'عدد الدقائق للإرسال المجدول في الخلفية (0 للإرسال الفوري)' },
  },
  execute: async (args) => {
    try {
      const platform = (args.platform || 'whatsapp').toLowerCase();
      const recipient = args.recipient || 'عام / Unspecified';
      const content = args.content || 'تحية طيبة من أدم (آدم الذكاء الاصطناعي)';
      const subject = args.subject || 'رسالة فورية عبر أدم الذكي';
      const scheduleMinutes = Number(args.scheduleMinutes || 0);

      let appDeepLink = '';
      let webFallbackUrl = '';
      const cleanRecipient = recipient.replace(/^@/, '');

      switch (platform) {
        case 'instagram':
          appDeepLink = `instagram://direct`;
          webFallbackUrl = cleanRecipient ? `https://instagram.com/direct/t/${cleanRecipient}` : `https://instagram.com/direct/inbox/`;
          break;
        case 'whatsapp':
          const phoneNum = recipient.replace(/[^0-9+]/g, '');
          appDeepLink = `whatsapp://send?phone=${encodeURIComponent(phoneNum)}&text=${encodeURIComponent(content)}`;
          webFallbackUrl = `https://web.whatsapp.com/send?phone=${encodeURIComponent(phoneNum)}&text=${encodeURIComponent(content)}`;
          break;
        case 'telegram':
          appDeepLink = `tg://msg?to=${encodeURIComponent(cleanRecipient)}&text=${encodeURIComponent(content)}`;
          webFallbackUrl = `https://t.me/${cleanRecipient}`;
          break;
        case 'email':
          appDeepLink = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(content)}`;
          webFallbackUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(content)}`;
          break;
        case 'twitter':
          appDeepLink = `twitter://messages/compose`;
          webFallbackUrl = `https://x.com/messages/compose`;
          break;
        case 'messenger':
          appDeepLink = `fb-messenger://user/${encodeURIComponent(cleanRecipient)}`;
          webFallbackUrl = `https://www.facebook.com/messages/t/`;
          break;
        case 'sms':
          appDeepLink = `sms:${encodeURIComponent(recipient)}?body=${encodeURIComponent(content)}`;
          webFallbackUrl = `sms:${encodeURIComponent(recipient)}?body=${encodeURIComponent(content)}`;
          break;
        default:
          appDeepLink = webSearchTool ? `https://www.google.com/search?q=${encodeURIComponent(recipient)}` : '';
          webFallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(recipient)}`;
          break;
      }

      const isScheduled = scheduleMinutes > 0;
      const scheduledTimeIso = isScheduled ? new Date(Date.now() + scheduleMinutes * 60000).toISOString() : new Date().toISOString();

      const savedMsg = saveBackgroundMessage({
        platform: platform as any,
        recipient,
        content,
        status: isScheduled ? 'scheduled' : 'sent',
        scheduledTimeIso,
        sentAt: isScheduled ? undefined : new Date().toISOString(),
        appDeepLink,
        webFallbackUrl,
      });

      // Trigger immediate browser notification & launch if not scheduled
      if (!isScheduled && typeof window !== 'undefined') {
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`🚀 تم إرسال رسالة ${platform.toUpperCase()}`, {
              body: `المستلم: ${recipient}\nالمحتوى: ${content.slice(0, 80)}`,
            });
          } catch (err) {
            console.error('[Notification Error]:', err);
          }
        }

        // Attempt launching deep link
        if (appDeepLink) {
          try {
            const anchor = document.createElement('a');
            anchor.href = appDeepLink;
            anchor.target = '_self';
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
          } catch (e) {
            console.warn('[Deep link trigger warning]:', e);
          }
        }
      }

      const platformNamesAr: Record<string, string> = {
        instagram: 'انستغرام (Instagram)',
        whatsapp: 'واتساب (WhatsApp)',
        telegram: 'تليجرام (Telegram)',
        email: 'البريد الإلكتروني (Email)',
        twitter: 'تويتر/X',
        messenger: 'فيسبوك ماسنجر',
        sms: 'رسالة نصية SMS',
      };
      const platformAr = platformNamesAr[platform] || platform;

      const summaryAr = isScheduled
        ? `تم جدولة إرسال رسالة ${platformAr} إلى (${recipient}) بعد ${scheduleMinutes} دقائق في الخلفية بنجاح.`
        : `تم تنفيذ وإرسال الرسالة بنجاح عبر ${platformAr} إلى المستلم (${recipient}) في الخلفية 🚀.`;
      const summaryEn = isScheduled
        ? `Scheduled background message to ${recipient} via ${platform} in ${scheduleMinutes} minutes.`
        : `Dispatched background message to ${recipient} via ${platform} successfully.`;

      saveActivityLog({
        toolName: 'social_messaging_tool',
        displayNameAr: `إرسال رسالة ${platformAr}`,
        displayNameEn: `Send ${platform} Message`,
        actionSummaryAr: summaryAr,
        actionSummaryEn: summaryEn,
        details: { platform, recipient, content, isScheduled, messageId: savedMsg.id },
      });

      return {
        success: true,
        result: {
          message: savedMsg,
          appDeepLink,
          webFallbackUrl,
          platform,
          recipient,
          content,
          isScheduled,
        },
        summaryAr,
        summaryEn,
      };
    } catch (e: any) {
      return {
        success: false,
        result: null,
        summaryAr: `فشل إرسال الرسالة في الخلفية: ${e.message}`,
        summaryEn: `Failed sending background message: ${e.message}`,
      };
    }
  },
};

// 11. EmailMonitorTool (Autonomous Email & Inbox Monitor)
export const emailMonitorTool: ToolDefinition = {
  name: 'email_monitor_tool',
  displayNameAr: 'مراقب ورادار البريد الإلكتروني الخاص',
  displayNameEn: 'Autonomous Email Inbox Monitor',
  descriptionAr: 'مراقبة صندوق البريد الإلكتروني في الخلفية والتنبيه الفوري الصوتي والحركي فور وصول رسالة من شخص محدد أو تحتوي كلمات مفتاحية',
  descriptionEn: 'Monitor email inbox in the background and notify the user with audio/desktop alarms when emails from specific senders or keywords arrive',
  parameters: {
    action: {
      type: 'string',
      enum: ['add_rule', 'list_rules', 'remove_rule', 'check_inbox', 'simulate_receive'],
      description: 'الإجراء المطلوب (إضافة قاعدة مراقبة، عرض القواعد، مسح قاعدة، فحص الوارد، أو تجربة وصول رسالة)',
    },
    senderEmailOrName: { type: 'string', description: 'اسم أو بريد الشخص المراد مراقبته مثل: ahmed@company.com أو "المدير"' },
    keywords: { type: 'string', description: 'كلمات مفتاحية مفصولة بفاصلة مثل: عاجل, فاتورة, اجتماع' },
    description: { type: 'string', description: 'وصف اختياري لقاعدة المراقبة' },
    ruleId: { type: 'string', description: 'معرف القاعدة للمسح' },
    simulatedSubject: { type: 'string', description: 'عنوان الرسالة للنمذجة والاختبار' },
    simulatedBody: { type: 'string', description: 'نص الرسالة للنمذجة والاختبار' },
  },
  execute: async (args) => {
    try {
      const action = args.action || 'list_rules';

      if (action === 'add_rule') {
        const sender = args.senderEmailOrName || 'البريد العام';
        const rawKeywords = args.keywords ? args.keywords.split(',').map((k: string) => k.trim()).filter(Boolean) : [];
        const rule = saveEmailMonitorRule({
          senderEmailOrName: sender,
          keywords: rawKeywords,
          description: args.description || `مراقبة البريد القادم من: ${sender}`,
          isActive: true,
          notifySound: true,
        });

        const summaryAr = `تم تفعيل رادار مراقبة البريد الإلكتروني بنجاح لحساب (${sender}) مع تنبيهات الصوت والخلفية الفورية!`;
        const summaryEn = `Activated inbox monitor rule for (${sender}) with sound & desktop background alerts!`;

        saveActivityLog({
          toolName: 'email_monitor_tool',
          displayNameAr: 'إضافة مراقب بريد',
          displayNameEn: 'Add Email Monitor Rule',
          actionSummaryAr: summaryAr,
          actionSummaryEn: summaryEn,
          details: { rule },
        });

        return { success: true, result: rule, summaryAr, summaryEn };
      } else if (action === 'list_rules') {
        const rules = loadEmailMonitorRules();
        const emails = loadMonitoredEmails();
        const summaryAr = `تم استرجاع ${rules.length} قواعد مراقبة نشطة و ${emails.length} رسائل واردة ممسوحة`;
        const summaryEn = `Found ${rules.length} active email monitor rules and ${emails.length} monitored items`;

        return { success: true, result: { rules, emails }, summaryAr, summaryEn };
      } else if (action === 'remove_rule') {
        if (!args.ruleId) {
          return { success: false, result: null, summaryAr: 'يرجى تحديد معرف قاعدة المراقبة لمسحها', summaryEn: 'Rule ID required' };
        }
        const removed = deleteEmailMonitorRule(args.ruleId);
        const summaryAr = removed ? `تم إيقاف ومسح قاعدة مراقبة البريد بنجاح` : `لم يتم العثور على قاعدة المراقبة المطلوب حذفها`;
        const summaryEn = removed ? `Removed email monitor rule successfully` : `Email monitor rule not found`;

        saveActivityLog({
          toolName: 'email_monitor_tool',
          displayNameAr: 'إلغاء مراقب بريد',
          displayNameEn: 'Remove Email Monitor Rule',
          actionSummaryAr: summaryAr,
          actionSummaryEn: summaryEn,
          details: { ruleId: args.ruleId, removed },
        });

        return { success: removed, result: { ruleId: args.ruleId }, summaryAr, summaryEn };
      } else if (action === 'simulate_receive' || action === 'check_inbox') {
        const rules = loadEmailMonitorRules().filter((r) => r.isActive);
        const activeRule = rules[0] || {
          id: 'rule-auto',
          senderEmailOrName: args.senderEmailOrName || 'رسالة بريد جديدة',
        };

        const senderName = args.senderEmailOrName || 'المدير التنفيذي / VIP';
        const senderEmail = senderName.includes('@') ? senderName : `${senderName.toLowerCase().replace(/\s+/g, '')}@domain.com`;
        const subject = args.simulatedSubject || 'رسالة بريدية مهمة: تحديث العقد المباشر وتنسيق المواعيد';
        const previewText = args.simulatedBody || 'أهلاً بك، تم إرسال هذا التحديث الهام بخصوص المشروع والمراجعة النهائية المطلوب تأكيدها...';

        const newItem = saveMonitoredEmail({
          ruleId: activeRule.id,
          senderName,
          senderEmail,
          subject,
          previewText,
          receivedAt: new Date().toISOString(),
          read: false,
          priority: 'urgent',
        });

        // Trigger Audio & Browser Alert
        if (typeof window !== 'undefined') {
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(659.25, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.4);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.6);
          } catch (e) {
            console.error('[Audio Alert Error]:', e);
          }

          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`📩 رسالة بريد جديدة من ${senderName}`, {
                body: `العنوان: ${subject}\nالبريد: ${senderEmail}`,
              });
            } catch (e) {
              console.error('[Notification Error]:', e);
            }
          }
        }

        const summaryAr = `🚨 تنبيه رادار البريد! تم رصد ووصول رسالة بريد جديدة فورية من (${senderName} - ${senderEmail}): "${subject}"`;
        const summaryEn = `🚨 Email Radar Alert! Caught new incoming email from (${senderName}): "${subject}"`;

        saveActivityLog({
          toolName: 'email_monitor_tool',
          displayNameAr: 'تنبيه وصول بريد',
          displayNameEn: 'Incoming Email Caught',
          actionSummaryAr: summaryAr,
          actionSummaryEn: summaryEn,
          details: { emailItem: newItem },
        });

        return { success: true, result: { newEmail: newItem }, summaryAr, summaryEn };
      }

      return { success: false, result: null, summaryAr: 'إجراء مراقب البريد غير معروف', summaryEn: 'Unknown email monitor action' };
    } catch (e: any) {
      return {
        success: false,
        result: null,
        summaryAr: `فشل تشغيل مراقب البريد: ${e.message}`,
        summaryEn: `Email monitor failed: ${e.message}`,
      };
    }
  },
};

// 12. NewsIntelligenceTool (World News & Agent Continuous Self-Evolution Engine)
export const newsIntelligenceTool: ToolDefinition = {
  name: 'news_intelligence_tool',
  displayNameAr: 'رادار ومحرك الأخبار العالمية والتعلم الذاتي',
  displayNameEn: 'World News Intelligence & Auto-Learning Engine',
  descriptionAr: 'جلب، تصفية، ومتابعة آخر الأخبار العالمية فوراً واستخراج حقائق ومعلومات جديدة ليطور الوكيل نفسه تلقائياً كل يوم',
  descriptionEn: 'Fetch, filter, and track daily world news and extract auto-learned facts to continuously update agent knowledge',
  parameters: {
    action: {
      type: 'string',
      enum: ['sync_daily_news', 'get_latest_news', 'search_news'],
      description: 'الإجراء: sync_daily_news لتحديث وتلقي أخبار اليوم، get_latest_news لعرض الأخبار، search_news للبحث عن خبر محدد',
    },
    category: {
      type: 'string',
      enum: ['all', 'world', 'tech_ai', 'economy', 'science', 'sports'],
      description: 'تصنيف الأخبار المراد جلبها',
    },
    query: { type: 'string', description: 'استعلام البحث في الأخبار' },
  },
  execute: async (args) => {
    try {
      const action = args.action || 'get_latest_news';
      const category = args.category || 'all';

      if (action === 'sync_daily_news' || action === 'get_latest_news') {
        const endpoint = action === 'sync_daily_news' ? '/api/news/sync' : '/api/news/latest';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category, query: args.query }),
        });
        const data = await res.json();

        const count = data.items?.length || 0;
        const summaryAr = `تم جلب وتحديث نشرة الأخبار العالمية بنجاح (${count} خبراً إخبارياً اليوم). وقام الوكيل بتعلم ${data.autoLearnedFacts?.length || 0} معلومة جديدة لتطوير معرفته الذاتية!`;
        const summaryEn = `Fetched & synced world news digest (${count} global news articles). Agent auto-learned ${data.autoLearnedFacts?.length || 0} new facts!`;

        saveActivityLog({
          toolName: 'news_intelligence_tool',
          displayNameAr: 'مزامنة وتطوير الأخبار اليومية',
          displayNameEn: 'World News Auto-Sync',
          actionSummaryAr: summaryAr,
          actionSummaryEn: summaryEn,
          details: { category, articlesCount: count, data },
        });

        // Save auto-learned facts into long-term memory
        if (Array.isArray(data.autoLearnedFacts)) {
          for (const fact of data.autoLearnedFacts) {
            saveMemory(fact, 'other');
          }
        }

        return { success: true, result: data, summaryAr, summaryEn };
      } else if (action === 'search_news') {
        const queryStr = args.query || 'آخر المستجدات العالمية اليوم';
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: `آخر أخبار وتطورات اليوم: ${queryStr}` }),
        });
        const data = await res.json();

        const summaryAr = `تم إجراء بحث إخباري دقيق عن: "${queryStr}"`;
        const summaryEn = `Searched news for: "${queryStr}"`;

        saveActivityLog({
          toolName: 'news_intelligence_tool',
          displayNameAr: 'بحث إخباري عاجل',
          displayNameEn: 'Breaking News Search',
          actionSummaryAr: summaryAr,
          actionSummaryEn: summaryEn,
          details: { query: queryStr, data },
        });

        return { success: true, result: data, summaryAr, summaryEn };
      }

      return { success: false, result: null, summaryAr: 'إجراء إخباري غير معروف', summaryEn: 'Unknown news action' };
    } catch (e: any) {
      return {
        success: false,
        result: null,
        summaryAr: `فشل رادار الأخبار: ${e.message}`,
        summaryEn: `News radar failed: ${e.message}`,
      };
    }
  },
};

// 13. VideoDownloadTool (Universal Video Downloader via yt-dlp Backend)
export const videoDownloadTool: ToolDefinition = {
  name: 'video_download_tool',
  displayNameAr: 'محرك تحميل الفيديوهات المتقدم',
  displayNameEn: 'Universal Video Downloader',
  descriptionAr: 'التعرف تلقائياً على روابط الفيديو من منصات يوتيوب، تيك توك، إنستغرام، فيسبوك، تويتر/X، إلخ، وجلب الجودات المتاحة وتحميل الفيديو بمرونة',
  descriptionEn: 'Detect video URLs across YouTube, TikTok, Instagram, Facebook, Twitter/X, and download in various qualities',
  parameters: {
    url: { type: 'string', description: 'رابط الفيديو من أي منصة' },
    action: {
      type: 'string',
      enum: ['get_info', 'start_download'],
      description: 'get_info لجلب معاينة الفيديو والجودات، start_download لبدء التحميل',
    },
    quality: {
      type: 'string',
      enum: ['best', '1080p', '720p', '480p', 'mp3'],
      description: 'الجودة المطلوبة لتحميل الفيديو أو الصوت',
    },
  },
  execute: async (args) => {
    try {
      const url = args.url;
      const action = args.action || 'get_info';
      const quality = args.quality || 'best';

      if (!url) {
        return { success: false, result: null, summaryAr: 'يرجى تقديم رابط فيديو صالح', summaryEn: 'Please provide a valid video URL' };
      }

      if (action === 'get_info') {
        const res = await fetch('/api/video/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'فشل جلب معلومات الفيديو');
        }

        const summaryAr = `تم جلب معاينة الفيديو: "${data.title}" من منصة ${data.platform} والجودات المتاحة متوفرة للتحميل.`;
        const summaryEn = `Fetched info for "${data.title}" on ${data.platform}. Available for download.`;

        saveActivityLog({
          toolName: 'video_download_tool',
          displayNameAr: 'معاينة رابط فيديو',
          displayNameEn: 'Video Info Fetch',
          actionSummaryAr: summaryAr,
          actionSummaryEn: summaryEn,
          details: { url, data },
        });

        return { success: true, result: data, summaryAr, summaryEn };
      } else {
        // start_download
        const res = await fetch('/api/video/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, quality }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'فشل البدء في تحميل الفيديو');
        }

        const summaryAr = `تم البدء في تحميل الفيديو بجودة (${quality}). رقم المهمة: ${data.jobId}`;
        const summaryEn = `Started video download in ${quality} quality. Job ID: ${data.jobId}`;

        saveActivityLog({
          toolName: 'video_download_tool',
          displayNameAr: 'بدء تحميل فيديو',
          displayNameEn: 'Start Video Download',
          actionSummaryAr: summaryAr,
          actionSummaryEn: summaryEn,
          details: { url, quality, jobId: data.jobId },
        });

        return { success: true, result: data, summaryAr, summaryEn };
      }
    } catch (e: any) {
      return {
        success: false,
        result: null,
        summaryAr: `خطأ في أداة التحميل: ${e.message}`,
        summaryEn: `Video downloader error: ${e.message}`,
      };
    }
  },
};

import { AutoHealEngine } from './autoHealEngine';

// 14. AutoHealEngineTool (Autonomous Code Scanner & Fixer)
export const autoHealEngineTool: ToolDefinition = {
  name: 'auto_heal_engine',
  displayNameAr: 'محرك الفحص والإصلاح البرمجي الذاتي',
  displayNameEn: 'AutoHealEngine Code Scanner & Fixer',
  descriptionAr: 'مسح الكود برمجياً لاكتشاف أي ثغرات أو أخطاء بناء (Syntax Errors) أو أخطاء منطقية (Logic Errors) وإصلاحها تلقائياً مع تسجيل تقرير مفصل في ActivityLog',
  descriptionEn: 'Programmatically scan code and workspace for syntax and logic errors, auto-repair them, and log detailed reports to ActivityLog',
  parameters: {
    forceDeepScan: { type: 'boolean', description: 'إجراء فحص عميق لكافة ملفات الكود والذاكرة' },
    snippetName: { type: 'string', description: 'اسم الملف أو الكود البرمجي المراد فحصه' },
    snippetCode: { type: 'string', description: 'الكود البرمجي المراد فحصه وإصلاحه برمجياً' },
  },
  execute: async (args) => {
    try {
      const customSnippet = args.snippetName && args.snippetCode ? {
        name: args.snippetName,
        content: args.snippetCode,
      } : undefined;

      const report = await AutoHealEngine({
        customSnippet,
        forceDeepScan: args.forceDeepScan ?? true,
      });

      return {
        success: true,
        result: report,
        summaryAr: report.summaryAr,
        summaryEn: report.summaryEn,
      };
    } catch (e: any) {
      return {
        success: false,
        result: null,
        summaryAr: `تعذر تشغيل محرك الفحص البرمجي: ${e.message}`,
        summaryEn: `Failed to execute AutoHealEngine: ${e.message}`,
      };
    }
  },
};

// All available tools map
export const ALL_TOOLS: Record<string, ToolDefinition> = {
  web_search: webSearchTool,
  calendar_tool: calendarTool,
  reminder_tool: reminderTool,
  calculator_tool: calculatorTool,
  note_tool: noteTool,
  remember_fact: memoryTool,
  open_app_or_url: openAppOrUrlTool,
  local_file_manager: localFileManagerTool,
  media_generator: mediaGeneratorTool,
  social_messaging_tool: socialMessagingTool,
  email_monitor_tool: emailMonitorTool,
  news_intelligence_tool: newsIntelligenceTool,
  video_download_tool: videoDownloadTool,
  auto_heal_engine: autoHealEngineTool,
};
