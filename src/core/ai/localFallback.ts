import type { Language, Message } from '../domain';

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

  // 1. Greetings
  const isGreeting =
    /^(?:أهلا|اهلا|اعلا|أهلاً|مرحبا|مرحباً|السلام عليكم|سلام|صباح الخير|مساء الخير|يا هلا|هلا|hello|hi|hey|greetings|good morning|good evening)\b/i.test(
      clean
    );

  if (isGreeting) {
    return language === 'ar'
      ? `أهلاً وسهلاً بك! أنا **${agentName}**، مساعدك الشخصي الذكي. أنا متصل وجاهز لمساعدتك في أي وقت في تنظيم مهامك، كتابة الأفكار، أو الإجابة عن أي استفسار. كيف يمكنني خدمتك الآن؟`
      : `Hello! I am **${agentName}**, your personal AI assistant. I am ready to help you with tasks, writing, organizing, or answering any questions. How can I assist you today?`;
  }

  // 2. Identity & capabilities
  const isIdentity =
    /(?:من أنت|من انت|ما اسمك|ماذا تستطيع|ما هي قدراتك|who are you|what is your name|what can you do)\b/i.test(
      clean
    );

  if (isIdentity) {
    return language === 'ar'
      ? `أنا **${agentName}** — نظام ذكاء اصطناعي ومساعد شخصي متكامل. أمتلك:
- 🧠 **ذاكرة مستمرة**: أحفظ تفضيلاتك وتوجيهاتك تلقائياً عبر الجلسات.
- 📋 **إدارة المهام الذكية**: جدولة وتنظيم مهامك وأولوياتك.
- 🎨 **استوديو الصور والفيديو**: تصميم وتوليد صور سينمائية عالية الدقة.
- 🌐 **البحث والمعرفة**: تزويدك بأدق المعلومات والتحليلات.

ما الذي ترغب بالبدء به اليوم؟`
      : `I am **${agentName}** — your comprehensive personal AI intelligence workspace.
Features include:
- 🧠 **Infinite Memory**: Retains your preferences across sessions.
- 📋 **Smart Task Management**: Organizes schedules and priorities.
- 🎨 **Media Studio**: Generates 8K cinematic visuals and videos.
- 🌐 **Deep Knowledge**: Instant search and structured answers.

What would you like to explore?`;
  }

  // 3. Thanks & appreciation
  const isThanks = /(?:شكرا|شكراً|يعطيك العافية|تسلم|مشكور|thanks|thank you|thx)\b/i.test(clean);
  if (isThanks) {
    return language === 'ar'
      ? `على الرحب والسعة دائماً! أنا هنا لمساعدتك متى احتجتني. يسعدني تقديم يد العون في أي مهمة أو سؤال.`
      : `You're very welcome! I'm always here to assist you whenever you need.`;
  }

  // 4. General fallback with graceful local mode
  return language === 'ar'
    ? `تم استلام رسالتك: **"${clean.slice(0, 80)}"**.
يعمل ${agentName} الآن بوضع المعالجة السريعة. يمكنك استخدام أقسام التطبيق المختلفة (المهام، الذاكرة، استوديو الوسائط) من الشريط السفلي، أو إعادة إرسال السؤال وسأجيبك بأفضل ما لدي.`
    : `Received: **"${clean.slice(0, 80)}"**.
${agentName} is currently operating in fast responsive mode. You can manage tasks, explore memories, or use the Media Studio from the bottom navigation.`;
}
