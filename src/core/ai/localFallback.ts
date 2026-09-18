import type { Language, Message } from '../domain';
import {
  getSmartCalculatorAppCode,
  getInteractiveTodoAppCode,
  getPrecisionStopwatchTimerAppCode,
  getNeonCanvasDrawingAppCode,
  getNeonSnakeGameCode,
} from '../agent/interactiveAppTemplates';

interface FallbackContext {
  prompt: string;
  language: Language;
  agentName: string;
  messages: Message[];
}

export function generateLocalFallbackResponse({
  prompt,
  language,
  agentName,
}: FallbackContext): string {
  const clean = prompt.trim();
  const lower = clean.toLowerCase();

  // 1. Calculator request
  if (
    /(?:حاسبة|حاسبه|الة حاسبة|آلة حاسبة|calculator|calc|برمج لي حاسبة|اعمل لي حاسبة|اصنع حاسبة)\b/i.test(clean)
  ) {
    const code = getSmartCalculatorAppCode();
    return language === 'ar'
      ? `إليك الآلة الحاسبة الذكية التفاعلية المتكاملة (Smart Calculator). تدعم الحسابات المباشرة، كافة العمليات الرياضية (+, -, ×, ÷, %, √, ±)، الأقواس، المؤثرات الصوتية للأزرار، واختصارات لوحة المفاتيح:

\`\`\`html
${code}
\`\`\`
`
      : `Here is your fully functional Smart Interactive Calculator. It features instant arithmetic calculations (+, -, ×, ÷, %, √, ±), parentheses, tactile sound effects, and full keyboard integration:

\`\`\`html
${code}
\`\`\`
`;
  }

  // 2. Todo / Task List request
  if (
    /(?:مهام|قائمة مهام|تودو|تودو ليست|todo|tasks|task list|مفكرة مهام|برمج لي تطبيق مهام|اعمل لي تطبيق مهام|ادارة مهام)\b/i.test(clean)
  ) {
    const code = getInteractiveTodoAppCode();
    return language === 'ar'
      ? `إليك تطبيق المهام الذكي التفاعلي المتكامل (Smart Task Matrix). يحتوي على إدارة حالة كاملة وحقيقية، إضافة وحذف المهام، تصنيف الأولويات، فلاتر العرض، شريط تقدم الإنجاز، وحفظ دائم في الذاكرة المحلية:

\`\`\`html
${code}
\`\`\`
`
      : `Here is your fully functional Smart Task Matrix application. It features complete reactive state, task creation and deletion, priority tagging, active/completed filters, progress tracking, and localStorage persistence:

\`\`\`html
${code}
\`\`\`
`;
  }

  // 3. Stopwatch / Timer request
  if (
    /(?:مؤقت|ساعة ايقاف|ساعة إيقاف|ستوب ووتش|stopwatch|timer|chrono|بومودورو|pomodoro)\b/i.test(clean)
  ) {
    const code = getPrecisionStopwatchTimerAppCode();
    return language === 'ar'
      ? `إليك تطبيق المؤقت وساعة الإيقاف الذكية التفاعلية (Precision Chronometer & Timer). تدعم دقة الأجزاء من الثانية، تسجيل الدورات (Laps)، خيارات العد التنازلي المسبقة وبومودورو، والتنبيه الصوتي الحقيقي:

\`\`\`html
${code}
\`\`\`
`
      : `Here is your fully functional Precision Stopwatch and Timer application with millisecond precision, lap recording, countdown presets (including Pomodoro), and Web Audio sound alarms:

\`\`\`html
${code}
\`\`\`
`;
  }

  // 4. Drawing / Paint Studio request
  if (
    /(?:رسم|تطبيق رسم|لوحة رسم|كانفاس|paint|drawing|draw|canvas)\b/i.test(clean)
  ) {
    const code = getNeonCanvasDrawingAppCode();
    return language === 'ar'
      ? `إليك استوديو الرسم الرقمي التفاعلي (Canvas Paint Studio). يدعم الرسم بالماوس واللمس على الهواتف، لوحة ألوان كاملة ومخصصة، التحكم بحجم الفرشاة والممحاة، وإمكانية تحميل الرسمة بصيغة PNG:

\`\`\`html
${code}
\`\`\`
`
      : `Here is your interactive Canvas Paint Studio. It supports mouse and mobile touch drawing, RGB color palettes, adjustable brush sizes, eraser mode, and instant PNG export:

\`\`\`html
${code}
\`\`\`
`;
  }

  // 5. Snake / Arcade Game request
  if (
    /(?:لعبة ثعبان|لعبة السنيك|snake|لعبة|العاب|ألعاب|game|arcade|play)\b/i.test(clean)
  ) {
    const code = getNeonSnakeGameCode();
    return language === 'ar'
      ? `إليك لعبة الثعبان النيون السايبر (Cyber Neon Snake) التفاعلية الكاملة. تدعم تحكم اللمس على الشاشات ومفاتيح الأسهم على لوحة المفاتيح، مع رصد النقاط والمؤثرات الصوتية:

\`\`\`html
${code}
\`\`\`
`
      : `Here is your complete interactive Cyber Neon Snake game. It features full touch controls, keyboard arrows support, live score tracking, and sound effects:

\`\`\`html
${code}
\`\`\`
`;
  }

  // 6. Date & Day Queries ("في أي يوم نحن", "ما هو تاريخ اليوم", etc.)
  const isDateQuery =
    /(?:في أي يوم|اي يوم|أي يوم|اليوم ايه|شو اليوم|تاريخ اليوم|كم التاريخ|كم اليوم|ما هو تاريخ|تاريخ|ما التاريخ|اليوم|what day|what is today|what date|today's date)/i.test(
      clean
    );

  if (isDateQuery) {
    const now = new Date();
    const dayNameAr = now.toLocaleDateString('ar-EG', { weekday: 'long' });
    const fullDateAr = now.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const dayNameEn = now.toLocaleDateString('en-US', { weekday: 'long' });
    const fullDateEn = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let hijri = '';
    try {
      hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now);
    } catch {}

    const hijriPart = hijri ? ` (الموافق هجرياً: ${hijri})` : '';

    return language === 'ar'
      ? `اليوم هو **${dayNameAr}**، الموافق **${fullDateAr}م**${hijriPart}.\n\nأنا هنا وجاهز لأي مهمة أو استفسار تطلبه.`
      : `Today is **${dayNameEn}**, **${fullDateEn}**.\n\nI am ready to help you with any task or question.`;
  }

  // 7. Current Time Queries ("كم الساعة", "الوقت الآن", etc.)
  const isTimeQuery =
    /(?:كم الساعة|كم الوقت|الساعة كم|الوقت الان|الوقت الآن|الوقت الحالي|توقيت|what time|current time|clock)/i.test(
      clean
    );

  if (isTimeQuery) {
    const now = new Date();
    const timeAr = now.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    const timeEn = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    return language === 'ar'
      ? `الوقت الحالي هو **${timeAr}** (بتوقيت جهازك المحلي).`
      : `The current time is **${timeEn}** (local device time).`;
  }

  // 8. Greetings (with robust Arabic and English matching without ASCII \b)
  const isGreeting =
    /(?:^|\s)(?:أهلا|اهلا|اعلا|أهلاً|اهلاً|مرحبا|مرحباً|السلام عليكم|سلام|صباح الخير|مساء الخير|يا هلا|هلا|هاي|الو|hello|hi|hey|greetings|good morning|good evening)(?:$|\s|[!.,؟?])/i.test(
      clean
    );

  if (isGreeting) {
    return language === 'ar'
      ? `أهلاً وسهلاً بك! أنا **${agentName} (آدم)**، وكيل الذكاء الاصطناعي التنفيذي الخاص بك.\n\nأنا متصل وجاهز لتنفيذ طلباتك مباشرة، سواء في البرمجة، إدارة الأنظمة، حل المشكلات، أو الإجابة عن أي استفسار. كيف يمكنني مساعدتك الآن؟`
      : `Hello! I'm **${agentName}**, your autonomous executive AI agent.\n\nI am connected and ready to execute your requests—whether for coding, system engineering, automation, or Q&A. How can I assist you right now?`;
  }

  // 9. Identity, Creator & Capabilities
  const isIdentity =
    /(?:من أنت|من انت|ما اسمك|ماذا تستطيع|ما هي قدراتك|من طورك|من صنعك|من برمجك|من صممك|من هو مطورك|who are you|what is your name|what can you do|who made you|who developed you)/i.test(
      clean
    );

  if (isIdentity) {
    return language === 'ar'
      ? `أنا **${agentName} (آدم)**، وكيل ذكاء اصطناعي تنفيذي متقدم (Executive Autonomous AI Agent).\n\n- **المطور:** تم تطويري وهندستي بواسطة **آدم فيدات (Adem Feidat)**.\n- **القدرات:**\n  1. **البرمجة والتطوير:** كتابة تطبيقات كاملة تفاعلية، ألعاب كانفاس، وحل المشكلات البرمجية.\n  2. **إدارة الأنظمة:** مهام لينكس، بايثون، الأتمتة، وأوامر Shell.\n  3. **التحليل الذكي:** معالجة البيانات، الإجابة على الاستفسارات، والتنفيذ الفوري المباشر دون إطالة أو تعقيد.\n\nتفضل بأي مهمة وسأباشر تنفيذها فوراً!`
      : `I am **${agentName}**, an advanced autonomous executive AI agent.\n\n- **Developer:** Engineered and created by **Adem Feidat**.\n- **Capabilities:**\n  1. **Full-Stack Coding:** Interactive web applications, canvas engines, code debugging.\n  2. **System Engineering:** Linux shell scripts, Python analytics, cross-platform workflows.\n  3. **Direct Execution:** Zero-fluff, efficient responses and immediate task fulfillment.\n\nShare your request and I will execute it immediately!`;
  }

  // 10. Simple Math / Calculations ("احسب 25*4", "كم ناتج 100/5", "50+50")
  const mathMatch = clean.match(/(?:احسب|كم ناتج|ما حاصل|calculate|math)?\s*([0-9\s.+\-*/^%()]+)/i);
  if (mathMatch && mathMatch[1] && /[+\-*/^%]/.test(mathMatch[1])) {
    const expr = mathMatch[1].trim();
    try {
      // Safe math evaluation with sanitized characters
      if (/^[0-9\s.+\-*/()%]+$/.test(expr)) {
        // eslint-disable-next-line no-new-func
        const result = Function(`'use strict'; return (${expr})`)();
        if (typeof result === 'number' && !Number.isNaN(result) && Number.isFinite(result)) {
          return language === 'ar'
            ? `العملية الحسابية: \`${expr}\`\n\nالنتيجة = **${result}**`
            : `Calculation: \`${expr}\`\n\nResult = **${result}**`;
        }
      }
    } catch {
      // Continue to next handlers
    }
  }

  // 11. Thanks & appreciation
  const isThanks = /(?:شكرا|شكراً|يعطيك العافية|تسلم|مشكور|thanks|thank you|thx)/i.test(clean);
  if (isThanks) {
    return language === 'ar'
      ? `على الرحب والسعة دائماً! يسعدني دوماً خدمتك ومساعدتك. إذا كان لديك أي طلب آخر، أنا جاهز في أي لحظة.`
      : `You're very welcome! Always glad to help. If you have any further tasks or questions, I'm right here.`;
  }

  // 12. General Knowledge & Assistance (Contextual, Helpful, Never Robotic)
  // Check if query is about programming languages or tech
  if (/(?:python|بايثون)/i.test(clean)) {
    return language === 'ar'
      ? `بايثون (Python) لغة برمجة قوية ومتعددة الاستخدامات، وتُعد الأفضل في الذكاء الاصطناعي وعلوم البيانات وتطوير الواجهات الخلفية (Backend) والأتمتة.\n\nهل تحتاج إلى كتابة سكريبت بايثون محدد، خوارزمية معينة، أو شرح مكتبة مثل NumPy أو Pandas؟ أخبرني بالمهمة وسأكتب لك الكود فوراً.`
      : `Python is a powerful language widely used in AI, data science, automation, and backend development.\n\nDo you need a specific Python script, algorithm, or library explanation? Let me know and I will generate the code for you.`;
  }

  if (/(?:javascript|js|جافاسكريبت|جافا سكريبت|react|رياكت)/i.test(clean)) {
    return language === 'ar'
      ? `لغة JavaScript ومكتبة React هما أساس تطوير تطبيقات الويب والواجهات التفاعلية الحديثة.\n\nيمكنني كتابة مكونات React كاملة، معالجة الحالة (State Management)، واستدعاء واجهات البرمجة (APIs). ما الذي تود بناؤه؟`
      : `JavaScript and React are the foundation of modern interactive web applications.\n\nI can write complete React components, manage state, and connect APIs. What would you like to build?`;
  }

  if (/(?:linux|لينكس|bash|باش|أوامر|termux|تيرمكس)/i.test(clean)) {
    return language === 'ar'
      ? `نظام Linux وواجهة Termux هما بيئة العمل الأساسية لإدارة الخوادم وتشغيل الحاويات وسكريبتات Bash.\n\nتفضل بالسؤال عن الأمر أو السكريبت أو المشكلة التي تريد حلها في النظام وسأعطيك الأمر المباشر فوراً.`
      : `Linux and Termux provide a powerful command-line environment for server management and automation.\n\nWhat shell script or system task do you need assistance with?`;
  }

  // 13. Smart Direct Response for any other question
  return language === 'ar'
    ? `أهلاً بك! لقد طلبت: **"${clean}"**.\n\nبصفتي الوكيل الذكي **${agentName}**، أنا متصل وجاهز للعمل معك. للحصول على أقصى ذكاء توليدي متصل بالسحاب:\n- يمكنك كتابة طلبك بوضوح وسأنفذه لك.\n- إذا كنت في تطبيق الهاتف (APK)، يمكنك أيضاً إضافة مفتاح Gemini API مجاني من شاشة **الإعدادات** لتفعيل النماذج السحابية الفائقة على هاتفك مباشرة.\n\nكيف تود أن نبدأ في تنفيذ طلبك؟`
    : `Hello! You asked: **"${clean}"**.\n\nAs your AI agent **${agentName}**, I am ready to assist. For full cloud-powered intelligence:\n- Tell me the exact task you'd like me to perform.\n- If on mobile APK, you can also add your free Gemini API key in **Settings** to unlock full cloud inference directly on your device.\n\nWhat would you like to build or solve?`;
}
