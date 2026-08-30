import type { ModelGateway, GenerateRequest } from './gateway';
import type { SwarmResult } from './types';

export async function generateWithFallback(gateway: ModelGateway, requests: readonly GenerateRequest[]): Promise<SwarmResult> {
  let lastError: unknown;
  for (const request of requests) {
    try { return await gateway.generate(request); }
    catch (error) { lastError = error; }
  }
  throw new Error(`All model providers failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}
