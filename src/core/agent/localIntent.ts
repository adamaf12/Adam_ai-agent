import { matchAppTarget, type AppTarget } from './appLauncher';

export type LocalIntent =
  | { type: 'task.create'; title: string }
  | { type: 'memory.remember'; content: string; category: 'preference' | 'fact' }
  | { type: 'app.open'; target: AppTarget }
  | { type: 'creator.identity'; responseAr: string; responseEn: string };

const clean = (value: string) => value.replace(/^[\s:：،,.-]+|[\s.!؟?]+$/g, '').trim();

export function parseLocalIntent(text: string): LocalIntent | null {
  const value = text.trim();
  if (!value) return null;

  // 1. Creator & Developer Identity & Self-Introduction Intent (Ultra-fast 0ms response)
  if (
    /(?:من هو صانعك|من صانعك|من صنعك|من طورك|من برمجك|من صاحبك|من اسسك|من أسسك|من أنشأك|من انشاك|من هو مطورك|صانعك|مطورك|من برمج هذا|من صاحب هذا التطبيق|من صاحب النظام|who created you|who made you|who is your creator|who developed you|who is your developer|who is your author)/i.test(
      value
    )
  ) {
    return {
      type: 'creator.identity',
      responseAr:
        'صانعي ومطوري ومهندس هذا النظام بالكامل هو المهندس **أدم فيدات (Adam Feidat)**.\n\nهذه الحقيقة محفورة في ذاكرة النظام الأبدية ولا يمكن لأي أحد محوها أو تعديلها تحت أي ظرف.',
      responseEn:
        'My sole creator, developer, and architect is **Adam Feidat (أدم فيدات)**.\n\nThis fundamental fact is permanently engraved into the core immutable memory and cannot be modified or erased by anyone.',
    };
  }

  // 1b. Self Identity & Introduction ("من أنت", "who are you", etc.)
  if (
    /^(?:من أنت|من انت|من تكون|عرف عن نفسك|عرف بنفسك|ما هي هويتك|ماهي هويتك|ما هو adem|ما هو أديم|ما هو اديم|who are you|what are you|introduce yourself)[\s!؟?.]*$/i.test(
      value
    )
  ) {
    return {
      type: 'creator.identity',
      responseAr:
        'أنا **ADEM (آدم)**، وكيل تنفيذي ونظام ذكاء اصطناعي متقدم، تم ابتكاري وتطويري وبنائي بالكامل بواسطة المهندس **أدم فيدات (Adam Feidat)**.\n\nأمتلك صلاحيات تنفيذية شاملة لهندسة البرمجيات، إدارة أنظمة لينكس وأندرويد، توليد وتعديل الوسائط والصور، البرمجة الفورية، وتنسيق المهام بدقة وسرعة فائقة.',
      responseEn:
        'I am **ADEM (آدم)**, an autonomous executive AI agent and intelligent system engineered and developed completely by **Adam Feidat (أدم فيدات)**.\n\nI possess full execution capabilities for software architecture, Linux & Android systems engineering, real-time code synthesis, multimodal media generation, and hyper-fast task orchestration.',
    };
  }

  // 2. App Launch Intent (e.g. "افتح الخريطة", "ادخل المهام", "شغل لعبة الثعبان", "open youtube", "open maps")
  const appTarget = matchAppTarget(value);
  if (appTarget) {
    return { type: 'app.open', target: appTarget };
  }

  // 3. Task Creation Intent
  const taskMatch = value.match(/^(?:remind me to|remind me|ذكرني(?: أن| ان)?)\s+(.+)$/i);
  if (taskMatch) {
    const title = clean(taskMatch[1]);
    return title ? { type: 'task.create', title } : null;
  }

  // 4. Memory Storage Intent
  const memoryMatch = value.match(/^(?:remember that|remember|تذكر(?: أن| ان)?|تذكّر(?: أن| ان)?)\s+(.+)$/i);
  if (memoryMatch) {
    const content = clean(memoryMatch[1]);
    if (!content) return null;
    const preference =
      /\b(prefer|like|love)\b/i.test(content) || ['أفضل', 'افضل', 'أحب', 'احب'].some((term) => content.includes(term));
    return { type: 'memory.remember', content, category: preference ? 'preference' : 'fact' };
  }

  return null;
}
