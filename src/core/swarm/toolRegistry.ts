export type ToolKind = 'development' | 'design' | 'research' | 'data' | 'observability' | 'automation';
export interface ToolDescriptor { id: string; name: string; kind: ToolKind; capabilities: readonly string[]; enabled: boolean; }
export class ToolRegistry {
  private readonly tools = new Map<string, ToolDescriptor>();
  register(tool: ToolDescriptor): void { this.tools.set(tool.id, tool); }
  registerMany(tools: readonly ToolDescriptor[]): void { tools.forEach((tool) => this.register(tool)); }
  get(id: string): ToolDescriptor | undefined { return this.tools.get(id); }
  all(): ToolDescriptor[] { return [...this.tools.values()]; }
  enabled(): ToolDescriptor[] { return this.all().filter((tool) => tool.enabled); }
  matching(capability: string): ToolDescriptor[] { return this.enabled().filter((tool) => tool.capabilities.includes(capability)); }
}
export const toolRegistry = new ToolRegistry();
toolRegistry.registerMany([
  { id: 'github', name: 'GitHub', kind: 'development', capabilities: ['code', 'repository', 'ci', 'issues'], enabled: true },
  { id: 'figma', name: 'Figma', kind: 'design', capabilities: ['design', 'ui', 'prototype'], enabled: true },
  { id: 'lovable', name: 'Lovable', kind: 'development', capabilities: ['ui', 'prototype', 'frontend'], enabled: true },
  { id: 'vercel', name: 'Vercel', kind: 'development', capabilities: ['deploy', 'preview', 'frontend'], enabled: true },
  { id: 'supabase', name: 'Supabase', kind: 'data', capabilities: ['database', 'auth', 'storage'], enabled: true },
  { id: 'sentry', name: 'Sentry', kind: 'observability', capabilities: ['errors', 'monitoring', 'debugging'], enabled: true },
  { id: 'posthog', name: 'PostHog', kind: 'observability', capabilities: ['analytics', 'product'], enabled: true },
]);
