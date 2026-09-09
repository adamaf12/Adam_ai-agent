import fs from 'node:fs';
import path from 'node:path';
import { safePathResolve } from './networkShield';

/**
 * Multi-Tenant Database & Storage Isolation Layer
 * Guarantees strict boundary enforcement so User A cannot access User B's records.
 */
class DatabaseIsolation {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), '.tenants_data');
    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true, mode: 0o700 });
      }
    } catch {
      // Ignored if file system is read-only
    }
  }

  /**
   * Generates a safe, sanitized tenant storage directory
   */
  private getTenantDir(userId: string): string {
    const cleanId = (userId || 'guest_default').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
    const tenantDir = safePathResolve(this.baseDir, cleanId);
    try {
      if (!fs.existsSync(tenantDir)) {
        fs.mkdirSync(tenantDir, { recursive: true, mode: 0o700 });
      }
    } catch {
      // Ignore
    }
    return tenantDir;
  }

  /**
   * Scoped file path for tenant collection
   */
  public getScopedFilePath(userId: string, collectionName: string): string {
    const tenantDir = this.getTenantDir(userId);
    const cleanColl = collectionName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
    return path.join(tenantDir, `${cleanColl}.json`);
  }

  /**
   * Load isolated data for a specific user
   */
  public loadUserData<T>(userId: string, collectionName: string, fallback: T): T {
    try {
      const file = this.getScopedFilePath(userId, collectionName);
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf8');
        return JSON.parse(raw) as T;
      }
    } catch (err) {
      console.warn(`[DB Isolation] Error loading user data for ${userId}:${collectionName}`, err);
    }
    return fallback;
  }

  /**
   * Save isolated data for a specific user
   */
  public saveUserData<T>(userId: string, collectionName: string, data: T): boolean {
    try {
      const file = this.getScopedFilePath(userId, collectionName);
      fs.writeFileSync(file, JSON.stringify(data, null, 2), { encoding: 'utf8', mode: 0o600 });
      return true;
    } catch (err) {
      console.warn(`[DB Isolation] Error saving user data for ${userId}:${collectionName}`, err);
      return false;
    }
  }

  /**
   * Verify that an item belongs to the requesting user before mutation/deletion
   */
  public verifyOwnership(itemOwnerId: string, requestingUserId: string, isAdmin = false): boolean {
    if (isAdmin) return true;
    if (!itemOwnerId || !requestingUserId) return false;
    return itemOwnerId === requestingUserId;
  }
}

export const dbIsolation = new DatabaseIsolation();
