export interface ToolSchema {
  required?: string[];
  properties?: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>;
  allowUnknown?: boolean;
}

export type ToolValidationResult = { ok: true } | { ok: false; reason: string };

export function validateToolInput(input: unknown, schema: ToolSchema): ToolValidationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, reason: 'Tool input must be an object.' };
  const value = input as Record<string, unknown>;
  for (const key of schema.required ?? []) {
    if (!(key in value) || value[key] === undefined || value[key] === null || value[key] === '') {
      return { ok: false, reason: `Missing required field: ${key}` };
    }
  }
  for (const [key, expected] of Object.entries(schema.properties ?? {})) {
    if (!(key in value) || value[key] === undefined) continue;
    const actual = Array.isArray(value[key]) ? 'array' : typeof value[key];
    if (actual !== expected) return { ok: false, reason: `Invalid type for ${key}: expected ${expected}, got ${actual}.` };
  }
  if (schema.allowUnknown === false) {
    const known = new Set(Object.keys(schema.properties ?? {}));
    const unknown = Object.keys(value).find(key => !known.has(key));
    if (unknown) return { ok: false, reason: `Unknown tool field: ${unknown}` };
  }
  return { ok: true };
}
