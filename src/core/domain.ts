export type Language = 'ar' | 'en';
export type Theme = 'system' | 'light' | 'dark' | 'glass' | 'glass-dark' | 'aurora';
export type ViewId = 'chat' | 'tasks' | 'memory' | 'workspace' | 'settings';
export type MessageRole = 'user' | 'assistant' | 'system';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Message { id: string; role: MessageRole; content: string; createdAt: number; }
export interface AppPreferences { agentName: string; language: Language; theme: Theme; onboardingComplete: boolean; }
export interface ChatConversation { id: string; title: string; messages: Message[]; updatedAt: number; }
export interface Task { id: string; title: string; notes: string; completed: boolean; priority: TaskPriority; dueAt?: number; createdAt: number; updatedAt: number; }
export interface Memory { id: string; content: string; category: 'preference' | 'fact' | 'goal' | 'instruction'; createdAt: number; updatedAt: number; }
