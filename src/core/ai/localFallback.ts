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

  // 6. Greetings
  const isGreeting =
    /^(?:أهلا|اهلا|اعلا|أهلاً|مرحبا|مرحباً|السلام عليكم|سلام|صباح الخير|مساء الخير|يا هلا|هلا|hello|hi|hey|greetings|good morning|good evening)\b/i.test(
      clean
    );

  if (isGreeting) {
    return language === 'ar'
      ? `أهلاً بك! أنا **${agentName}**. كيف يمكنني مساعدتك؟ تفضل بسؤالك أو طلبك وسأجيبك فوراً.`
      : `Hello! I'm **${agentName}**. How can I help you today? Feel free to ask a question or give me a task.`;
  }

  // 7. Identity & capabilities
  const isIdentity =
    /(?:من أنت|من انت|ما اسمك|ماذا تستطيع|ما هي قدراتك|who are you|what is your name|what can you do)\b/i.test(
      clean
    );

  if (isIdentity) {
    return language === 'ar'
      ? `أنا **${agentName}**، مساعدك الذكي للمساعدة في كتابة وتشغيل الأكواد، تنظيم المهام، وحل المسائل التقنية بكفاءة. كيف تحب أن نبدأ؟`
      : `I am **${agentName}**, your AI assistant for coding, task management, and fast technical solutions. How can I assist you today?`;
  }

  // 8. Thanks & appreciation
  const isThanks = /(?:شكرا|شكراً|يعطيك العافية|تسلم|مشكور|thanks|thank you|thx)\b/i.test(clean);
  if (isThanks) {
    return language === 'ar'
      ? `على الرحب والسعة! أنا دائماً في خدمتك كلما احتجتني.`
      : `You're very welcome! I'm always here whenever you need help.`;
  }

  // 9. General fallback with graceful local mode
  return language === 'ar'
    ? `تم استلام طلبك: **"${clean.slice(0, 70)}"**.
أنا متصل وجاهز لمساعدتك؛ تفضل بما تريد وسأقدم لك الحل مباشرة وبكل بساطة.`
    : `Received: **"${clean.slice(0, 70)}"**.
I am ready to help—share what you need and I will assist you directly.`;
}
