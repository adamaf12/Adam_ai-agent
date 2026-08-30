import type { ModelCapability } from './types';
const aliases: Record<string, ModelCapability> = { analysis: 'reasoning', math: 'reasoning', code: 'coding', programming: 'coding', web: 'research', image: 'vision', images: 'vision', arabic: 'arabic', speed: 'fast' };
export function normalizeCapabilities(values: readonly string[]): ModelCapability[] {
  return [...new Set(values.map((value) => aliases[value.toLowerCase()] ?? value.toLowerCase()).filter((value): value is ModelCapability => ['reasoning','coding','research','vision','fast','arabic'].includes(value)))];
}
export function inferCapabilities(mission: string): ModelCapability[] {
  const text = mission.toLowerCase();
  const found: string[] = [];
  if (/code|program|debug|software|android|ios|typescript|javascript/.test(text)) found.push('coding');
  if (/research|search|find|source|study|analy[sz]e/.test(text)) found.push('research');
  if (/image|photo|vision|design|screenshot/.test(text)) found.push('vision');
  if (/arabic|العربية|عربي|الجزائر/.test(text)) found.push('arabic');
  if (/reason|complex|architecture|plan|strategy/.test(text)) found.push('reasoning');
  return normalizeCapabilities(found.length ? found : ['fast']);
}
