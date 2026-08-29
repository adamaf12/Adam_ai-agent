export type Language = 'ar' | 'en';
export type Theme = 'light' | 'dark' | 'system';
export type ViewId = 'chat' | 'tasks' | 'memory' | 'workspace' | 'settings';
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
}

export interface AppPreferences {
  agentName: string;
  language: Language;
  theme: Theme;
  onboardingComplete: boolean;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}
