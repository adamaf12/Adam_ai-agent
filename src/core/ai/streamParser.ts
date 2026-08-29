export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; code: string; message: string };

export interface ParsedStream {
  events: StreamEvent[];
  remainder: string;
}

function parseEvent(line: string): StreamEvent {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    throw new Error('INVALID_STREAM_JSON');
  }

  if (!value || typeof value !== 'object' || !('type' in value)) throw new Error('INVALID_STREAM_EVENT');
  const event = value as Record<string, unknown>;

  if (event.type === 'delta' && typeof event.text === 'string') return { type: 'delta', text: event.text };
  if (event.type === 'done') return { type: 'done' };
  if (event.type === 'error' && typeof event.code === 'string' && typeof event.message === 'string') {
    return { type: 'error', code: event.code, message: event.message };
  }
  throw new Error('INVALID_STREAM_EVENT');
}

export function parseStreamLines(input: string): ParsedStream {
  const lines = input.split('\n');
  const remainder = lines.pop() ?? '';
  const events = lines
    .map((line) => line.replace(/\r$/, '').trim())
    .filter(Boolean)
    .map(parseEvent);
  return { events, remainder };
}
