import type { ModelCapability } from './types';
const aliases: Record<string, ModelCapability> = { analysis: 'reasoning', math: 'reasoning', code: 'coding', programming: 'coding', web: 'research', image: 'vision', images: 'vision', arabic: 'arabic', speed: 'fast' };
export function normalizeCapabilities(values: readonly string[]): ModelCapability[] {
  return [...new Set(values.map((value) => aliases[value.toLowerCase()] ?? value.toLowerCase()).filter((value): value is ModelCapability => ['reasoning','coding','research','vision','fast','arabic'].includes(value)))];
}
export function inferCapabilities(mission: string): ModelCapability[] {
  const text = mission.toLowerCase();
  const found: string[] = [];
  if (/code|program|debug|software|android|ios|typescript|javascript|برمج|كود|برمجة|تطبيق تفاعلي|آلة حاسبة|لعبة تفاعلية/.test(text)) found.push('coding');
  if (/research|search|find|source|study|analy[sz]e|ابحث|بحث|معلومات/.test(text)) found.push('research');
  if (/image|photo|picture|vision|wallpaper|draw|illustration|صورة|صوره|صور|ارسم|رسمة|خلفية|لقطة/.test(text)) found.push('vision');
  if (/arabic|العربية|عربي|الجزائر|فصحى/.test(text)) found.push('arabic');
  if (/reason|complex|architecture|plan|strategy|خطة|تحليل|استراتيجية/.test(text)) found.push('reasoning');
  return normalizeCapabilities(found.length ? found : ['fast']);
}
