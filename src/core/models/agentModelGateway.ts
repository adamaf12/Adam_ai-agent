import { ModelGateway } from './modelGateway';
import { FetchProviderAdapter, ProviderRouter } from './modelProviders';
import { ModelCapability, modelRegistry } from './modelSwarm';

export function createAgentModelGateway(fetchImpl: typeof fetch = fetch) {
  const providers = new ProviderRouter();
  const fetchAdapter = new FetchProviderAdapter(fetchImpl);
  providers.register('huggingface', fetchAdapter);
  providers.register('openai-compatible', fetchAdapter);
  providers.register('local', fetchAdapter);
  providers.register('pollinations', fetchAdapter);
  return { gateway: new ModelGateway((model, request) => providers.invoke(model, request)), providers };
}

export function inferCapabilities(prompt: string): ModelCapability[] {
  const text = prompt.toLowerCase();
  const capabilities: ModelCapability[] = ['general'];
  if (/code|coding|program|debug|typescript|javascript|python|github|الكود|برمج|برمجة|شفرة/.test(text)) capabilities.push('coding');
  if (/math|equation|calculate|حل|رياضيات|معادلة|حساب/.test(text)) capabilities.push('math');
  if (/reason|analy|architecture|plan|استنتج|حلل|تحليل|خطة|معمارية/.test(text)) capabilities.push('reasoning');
  if (/image|photo|vision|صورة|صور|رؤية/.test(text)) capabilities.push('vision');
  if (/news|today|latest|current|أخبار|اليوم|آخر|جديد/.test(text)) capabilities.push('search');
  if (/arabic|عربي|العربية/.test(text)) capabilities.push('arabic');
  return [...new Set(capabilities)];
}

export function listAvailableModels() {
  return modelRegistry.enabled().map(({ id, provider, displayName, capabilities, contextLength, quality, speed, cost }) => ({ id, provider, displayName, capabilities, contextLength, quality, speed, cost }));
}

export async function runModelSwarm(gateway: ModelGateway, prompt: string, system?: string, maxModels = 3) {
  const capabilities = inferCapabilities(prompt);
  return gateway.complete(
    { prompt, capabilities, maxModels: Math.max(1, Math.min(8, maxModels)), preferSpeed: prompt.length < 120 },
    { prompt, system, temperature: 0.35, maxTokens: 4096 },
  );
}
