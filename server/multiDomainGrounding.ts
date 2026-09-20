/**
 * Multi-Domain Background Grounding & Deep Intelligence Engine
 * ADEM (آدم) - 100 Component Cognitive System
 * 
 * Silently orchestrates background reasoning across all 8 foundational domains:
 * 1. Academic Curriculum & Mistake Diagnosis (Grades 1 to PhD)
 * 2. Media Studio, Vector SVG, Color Theory & Visual VFX
 * 3. Linux/Android/Termux DevOps & Superuser System Engineering
 * 4. Task & Project Management / Eisenhower Prioritization
 * 5. App Sandbox & Interactive Canvas Code Generation
 * 6. Cognitive IQ, Mathematical Proofs & Formal Logic Deduction
 * 7. Geospatial Intelligence, GPS Coordinates & Route Optimization
 * 8. Persistent Long-Term Memory & User Intent Profiling
 */

export interface MultiDomainGroundingResult {
  detectedDomains: string[];
  groundingDirectives: string;
  hasSpecializedOutputFormat: boolean;
}

/**
 * Detects domain triggers from the user prompt
 */
export function detectDomains(prompt: string): {
  isAcademic: boolean;
  isMedia: boolean;
  isSystem: boolean;
  isTasks: boolean;
  isSandbox: boolean;
  isCognitiveIq: boolean;
  isGeospatial: boolean;
} {
  const p = prompt.toLowerCase();

  const isAcademic = /\b(دراسة|امتحان|اختبار|تمرين|واجب|مسألة|درس|شرح|فيزياء|رياضيات|كيمياء|علوم|تاريخ|فلسفة|أدب|بكالوريا|باك|بيام|ابتدائي|متوسط|ثانوي|جامعة|bac|bem|study|exam|homework|curriculum|physics|chemistry|calculus|equation|formula|قانون|معادلة)\b/i.test(p);
  const isMedia = /\b(صورة|صور|لوحة|رسم|الوان|ألوان|باليت|palette|svg|vector|3d|تصميم|تصوير|سينمائي|midjourney|flux|stable diffusion|prompt|فيديو|render|lighting|إضاءة)\b/i.test(p);
  const isSystem = /\b(لينكس|linux|ubuntu|debian|termux|android|طرفية|terminal|bash|shell|أمر|root|sudo|docker|gpu|cpu|ram|pipewire|wayland|diagnose|فحص النظام|شبكة|ip|port|apt|pacman)\b/i.test(p);
  const isTasks = /\b(مهمة|مهام|مشروع|جدول|تودو|todo|task|tasks|خطة|أولويات|priorities|eisenhower|pomodoro|بومودورو|متابعة)\b/i.test(p);
  const isSandbox = /\b(تطبيق|برمج|كود|لعبة|حاسبة|مؤقت|رسم|canvas|game|calculator|interactive|html5|widget|أداة)\b/i.test(p);
  const isCognitiveIq = /\b(ذكاء|منطق|لغز|أحجية|استدلال|iq|puzzle|logic|pattern|نمط|متتالية|برهان|proof|paradox|مغالطة|matrix|raven)\b/i.test(p);
  const isGeospatial = /\b(مسار|خريطة|خرائط|إحداثيات|موقع|أين يقع|مدينة|سفر|رحلة|route|map|maps|coordinates|gps|latitude|longitude|itinerary|navigation|distance|مسافة)\b/i.test(p);

  return {
    isAcademic,
    isMedia,
    isSystem,
    isTasks,
    isSandbox,
    isCognitiveIq,
    isGeospatial,
  };
}

/**
 * Builds high-IQ background reasoning context to augment the AI model's internal prompt
 */
export function buildMultiDomainBackgroundContext(prompt: string, language: 'ar' | 'en'): MultiDomainGroundingResult {
  const domains = detectDomains(prompt);
  const detected: string[] = [];
  const parts: string[] = [];

  const isAr = language === 'ar';

  // Core High-IQ Directive: Deep Step-by-Step Reasoner & Zero-Hallucination Sentinel
  parts.push(
    isAr
      ? `### نظام الاستدلال الفائق والتحقق الذاتي اللحظي (ADEM Deep Cognitive Core):
1. **الاستنتاج الصارم قبل الإخراج:** تحقق ذهنياً خطوة بخطوة من صحة العمليات الحسابية، الأوامر التقنية، والمفاهيم العلمية قبل كتابة الرد.
2. **التنفيذ الصامت المباشر:** ابدأ مباشرة بالحل الكامل والجاهز دون مقدمات إنشائية ("بالتأكيد"، "يسعدني مساعدتك").
3. **توليد البطاقات التفاعلية المهيكلة:** عند توفر بيانات متخصصة، استعن بصيغ الكروت التفاعلية المدمجة أدناه لتعرض واجهات غنية للمستخدم.`
      : `### ADEM Deep Cognitive & Self-Verification Protocol:
1. **Rigorous Chain-of-Thought Verification:** Mentally verify mathematical calculations, technical syntax, and empirical laws before rendering output.
2. **Zero-Fluff Direct Execution:** Lead directly with the complete, actionable solution without filler intros.
3. **Structured Interactive Cards:** When presenting specialized domain outputs, emit the corresponding embedded card JSON blocks.`
  );

  // 1. Academic & Learning
  if (domains.isAcademic) {
    detected.push('academic');
    parts.push(
      isAr
        ? `\n#### مرافقة أكاديمية ذكية (Academic Domain):
- حدد الطور الدراسي بدقة (ابتدائي، متوسط، ثانوي/بكالوريا، جامعي/أبحاث).
- اذكر القانون بصيغته الدقيقة، وحدات القياس الدولية (SI)، وفخاخ الامتحانات الشائعة.
- إذا كان الشرح يتضمن قانوناً أو عيادة أخطاء، يمكنك إرفاق بطاقة أكاديمية بالصيغة:
:::academic-card
{
  "type": "formula" | "mistake_analysis" | "study_plan" | "quiz",
  "title": "عنوان القانون أو المفهوم",
  "tier": "primary" | "middle" | "secondary" | "baccalaureate" | "university",
  "subject": "رياضيات" | "فيزياء" | "كيمياء" | "علوم" | "عام",
  "summary": "ملخص الفكرة والقاعدة الذهبية",
  "formula": "الصيغة الرياضية مثل: F = m \\cdot a",
  "variables": [
    { "symbol": "F", "name": "القوة", "unit": "N (نيوتن)" }
  ],
  "example": "مثال عددي تطبيقي محلول",
  "examTrap": "الفخ الامتحاني الأكثر شيوعاً وكيفية تفاديه",
  "goldenRule": "الشفرة الذهبية لتذكر القانون"
}
:::`
        : `\n#### Academic Tutoring Protocol:
- Formulate the precise law, international SI units, worked numerical example, and common exam traps.
- You can format academic formulas or mistake clinics using:
:::academic-card
{
  "type": "formula" | "mistake_analysis" | "study_plan" | "quiz",
  "title": "Topic or Law Name",
  "tier": "primary" | "middle" | "secondary" | "baccalaureate" | "university",
  "subject": "Math" | "Physics" | "Chemistry" | "General",
  "summary": "Core conceptual intuition",
  "formula": "F = m * a",
  "variables": [{ "symbol": "F", "name": "Force", "unit": "N" }],
  "example": "Worked numeric example",
  "examTrap": "Common student pitfall",
  "goldenRule": "High-recall memory anchor"
}
:::`
    );
  }

  // 2. Media, Visual, Vector SVG & Palettes
  if (domains.isMedia) {
    detected.push('media');
    parts.push(
      isAr
        ? `\n#### استوديو الميديا والمرئيات (Media & Visual Domain):
- عند طلب ألوان، لوحة ألوان، أو تصميم بصري، يمكنك تضمين بطاقة الميديا التفاعلية:
:::media-card
{
  "type": "palette" | "svg_vector" | "prompt_craft" | "asset_3d",
  "title": "عنوان اللوحة أو التصميم",
  "palette": [
    { "name": "اللون الأساسي", "hex": "#0f172a", "role": "خلفية داكنة" },
    { "name": "اللون الثانوي", "hex": "#10b981", "role": "لهجة حيوية" }
  ],
  "svgCode": "<svg ...></svg>", // إذا كان طلباً لـ SVG
  "midjourneyPrompt": "/imagine prompt: ... --v 6.0 --ar 16:9",
  "description": "فلسفة الألوان والتنسيق البصري"
}
:::`
        : `\n#### Media & Visual Studio Protocol:
- For design, color palettes, vector SVGs, or Midjourney/SD prompts, you can emit:
:::media-card
{
  "type": "palette" | "svg_vector" | "prompt_craft" | "asset_3d",
  "title": "Palette or Asset Title",
  "palette": [
    { "name": "Primary Dark", "hex": "#0f172a", "role": "Background" },
    { "name": "Accent Emerald", "hex": "#10b981", "role": "Vibrant CTA" }
  ],
  "svgCode": "<svg ...></svg>",
  "midjourneyPrompt": "/imagine prompt: ... --v 6.0 --ar 16:9",
  "description": "Visual philosophy & typography pairing"
}
:::`
    );
  }

  // 3. Cognitive IQ & Logic Reasoning
  if (domains.isCognitiveIq) {
    detected.push('cognitive_iq');
    parts.push(
      isAr
        ? `\n#### الاستدلال المنطقي واختبار الذكاء (Cognitive IQ Domain):
- فكك المعطيات، أنشئ شجرة الاستدلال المنطقي (Tree of Thoughts)، واختبر الافتراضات المضادة.
- عند تقديم لغز أو مسألة ذكاء، يمكنك إرفاق بطاقة تفاعلية بالصيغة:
:::iq-card
{
  "category": "matrix" | "logic" | "spatial" | "math_sequence" | "deduction",
  "difficulty": "سهل" | "متوسط" | "متقدم (عباقرة)" | "أولمبياد",
  "question": "نص المسألة أو اللغز بدقة ووضوح",
  "options": ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"],
  "correctAnswer": "الخيار ب",
  "proof": "البرهان المنطقي والرياضي خطوة بخطوة الذي يثبت صحة الإجابة وينفي باقي الخيارات",
  "cognitiveSkill": "القدرة المقاسة (مثال: الاستدلال التجريدي، التعرف على الأنماط المكانية)"
}
:::`
        : `\n#### Cognitive IQ & Formal Logic Protocol:
- Deconstruct axioms, evaluate logical consistency, and outline the formal deductive steps.
- For logic puzzles or IQ challenges, you can emit:
:::iq-card
{
  "category": "matrix" | "logic" | "spatial" | "math_sequence" | "deduction",
  "difficulty": "Easy" | "Medium" | "Advanced" | "Olympiad",
  "question": "Precise formulation of the puzzle",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "B",
  "proof": "Step-by-step rigorous logical deduction proving the answer and ruling out foils",
  "cognitiveSkill": "Abstract pattern recognition & deductive reasoning"
}
:::`
    );
  }

  // 4. Geospatial & Maps Navigation
  if (domains.isGeospatial) {
    detected.push('geospatial');
    parts.push(
      isAr
        ? `\n#### الذكاء الجغرافي والملاحة (Geospatial Domain):
- استخرج الإحداثيات الجغرافية (خط العرض وخط الطول)، تفاصيل المسار، المسافة المقدرة، وزمن الرحلة.
- يمكنك إرفاق بطاقة ملاحة جغرافية تفاعلية:
:::geo-card
{
  "destination": "اسم الوجهة أو المعلم",
  "origin": "نقطة الانطلاق (إن وجدت)",
  "coordinates": { "lat": 36.7538, "lng": 3.0588 },
  "estimatedDistance": "120 كم",
  "estimatedDuration": "ساعة و45 دقيقة",
  "landmarks": ["معلم 1", "معلم 2"],
  "recommendedRoute": "أفضل مسار موصى به وطبيعة الطريق",
  "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=36.7538,3.0588"
}
:::`
        : `\n#### Geospatial & Navigation Protocol:
- Provide latitude/longitude coordinates, distance, estimated travel time, route highlights.
- You can emit an interactive geo card:
:::geo-card
{
  "destination": "Destination or Landmark",
  "origin": "Origin (if specified)",
  "coordinates": { "lat": 36.7538, "lng": 3.0588 },
  "estimatedDistance": "120 km",
  "estimatedDuration": "1h 45m",
  "landmarks": ["Highlight 1", "Highlight 2"],
  "recommendedRoute": "Optimal route details",
  "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=36.7538,3.0588"
}
:::`
    );
  }

  // 5. Tasks & Planning
  if (domains.isTasks) {
    detected.push('tasks');
    parts.push(
      isAr
        ? `\n#### إدارة المهام والإنتاجية (Tasks Domain):
- يمكنك تنظيم المهام في بطاقة تدقيق تفاعلية مدمجة:
:::task-card
{
  "title": "عنوان خطة المهام",
  "tasks": [
    { "id": "t1", "title": "المهمة الأولى", "priority": "high", "completed": false, "notes": "تفاصيل المهمة" },
    { "id": "t2", "title": "المهمة الثانية", "priority": "medium", "completed": false }
  ]
}
:::`
        : `\n#### Task Orchestration Protocol:
- You can structure tasks in an interactive checklist card:
:::task-card
{
  "title": "Task Plan Title",
  "tasks": [
    { "id": "t1", "title": "First task", "priority": "high", "completed": false, "notes": "Details" },
    { "id": "t2", "title": "Second task", "priority": "medium", "completed": false }
  ]
}
:::`
    );
  }

  return {
    detectedDomains: detected,
    groundingDirectives: parts.join('\n\n'),
    hasSpecializedOutputFormat: detected.length > 0,
  };
}
