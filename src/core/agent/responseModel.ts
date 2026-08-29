export type ResponseRoute = 'chat' | 'web' | 'task' | 'memory' | 'creative';
export type ResponseStatus = 'thinking' | 'streaming' | 'complete' | 'error';
export type ResponseError = { code: string; message: string };
export type ResponseEvent =
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; code: string; message: string };

export type ResponseState = {
  status: ResponseStatus;
  route: ResponseRoute;
  content: string;
  error: ResponseError | null;
};

export function createResponseState(route: ResponseRoute): ResponseState {
  return { status: 'thinking', route, content: '', error: null };
}

export function reduceResponseEvent(state: ResponseState, event: ResponseEvent): ResponseState {
  if (state.status === 'complete' || state.status === 'error') return state;
  if (event.type === 'delta') {
    const text = typeof event.text === 'string' ? event.text : '';
    return text ? { ...state, status: 'streaming', content: state.content + text, error: null } : state;
  }
  if (event.type === 'done') return { ...state, status: 'complete' };
  return { ...state, status: 'error', error: { code: event.code, message: event.message } };
}
