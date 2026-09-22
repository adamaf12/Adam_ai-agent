import { backgroundTaskQueue } from '../../../server/security/taskQueue';
import { BetterMemoryEngine } from '../../../server/security/betterMemory';

export const AGENT_ACTION_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'create_task',
        description: 'Creates a real background task in Adam AI. Use only when the user explicitly asks to create, remember, or schedule a task.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            description: { type: 'STRING' },
            priority: { type: 'STRING', enum: ['high', 'medium', 'low'] },
            system_target: { type: 'STRING', enum: ['linux', 'android', 'macos', 'windows', 'universal'] },
          },
          required: ['title'],
        },
      },
      {
        name: 'query_memory',
        description: 'Searches the user isolated persistent memory and returns matching memories.',
        parameters: {
          type: 'OBJECT',
          properties: {
            search_term: { type: 'STRING' },
            date_range: { type: 'STRING' },
            platform_filter: { type: 'STRING' },
          },
          required: ['search_term'],
        },
      },
      {
        name: 'save_memory',
        description: 'Stores a user-approved fact, preference, workflow, or profile item in persistent isolated memory.',
        parameters: {
          type: 'OBJECT',
          properties: {
            category: { type: 'STRING', enum: ['preference', 'profile', 'fact', 'workflow'] },
            text: { type: 'STRING' },
            confidence: { type: 'NUMBER' },
          },
          required: ['category', 'text'],
        },
      },
    ],
  },
];

export async function executeAgentActionTool(
  name: string,
  args: Record<string, unknown>,
  userId: string,
): Promise<Record<string, unknown>> {
  if (!userId) {
    return { ok: false, error: 'AUTH_REQUIRED', message: 'A user identity is required for this tool.' };
  }

  if (name === 'create_task') {
    const title = String(args.title ?? '').trim();
    if (!title) return { ok: false, error: 'INVALID_ARGUMENT', message: 'Task title is required.' };

    const description = String(args.description ?? '').trim();
    const priority = String(args.priority ?? 'medium');
    const systemTarget = String(args.system_target ?? 'universal');
    const task = backgroundTaskQueue.enqueue(userId, title, async (updateProgress) => {
      updateProgress(100);
      return { description, priority, systemTarget };
    });

    return {
      ok: true,
      executed: true,
      tool: name,
      taskId: task.id,
      status: task.status,
      result: { title, description, priority, systemTarget },
    };
  }

  if (name === 'query_memory') {
    const searchTerm = String(args.search_term ?? '').trim();
    if (!searchTerm) return { ok: false, error: 'INVALID_ARGUMENT', message: 'search_term is required.' };
    const memories = BetterMemoryEngine.queryRelevantMemories(userId, searchTerm, 8);
    return {
      ok: true,
      executed: true,
      tool: name,
      count: memories.length,
      memories: memories.map(memory => ({
        id: memory.id,
        category: memory.category,
        text: memory.text,
        confidence: memory.confidence,
      })),
    };
  }

  if (name === 'save_memory') {
    const text = String(args.text ?? '').trim();
    const category = String(args.category ?? 'fact') as 'preference' | 'profile' | 'fact' | 'workflow';
    if (!text) return { ok: false, error: 'INVALID_ARGUMENT', message: 'text is required.' };
    if (!['preference', 'profile', 'fact', 'workflow'].includes(category)) {
      return { ok: false, error: 'INVALID_ARGUMENT', message: 'Invalid memory category.' };
    }
    const confidenceRaw = Number(args.confidence ?? 0.9);
    const confidence = Number.isFinite(confidenceRaw) ? Math.min(1, Math.max(0, confidenceRaw)) : 0.9;
    const memory = BetterMemoryEngine.addMemory(userId, category, text, confidence);
    return {
      ok: true,
      executed: true,
      tool: name,
      memoryId: memory.id,
      result: { category: memory.category, text: memory.text, confidence: memory.confidence },
    };
  }

  return { ok: false, error: 'UNKNOWN_TOOL', message: `Tool '${name}' is not available.` };
}
