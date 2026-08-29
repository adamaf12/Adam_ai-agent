import { ModelGateway, ModelRequest } from './modelGateway';
import { ProviderRouter } from './modelProviders';
import { ModelCapability } from './modelSwarm';

export function createAgentModelGateway() {
  const providers = new ProviderRouter();
  return {
    gateway: new ModelGateway((model, request) => providers.invoke(model, request)),
    providers,
  };
}

export function inferCapabilities(prompt: string): ModelCapability[] {
  const text = prompt.toLowerCase();
  const capabilities: ModelCapability[] = ['general'];
  if (/code|coding|program|debug|typescript|javascript|python|github/.test(text)) capabilities.push('coding');
  if (/math|equation|calculate|حل|رياضيات|معادلة/.test(text)) capabilities.push('math');
  if (/reason|analy|architecture|plan|استنتج|حلل|خطة/.test(text)) capabilities.push('reasoning');
  if (/image|photo|vision|صورة|صور/.test(text)) capabilities.push('vision');
  if (/news|today|latest|current|أخبار|اليوم|آخر/.test(text)) capabilities.push('search');
  if (/arabic|عربي|العربية/.test(text)) capabilities.push('arabic');
  return [...new Set(capabilities)];
}

export async function runModelSwarm(gateway: ModelGateway, prompt: string, system?: string) {
  const capabilities = inferCapabilities(prompt);
  return gateway.complete(
    { prompt, capabilities, maxModels: capabilities.length > 1 ? 3 : 1, preferSpeed: prompt.length < 120 },
    { prompt, system, temperature: 0.35, maxTokens: 4096 },
  );
}
