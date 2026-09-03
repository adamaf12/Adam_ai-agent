export type Language = 'ar' | 'en';
export type Theme = 'system' | 'light' | 'dark' | 'glass' | 'glass-dark' | 'aurora';
export type ViewId = 'chat' | 'tasks' | 'memory' | 'workspace' | 'settings';
export type MessageRole = 'user' | 'assistant' | 'system';
export type TaskPriority = 'low' | 'medium' | 'high';
export type MemoryCategory = 'preference' | 'fact' | 'goal' | 'instruction';

export interface Message { id: string; role: MessageRole; content: string; createdAt: number; metadata?: Record<string, unknown>; }
export interface AppPreferences { agentName: string; language: Language; theme: Theme; glassEnabled: boolean; onboardingComplete: boolean; }
export interface ChatConversation { id: string; title: string; messages: Message[]; updatedAt: number; }
export interface Task { id: string; title: string; notes: string; completed: boolean; priority: TaskPriority; dueAt?: number; createdAt: number; updatedAt: number; }
export interface Memory { id: string; content: string; category: MemoryCategory; createdAt: number; updatedAt: number; }

const ROLES: MessageRole[] = ['user', 'assistant', 'system'];
function messageId(): string { if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID(); return `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`; }
export function isMessage(value: unknown): value is Message { if (!value || typeof value !== 'object') return false; const candidate = value as Partial<Message>; return typeof candidate.id === 'string' && candidate.id.length > 0 && ROLES.includes(candidate.role as MessageRole) && typeof candidate.content === 'string' && typeof candidate.createdAt === 'number' && Number.isFinite(candidate.createdAt); }
export function normalizeMessage(input: Partial<Message>): Message { const role = ROLES.includes(input.role as MessageRole) ? input.role as MessageRole : 'user'; const content = typeof input.content === 'string' ? input.content.trim() : ''; if (!content) throw new Error('Message content cannot be empty.'); const createdAt = typeof input.createdAt === 'number' && Number.isFinite(input.createdAt) ? input.createdAt : Date.now(); const id = typeof input.id === 'string' && input.id.trim() ? input.id.trim() : messageId(); const message: Message = { id, role, content, createdAt }; if (input.metadata && typeof input.metadata === 'object') message.metadata = { ...input.metadata }; return message; }
