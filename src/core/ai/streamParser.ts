export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; code: string; message: string };

export interface ParsedStream {
  events: StreamEvent[];
  remainder: string;
}

function parseEvent(line: string): StreamEvent | null {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    throw new Error('INVALID_STREAM_JSON');
  }

  if (!value || typeof value !== 'object' || !('type' in value)) return null;
  const event = value as Record<string, unknown>;

  if (event.type === 'delta') {
    return { type: 'delta', text: typeof event.text === 'string' ? event.text : '' };
  }
  if (event.type === 'done') {
    return { type: 'done' };
  }
  if (event.type === 'error') {
    return {
      type: 'error',
      code: typeof event.code === 'string' ? event.code : 'AI_ERROR',
      message: typeof event.message === 'string' ? event.message : 'Unknown AI error',
    };
  }
  return null;
}

export function parseStreamLines(input: string): ParsedStream {
  const lines = input.split('\n');
  const tail = lines.pop() ?? '';
  const events: StreamEvent[] = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '').trim();
    if (!line) continue;
    try {
      const evt = parseEvent(line);
      if (evt) events.push(evt);
    } catch (e) {
      if (e instanceof Error && e.message === 'INVALID_STREAM_JSON') {
        // Skip malformed unparseable line
        continue;
      }
    }
  }

  const normalizedTail = tail.replace(/\r$/, '').trim();
  if (!normalizedTail) return { events, remainder: '' };

  try {
    const evt = parseEvent(normalizedTail);
    if (evt) {
      return { events: [...events, evt], remainder: '' };
    }
    return { events, remainder: '' };
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_STREAM_JSON') {
      return { events, remainder: tail };
    }
    return { events, remainder: '' };
  }
}
