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
      ? `أهلاً بك! أنا **${agentName}**. كيف يمكنني مساعدتك؟ تفضل بسؤالك أو طلبك وسأجيبك فوراً.`
      : `Hello! I'm **${agentName}**. How can I help you today? Feel free to ask a question or give me a task.`;
  }

  // 2. Identity & capabilities
  const isIdentity =
    /(?:من أنت|من انت|ما اسمك|ماذا تستطيع|ما هي قدراتك|who are you|what is your name|what can you do)\b/i.test(
      clean
    );

  if (isIdentity) {
    return language === 'ar'
      ? `أنا **${agentName}**، مساعدك الذكي للمساعدة في كتابة وتشغيل الأكواد، تنظيم المهام، وحل المسائل التقنية بكفاءة. كيف تحب أن نبدأ؟`
      : `I am **${agentName}**, your AI assistant for coding, task management, and fast technical solutions. How can I assist you today?`;
  }

  // 3. Thanks & appreciation
  const isThanks = /(?:شكرا|شكراً|يعطيك العافية|تسلم|مشكور|thanks|thank you|thx)\b/i.test(clean);
  if (isThanks) {
    return language === 'ar'
      ? `على الرحب والسعة! أنا دائماً في خدمتك كلما احتجتني.`
      : `You're very welcome! I'm always here whenever you need help.`;
  }

  // 4. General fallback with graceful local mode
  return language === 'ar'
    ? `تم استلام طلبك: **"${clean.slice(0, 70)}"**.
أنا متصل وجاهز لمساعدتك؛ تفضل بما تريد وسأقدم لك الحل مباشرة وبكل بساطة.`
    : `Received: **"${clean.slice(0, 70)}"**.
I am ready to help—share what you need and I will assist you directly.`;
}
