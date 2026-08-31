import type { Language, Message } from '../domain';

export interface ChatRequest {
  messages: Message[];
  language: Language;
  agentName: string;
  maxModels?: number;
}

export interface ChatClient {
  send(request: ChatRequest, signal: AbortSignal, onDelta: (text: string) => void): Promise<Message>;
}

export class ChatError extends Error {
  constructor(public code: string, message: string, public status?: number) {
    super(message);
    this.name = 'ChatError';
  }
}
