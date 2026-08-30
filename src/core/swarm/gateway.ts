import type { ModelProfile, SwarmResult } from './types';

export interface GenerateRequest { model: ModelProfile; system?: string; prompt: string; signal?: AbortSignal; }
export interface ModelGateway { generate(request: GenerateRequest): Promise<SwarmResult>; stream?(request: GenerateRequest, onToken: (token: string) => void): Promise<void>; }

export class UnconfiguredGateway implements ModelGateway {
  async generate(request: GenerateRequest): Promise<SwarmResult> {
    throw new Error(`No provider adapter configured for model ${request.model.id}`);
  }
}
