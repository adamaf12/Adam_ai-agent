import { AGENT_ACTION_TOOLS, executeAgentActionTool } from '../src/core/agent/toolExecution';
import { AgentPermissionGuard } from './security/agentPermissions';

type GatewayMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: any;
  tool_call_id?: string;
  tool_calls?: any[];
};

type StreamGatewayChatArgs = {
  req: any;
  messages: any[];
  systemInstruction: string;
  model: string;
  temperature: number;
  topP: number;
  maxOutputTokens: number;
  userId: string;
  user: any;
  onText?: (text: string) => void;
  maxToolRounds?: number;
};

const GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/chat/completions';

function getAuthToken(req: any): string {
  const oidc = req?.headers?.['x-vercel-oidc-token'];
  if (typeof oidc === 'string' && oidc.trim()) return oidc.trim();

  const gatewayKey = process.env.AI_GATEWAY_API_KEY?.trim();
  if (gatewayKey) return gatewayKey;

  return '';
}

export function isGatewayConfigured(req?: any): boolean {
  return Boolean(getAuthToken(req));
}

function toOpenAIContent(parts: any[]): any {
  const content: any[] = [];

  for (const part of Array.isArray(parts) ? parts : []) {
    if (typeof part?.text === 'string' && part.text) {
      content.push({ type: 'text', text: part.text });
    }

    if (part?.inlineData?.data && part?.inlineData?.mimeType) {
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
        },
      });
    }
  }

  return content.length === 1 && content[0].type === 'text' ? content[0].text : content;
}

function normalizeMessages(messages: any[], systemInstruction: string): GatewayMessage[] {
  const normalized: GatewayMessage[] = [
    { role: 'system', content: systemInstruction },
  ];

  for (const message of messages) {
    const role = message?.role === 'model' || message?.role === 'assistant' ? 'assistant' : 'user';
    normalized.push({
      role,
      content: toOpenAIContent(message?.parts || []),
    });
  }

  return normalized;
}

function openAITools() {
  const declarations = AGENT_ACTION_TOOLS.flatMap((group: any) => group?.functionDeclarations || []);

  return declarations.map((fn: any) => ({
    type: 'function',
    function: {
      name: fn.name,
      description: fn.description,
      parameters: fn.parameters,
    },
  }));
}

function safeJsonParse(input: string): any {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

async function readGatewayStream(response: Response, onText?: (text: string) => void) {
  if (!response.body) throw new Error('AI Gateway returned an empty stream.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let output = '';
  const toolCalls = new Map<number, { id: string; name: string; arguments: string }>();

  const consumeLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(':')) return;
    if (!trimmed.startsWith('data:')) return;

    const payload = trimmed.slice(5).trim();
    if (payload === '[DONE]') return;

    const parsed = safeJsonParse(payload);
    if (!parsed) return;

    const choices = Array.isArray(parsed.choices) ? parsed.choices : [];
    for (const choice of choices) {
      const delta = choice?.delta || {};

      if (typeof delta.content === 'string' && delta.content) {
        output += delta.content;
        onText?.(delta.content);
      }

      const deltas = Array.isArray(delta.tool_calls) ? delta.tool_calls : [];
      for (const call of deltas) {
        const index = Number(call.index ?? 0);
        const current = toolCalls.get(index) || {
          id: '',
          name: '',
          arguments: '',
        };

        if (call.id) current.id = String(call.id);
        if (call.function?.name) current.name += String(call.function.name);
        if (call.function?.arguments) current.arguments += String(call.function.arguments);

        toolCalls.set(index, current);
      }
    }
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';

      for (const line of lines) consumeLine(line);
    }

    buffer += decoder.decode();
    if (buffer) consumeLine(buffer);
  } finally {
    try { reader.releaseLock(); } catch {}
  }

  return {
    text: output,
    toolCalls: Array.from(toolCalls.values()).filter((call) => call.id && call.name),
  };
}

async function executeToolCalls(toolCalls: Array<{ id: string; name: string; arguments: string }>, user: any, userId: string) {
  const results: GatewayMessage[] = [];

  for (const call of toolCalls) {
    const args = safeJsonParse(call.arguments) || {};
    const permission = AgentPermissionGuard.canExecuteTool(call.name, user);

    let result: Record<string, unknown>;
    if (!permission.allowed) {
      result = {
        ok: false,
        error: 'PERMISSION_DENIED',
        message: permission.reason || 'Tool execution denied.',
      };
    } else {
      try {
        result = await executeAgentActionTool(call.name, args, userId);
      } catch (error: any) {
        result = {
          ok: false,
          error: 'TOOL_EXECUTION_FAILED',
          message: String(error?.message || error),
        };
      }
    }

    results.push({
      role: 'tool',
      tool_call_id: call.id,
      content: JSON.stringify(result),
    });
  }

  return results;
}

async function callGateway(
  token: string,
  model: string,
  messages: GatewayMessage[],
  temperature: number,
  topP: number,
  maxOutputTokens: number,
) {
  const gatewayModel = model.includes('/') ? model : `google/${model}`;

  const body: any = {
    model: gatewayModel,
    messages,
    temperature,
    top_p: topP,
    max_tokens: Math.min(Math.max(Number(maxOutputTokens) || 4096, 256), 65536),
    stream: true,
    stream_options: { include_usage: true },
    tools: openAITools(),
    tool_choice: 'auto',
  };

  const response = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    const error = new Error(`AI Gateway ${response.status}: ${errorText.slice(0, 1200)}`);
    (error as any).status = response.status;
    throw error;
  }

  return response;
}

export async function streamGatewayChat(args: StreamGatewayChatArgs) {
  const token = getAuthToken(args.req);
  if (!token) {
    const error = new Error('AI Gateway authentication is not configured.');
    (error as any).status = 503;
    throw error;
  }

  let conversation = normalizeMessages(args.messages, args.systemInstruction);
  let combinedText = '';
  const maxRounds = Math.max(0, Math.min(args.maxToolRounds ?? 3, 5));

  for (let round = 0; round <= maxRounds; round += 1) {
    const response = await callGateway(
      token,
      args.model,
      conversation,
      args.temperature,
      args.topP,
      args.maxOutputTokens,
    );

    const streamed = await readGatewayStream(response, (text) => {
      combinedText += text;
      args.onText?.(text);
    });

    const toolCalls = streamed.toolCalls;
    if (!toolCalls.length || round >= maxRounds) {
      return combinedText;
    }

    const assistantToolCalls = toolCalls.map((call) => ({
      id: call.id,
      type: 'function',
      function: {
        name: call.name,
        arguments: call.arguments || '{}',
      },
    }));

    conversation.push({
      role: 'assistant',
      content: streamed.text || null,
      tool_calls: assistantToolCalls,
    });

    const toolResults = await executeToolCalls(toolCalls, args.user, args.userId);
    conversation.push(...toolResults);
  }

  return combinedText;
}
