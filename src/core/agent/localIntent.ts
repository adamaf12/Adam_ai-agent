import { matchAppTarget, type AppTarget } from './appLauncher';

export type LocalIntent =
  | { type: 'task.create'; title: string }
  | { type: 'memory.remember'; content: string; category: 'preference' | 'fact' }
  | { type: 'app.open'; target: AppTarget };

const clean = (value: string) => value.replace(/^[\s:：،,.-]+|[\s.!؟?]+$/g, '').trim();

export function parseLocalIntent(text: string): LocalIntent | null {
  const value = text.trim();
  if (!value) return null;

  // 1. App Launch Intent (e.g. "افتح الخريطة", "ادخل المهام", "شغل لعبة الثعبان", "open youtube", "open maps")
  const appTarget = matchAppTarget(value);
  if (appTarget) {
    return { type: 'app.open', target: appTarget };
  }

  const taskMatch = value.match(/^(?:remind me to|remind me|ذكرني(?: أن| ان)?)\s+(.+)$/i);
  if (taskMatch) {
    const title = clean(taskMatch[1]);
    return title ? { type: 'task.create', title } : null;
  }

  const memoryMatch = value.match(/^(?:remember that|remember|تذكر(?: أن| ان)?|تذكّر(?: أن| ان)?)\s+(.+)$/i);
  if (memoryMatch) {
    const content = clean(memoryMatch[1]);
    if (!content) return null;
    const preference = /\b(prefer|like|love)\b/i.test(content) || ['أفضل', 'افضل', 'أحب', 'احب'].some((term) => content.includes(term));
    return { type: 'memory.remember', content, category: preference ? 'preference' : 'fact' };
  }

  return null;
}

