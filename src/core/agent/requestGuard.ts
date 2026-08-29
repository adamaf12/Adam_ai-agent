const MAX_PROMPT_CHARS = 12_000;

export function sanitizePrompt(input: string): string {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, MAX_PROMPT_CHARS);
}

export function hasUsablePrompt(input: string): boolean {
  return sanitizePrompt(input).length > 0;
}
