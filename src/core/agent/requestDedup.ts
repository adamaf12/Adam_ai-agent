export class RequestDeduplicator {
  private readonly active = new Set<string>();

  begin(requestId: string): boolean {
    const id = requestId.trim();
    if (!id || this.active.has(id)) return false;
    this.active.add(id);
    return true;
  }

  finish(requestId: string): void {
    this.active.delete(requestId.trim());
  }

  has(requestId: string): boolean {
    return this.active.has(requestId.trim());
  }
}

export const requestDeduplicator = new RequestDeduplicator();
