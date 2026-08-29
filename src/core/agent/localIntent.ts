export type LocalIntent =
  | { type: 'task.create'; title: string }
  | { type: 'memory.remember'; content: string; category: 'preference' | 'fact' };

const clean = (value: string) => value.replace(/^[\s:：،,.-]+|[\s.!؟?]+$/g, '').trim();

export function parseLocalIntent(text: string): LocalIntent | null {
  const value = text.trim();
  if (!value) return null;

  const taskMatch = value.match(/^(?:remind me to|remind me|ذكرني(?: أن| ان)?)\s+(.+)$/i);
  if (taskMatch) {
    const title = clean(taskMatch[1]);
    return title ? { type: 'task.create', title } : null;
  }

  const memoryMatch = value.match(/^(?:remember that|remember|تذكر(?: أن| ان)?|تذكّر(?: أن| ان)?)\s+(.+)$/i);
  if (memoryMatch) {
    const content = clean(memoryMatch[1]);
    if (!content) return null;
    const category = /\b(prefer|like|love|أفضل|افضل|أحب|احب)\b/i.test(content) ? 'preference' : 'fact';
    return { type: 'memory.remember', content, category };
  }

  return null;
}
