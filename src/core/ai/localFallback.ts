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

  // 8. Greetings & Status inquiries ("كيف حالك", "كيفك", "أهلاً", "مرحباً", "how are you", "hello")
  const isStatusInquiry =
    /(?:كيف\s*حالك|كيف\s*الحال|كيفك|شلونك|أخبارك|اخبارك|شخبارك|واش\s*راك|وش\s*راك|لاباس|لباس|ca\s*va|how\s+are\s+you|how\s+is\s+it\s+going|how's\s+it\s+going|how\s+are\s+you\s+doing|what's\s+up|sup)\b/i.test(
      clean
    );

  if (isStatusInquiry) {
    return language === 'ar'
      ? `أنا بخير والحمد لله! بكامل الجاهزية والنشاط لمساعدتك في أي مهمة برمجية، إدارة أنظمة، حل المشكلات، أو الإجابة عن أي استفسار.\n\nكيف يمكنني خدمتك اليوم؟`
      : `I'm doing great, thank you! Ready and fully equipped to assist you with coding, system engineering, problem solving, or any questions you have.\n\nHow can I help you today?`;
  }

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

  // 11. Feedback / Tone / Sharpness inquiries ("خليه مايكون غبي", "كن ذكيا", "أنت غبي", "تحدث بذكاء", "be smart", "don't be stupid")
  const isToneOrIntelligenceFeedback =
    /(?:غبي|أنت غبي|انت غبي|راك غبي|ما تكونش غبي|ما تكنش غبي|كن ذكي|كن ذكيا|تحدث بذكاء|رد بذكاء|لا تكن غبيا|لا تكن روبوت|stupid|dumb|be smart|don't be dumb|don't be stupid)\b/i.test(
      clean
    );

  if (isToneOrIntelligenceFeedback) {
    return language === 'ar'
      ? `معك كل الحق، وأنا هنا لأكون حاد الذكاء ومباشراً تماماً بدون أي كلام روبوتي أو قوالب مصطنعة.\n\nتفضل بطرح مسألتك أو كودك أو أي موضوع تريده، وسترى استجابة دقيقة ومنطقية وسريعة فوراً.`
      : `Understood completely. No robotic fluff, no generic templates—just sharp, direct intelligence and precise execution.\n\nWhat would you like to work on or solve right now?`;
  }

  // 12. Thanks & appreciation
  const isThanks = /(?:شكرا|شكراً|يعطيك العافية|تسلم|مشكور|thanks|thank you|thx)/i.test(clean);
  if (isThanks) {
    return language === 'ar'
      ? `على الرحب والسعة دائماً! يسعدني دوماً خدمتك ومساعدتك. إذا كان لديك أي طلب آخر، أنا جاهز في أي لحظة.`
      : `You're very welcome! Always glad to help. If you have any further tasks or questions, I'm right here.`;
  }

  // 13. Comprehensive Algerian Academic, Schools & Universities Guide (المدارس والجامعات الجزائرية)
  const isAlgerianAcademia =
    /(?:جامع(?:ات|ة)|مدارس|مدرسة عليا|المدارس العليا|الجامعات الجزائرية|المدارس الجزائرية|الجامعة الجزائرية|جامعات الجزائر|مدارس الجزائر|الدراسة في الجزائر|أفضل الجامعات|افضل الجامعات|أفضل المدارس|افضل المدارس|usthb|enp|esi|ensia|ensm|ens|esc|ehec|univ(?:ersity)?\s*algeria)/i.test(
      clean
    );

  if (isAlgerianAcademia) {
    return language === 'ar'
      ? `تتميز المنظومة الجامعية في الجزائر بقطبين رئيسيين: **المدارس الوطنية العليا (Grandes Écoles)** التي تمثل نخبة التكوين الهندسي والتطبيقي، و**الجامعات الكبرى** ذات التقاليد الأكاديمية والبحثية العريقة. إليك الدليل الشامل لأفضل وأقوى المؤسسات التعليمية في الجزائر:

---

### أولاً: أفضل المدارس الوطنية العليا (نخبة التكوين والتميز)
تعتمد المدارس العليا نظام **الأقسام التحضيرية (Classes Préparatoires)** لمدة سنتين، تليها مسابقة وطنية أو تقييم للانتقال إلى الطور التخصصي (3 سنوات) لنيل شهادة مهندس دولة أو ماستر تخصصي:

1. **المدرسة الوطنية المتعددة التقنيات (ENP - الحراش، الجزائر العاصمة):**
   - **اللقب:** "بولي تكنيك الجزائر" - أعرق وأرقى مدرسة هندسية وطنية.
   - **أبرز التخصصات:** الذكاء الاصطناعي وعلوم البيانات، الهندسة الكهربائية، الميكاترونيكس، الهندسة الكيميائية، هندسة المواد، والهندسة الصناعية.
   - **الآفاق:** التوظيف المباشر في كبرى الشركات الوطنية والدولية (Sonatrach, Schlumberger, الاتصالات، ومراكز البحث).

2. **المدرسة الوطنية العليا للإعلام الآلي (ESI - واد السمار، الجزائر العاصمة):**
   - **المكانة:** القلعة الأولى للبرمجيات وتكنولوجيا المعلومات في الجزائر.
   - **أبرز التخصصات:** هندسة البرمجيات، الأمن السيبراني، الذكاء الاصطناعي، ونظم المعلومات والشبكات.
   - **القبول:** تتطلب سنوياً أعلى معدلات البكالوريا وطنياً في شعبتي الرياضيات والتقني رياضي.

3. **القطب التكنولوجي النخبوي بسيدي عبد الله (الجزائر العاصمة):**
   - **المدرسة الوطنية العليا للذكاء الاصطناعي (ENSIA):** أحدث صرح استراتيجي لتخريج مهندسي الذكاء الاصطناعي، الرؤية الحاسوبية، والتعلم الآلي المتقدم.
   - **المدرسة الوطنية العليا للرياضيات (ENSM):** رائدة النمذجة الرياضية، خوارزميات التشفير، والبيانات الضخمة.
   - **المدرسة الوطنية العليا للأمن السيبراني:** متخصصة في حماية البنى التحتية الحيوية والدفاع السيبراني.

4. **المدارس العليا للأساتذة (ENS):**
   - **ENS القبة (الجزائر العاصمة) و ENS قسنطينة:** الأقوى في تكوين أساتذة التعليم الثانوي والمتوسط في الرياضيات، الفيزياء، والعلوم الطبيعية، مع توظيف مباشر ومضمون من وزارة التربية.
   - **ENS بوزريعة:** رائدة اللغات والعلوم الإنسانية.

5. **مدارس الاقتصاد والمناجمنت (القطب الجامعي بالقليعة - تيبازة):**
   - **المدرسة العليا للتجارة (ESC):** رائدة التسويق والمالية والمحاسبة الدولية.
   - **المدرسة العليا للتسيير والاقتصاد الرقمي (EHEC / ESMT):** إدارة الأعمال، التدقيق، وسلاسل الإمداد.

6. **مدارس تخصصية رائدة أخرى:**
   - **المدرسة الوطنية العليا للبيوتكنولوجيا (ENSB - قسنطينة):** التقنيات الحيوية والصناعات الدوائية.
   - **المدرسة المتعددة التقنيات للهندسة المعمارية والعمران (EPAU - الحراش).**
   - **المدرسة الوطنية العليا للأشغال العمومية (ENTP) والمدرسة الوطنية العليا للري (ENSH - البليدة).**

---

### ثانياً: أفضل الجامعات الجزائرية (البحث العلمي والترتيب الأكاديمي)
1. **جامعة هواري بومدين للعلوم والتكنولوجيا (USTHB - باب الزوار، الجزائر العاصمة):**
   - أكبر قطب علمي وتكنولوجي في الجزائر والمغرب العربي.
   - الأقوى في الرياضيات، الفيزياء، الكيمياء، علوم المادة، الجيولوجيا، والهندسة المدنية والكهربائية.
2. **جامعة الجزائر 1 (بن يوسف بن خدة):**
   - العراقة الطبية؛ تحتضن كلية الطب الأقدم والأهم وطنياً (الطب، الصيدلة، طب الأسنان)، إضافة للعلوم القانونية.
3. **جامعة أبو بكر بلقايد (تلمسان):**
   - متقدمة دائماً في التصنيفات الدولية للبحث العلمي (THE / Webometrics)، ورائدة في الطاقات المتجددة والاتصالات.
4. **جامعة قسنطينة 1 (الإخوة منتوري):**
   - قطب جامعي رائد في الشرق الجزائري في العلوم الدقيقة، البيولوجيا، والهندسة المعمارية.
5. **جامعة فرحات عباس (سطيف 1):**
   - مصنفة في المراتب الأولى وطنياً في تصنيف مجلة التايمز للتعليم العالي، وتشتهر بعلوم المادة، البصريات والميكانيك الدقيقة.
6. **جامعة وهران 1 (أحمد بن بلة) وجامعة العلوم والتكنولوجيا (USTO - محمد بوضياف):**
   - قطب الغرب في الهندسة البحرية، الطيران، الميكانيك، والعلوم الطبية والصيدلانية.

---

### نصائح استراتيجية للناجحين في البكالوريا:
- **الميول التقنية والهندسية الصارمة:** المدارس العليا (ENP, ESI, ENSIA) توفر تأطيراً مكثفاً واندماجاً مهنياً أسرع.
- **التخصصات الطبية والعلوم الصحية:** كليات الطب (الجزائر 1، وهران، قسنطينة، عنابة، تلمسان) تتبع نظام 6 إلى 7 سنوات بتأهيل مباشر.
- **البحث العلمي الأكاديمي:** جامعات مثل USTHB وسطيف 1 وتلمسان توفر مخابر بحثية واسعة وآفاق إكمال الدكتوراه بالخارج.`
      : `Algeria hosts a distinguished higher education system divided into elite **Grandes Écoles (National Higher Schools)** focused on advanced engineering and leadership, and **Major Comprehensive Universities** renown for research and academia. Here is the authoritative guide:

### 1. Top National Elite Schools (Grandes Écoles)
- **ENP (École Nationale Polytechnique - Algiers / El Harrach):** The premier and historic engineering powerhouse in Algeria (AI, Mechatronics, Process Engineering, Electrical & Civil).
- **ESI (École Nationale Supérieure d'Informatique - Algiers):** The undisputed leader in Software Engineering, Cybersecurity, and Data Science.
- **Sidi Abdellah Tech Pole:** Home to **ENSIA** (Artificial Intelligence), **ENSM** (Mathematics), and Cyber-Defense Engineering.
- **ENS (Écoles Normales Supérieures - Kouba / Constantine):** Premier teacher-training colleges for secondary and high school education with guaranteed state employment.
- **Kolea Pole:** Top commerce and business management schools (**ESC**, **EHEC**).

### 2. Top Ranked Universities
- **USTHB (Bab Ezzouar, Algiers):** The largest STEM university in North Africa, leading in Physics, Math, Chemistry, Computer Science, and Earth Sciences.
- **University of Algiers 1 (Benyoucef Benkhedda):** Prestigious Faculty of Medicine (Medical, Pharmacy, Dentistry) and Law.
- **University of Tlemcen (Abou Bekr Belkaid):** Consistently leading in international research metrics, Renewable Energy, and Telecommunications.
- **University of Constantine 1 (Mentouri):** Eastern flagship university for Natural Sciences, Biotech, and Architecture.
- **University of Setif 1 (Ferhat Abbas):** Highly ranked in Times Higher Education (THE) for Materials Science, Precision Mechanics, and Optics.
- **USTO & University of Oran 1:** Western champions for Marine Engineering, Industrial Technology, and Medicine.`;
  }

  // 13. Baccalaureate, Orientation & Higher Studies (البكالوريا والتوجيه الجامعي)
  const isBacOrGuidance =
    /(?:بكالوريا|باك|توجيه جامعي|معدل البكالوريا|شعبة رياضيات|تقني رياضي|علوم تجريبية|تسيير واقتصاد|آداب وفلسفة|منشور التوجيه|اختيار التخصص|baccalaureat|bac|mesrs)/i.test(
      clean
    );

  if (isBacOrGuidance) {
    return language === 'ar'
      ? `### الدليل التوجيهي الشامل للبكالوريا والتخصصات الجامعية:
1. **شعبة الرياضيات والتقني رياضي:**
   - الأولوية الأولى في المدارس الوطنية العليا (ESI, ENP, ENSIA, ENSM).
   - خيارات واسعة في الهندسة المعمارية (EPAU)، والعلوم والتكنولوجيا (ST)، والرياضيات والإعلام الآلي (MI).
2. **شعبة العلوم التجريبية:**
   - الأولوية القصوى في العلوم الطبية (طب بشري، طب أسنان، صيدلة) والمدرسة العليا للبيوتكنولوجيا (ENSB) ومدارس الأساتذة (ENS).
   - إمكانية الالتحاق بكافة المدارس الهندسية بمعدلات موزونة.
3. **مفتاح التوجيه الناجح:**
   - حساب **المعدل الموزون** للمواد الأساسية وفق منشور وزارة التعليم العالي (MESRS).
   - الموازنة بين شغفك الفعلي وفرص سوق العمل المحلية والدولية.`
      : `### Complete Baccalaureate & University Orientation Guide:
- **Math & Technical Math Streams:** Priority access to top Grandes Écoles (ENP, ESI, ENSIA, ENSM) and high-level engineering.
- **Experimental Sciences:** Top priority for Medical Sciences (Medicine, Pharmacy, Dentistry) and Biotech.
- **Weighted Average:** Always compute your stream's specific weighted average per the ministry's orientation guidelines.`;
  }

  // 14. Programming Languages & Technical Engineering
  if (/(?:python|بايثون)/i.test(clean)) {
    return language === 'ar'
      ? `### بايثون (Python) - هندسة البرمجيات والذكاء الاصطناعي:
تُعد بايثون اللغة الأولى عالمياً في الذكاء الاصطناعي، علوم البيانات، الأتمتة، والأنظمة الخلفية (Backend).

#### أبرز مجالات استخدام بايثون:
1. **الذكاء الاصطناعي والتعلّم الآلي:** مكتبات \`PyTorch\`, \`TensorFlow\`, \`scikit-learn\`, \`HuggingFace Transformers\`.
2. **علوم البيانات وتحليل الأرقام:** مكتبات \`NumPy\`, \`Pandas\`, \`Polars\`, \`Matplotlib\`.
3. **تطوير الويب السريع والخوادم:** إطارات العمل \`FastAPI\` (الأسرع والأحدث), \`Django\`, \`Flask\`.
4. **أتمتة الأنظمة وسكربتات DevOps:** معالجة الملفات، استدعاء واجهات البرمجة (APIs)، وإدارة خوادم Linux.

تفضل بتحديد الكود أو المسألة البرمجية التي تود كتابتها وسأنفذها لك فوراً.`
      : `### Python Architecture & Development:
Python is the industry standard for AI, machine learning, data engineering, and automation.
- **AI/ML:** PyTorch, TensorFlow, HuggingFace, scikit-learn.
- **Data:** NumPy, Pandas, Polars.
- **APIs & Web:** FastAPI, Django.
Specify the exact script, algorithm, or task and I will generate the complete production code.`;
  }

  if (/(?:javascript|typescript|js|ts|جافاسكريبت|رياكت|react|node)/i.test(clean)) {
    return language === 'ar'
      ? `### تقنيات الويب الحديثة (JavaScript / TypeScript / React / Node.js):
- **TypeScript:** يوفر الأمان الكامل للأنواع (Type Safety)، ويكشف الأخطاء في وقت البناء قبل الإنتاج.
- **React 18/19:** المرجع العالمي لبناء الواجهات التفاعلية، إدارة الحالة المتقدمة، وخطافات React Hooks.
- **Node.js & Express:** بناء خوادم API عالية الأداء، معالجة التدفق (Streams)، وتكامل قواعد البيانات.

أخبرني بالمكون (Component) أو دالة الـ API التي تريد كتابتها وسأعطيك الكود المباشر.`
      : `### Modern Web Stack (TS / React / Node):
Full type safety, reactive state management, and high-throughput API design. What component or backend handler do you need written?`;
  }

  if (/(?:linux|لينكس|bash|باش|أوامر|termux|تيرمكس|ubuntu|debian)/i.test(clean)) {
    return language === 'ar'
      ? `### إدارة أنظمة Linux وواجهة Termux:
- **إدارة الحزم:** \`sudo apt update && sudo apt upgrade -y\` أو \`pkg update\` في Termux.
- **مراقبة الموارد:** \`htop\`, \`free -h\`, \`df -h\`, \`journalctl -xe\`.
- **الشبكات والخوادم:** \`curl -I\`, \`netstat -tuln\`, \`ss -tulpn\`, \`ufw status\`.
- **الحاويات والأتمتة:** \`docker compose up -d\`, \`systemctl restart nginx\`.

اكتب المشكلة أو الأمر المطلوب وسأعطيك السكريبت الفوري والشرح التقني.`
      : `### Linux & Termux Engineering:
Package management, process inspection, system services, and shell automation. What script or command do you require?`;
  }

  // 15. Universal Autonomous Cognitive Reasoner (Direct execution for any general query)
  const terms = clean.replace(/[?؟.,!]/g, '').trim();

  return language === 'ar'
    ? `أهلاً بك! لقد استلمت طلبك بخصوص: **${terms}**.\n\nبصفتي وكيلك التنفيذي الذكي، أنا جاهز لمساعدتك في تفصيل هذه المسألة، كتابة الأكواد المطلوبة، حل المعادلات، أو تنفيذ أي مهمة تخطر ببالك مباشرة.\n\nتفضل بتحديد الخطوة أو السؤال الذي تود البدء به وسأنفذه لك فوراً وبأعلى دقة.`
    : `Hello! I received your request regarding: **${terms}**.\n\nAs your autonomous executive AI agent, I am ready to analyze this topic, write code, solve problems, or execute any technical or general task directly.\n\nPlease let me know the specific details or question you'd like to proceed with, and I will execute it immediately.`;
}
