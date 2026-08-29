const DEFAULT_TTL_MS = 5 * 60_000;

export class RequestDeduplicator {
  private readonly active = new Map<string, number>();

  constructor(private readonly ttlMs = DEFAULT_TTL_MS) {}

  private prune(now = Date.now()): void {
    for (const [id, startedAt] of this.active) {
      if (now - startedAt >= this.ttlMs) this.active.delete(id);
    }
  }

  begin(requestId: string, now = Date.now()): boolean {
    const id = requestId.trim();
    if (!id) return false;
    this.prune(now);
    if (this.active.has(id)) return false;
    this.active.set(id, now);
    return true;
  }

  finish(requestId: string): void {
    this.active.delete(requestId.trim());
  }

  has(requestId: string, now = Date.now()): boolean {
    this.prune(now);
    return this.active.has(requestId.trim());
  }

  size(): number {
    this.prune();
    return this.active.size;
  }
}

export const requestDeduplicator = new RequestDeduplicator();
