/**
 * Quota & Time Limits Management Engine for AI Models
 * 
 * Rules:
 * 1. App Creator / Owner: maamarfeidat@gmail.com (السيد أدم فيدات) -> 100% UNRESTRICTED & UNLIMITED (No limits).
 * 2. Top 3 Frontier Models: 5 minutes per model per day for regular users.
 * 3. All Other Models: Combined shared pool of 3 hours per day for regular users.
 * 4. Quotas reset automatically at midnight every day.
 */

export const CREATOR_EMAIL = 'maamarfeidat@gmail.com';
export const CREATOR_NAME = 'السيد أدم فيدات';

export const TOP_3_FRONTIER_MODELS = [
  'gemini-3.7-pro',
  'meta/llama-3.1-405b-instruct',
  'nvidia/llama-3.1-nemotron-70b-instruct',
] as const;

export const TOP_MODEL_DAILY_LIMIT_SECONDS = 5 * 60; // 5 minutes = 300 seconds
export const OTHER_MODELS_POOL_DAILY_LIMIT_SECONDS = 3 * 60 * 60; // 3 hours = 10,800 seconds

const QUOTA_STORAGE_KEY_PREFIX = 'adam_daily_model_quota_';

export interface DailyModelQuotaData {
  date: string; // YYYY-MM-DD
  topModelUsage: Record<string, number>; // modelId -> seconds used
  otherModelsUsageSeconds: number; // total seconds used across all other models
  lastUpdated: string;
}

export interface ModelQuotaInfo {
  modelId: string;
  displayName: string;
  isCreator: boolean;
  isTopTier: boolean;
  limitSeconds: number;
  usedSeconds: number;
  remainingSeconds: number;
  percentageUsed: number;
  isDepleted: boolean;
  formattedLimit: string;
  formattedRemaining: string;
}

export interface GlobalQuotaSummary {
  isCreator: boolean;
  isVip: boolean;
  userRoleTier: 'creator' | 'vip' | 'regular';
  userEmail: string | null;
  creatorName: string;
  currentDate: string;
  resetTimeFormatted: string;
  topModels: ModelQuotaInfo[];
  otherModelsPool: {
    limitSeconds: number;
    usedSeconds: number;
    remainingSeconds: number;
    percentageUsed: number;
    isDepleted: boolean;
    formattedLimit: string;
    formattedRemaining: string;
  };
}

export type UserRoleTier = 'creator' | 'vip' | 'regular';

/**
 * Checks if a given email is the App Creator (السيد أدم فيدات)
 */
export function isAppCreator(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === CREATOR_EMAIL.toLowerCase();
}

/**
 * Checks if the user has VIP status
 */
export function isVipUser(email?: string | null): boolean {
  if (isAppCreator(email)) return true;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('adam_user_vip_status');
      if (stored === 'true') return true;
    } catch (_) {}
  }
  return false;
}

/**
 * Gets user role tier: 'creator' | 'vip' | 'regular'
 */
export function getUserRoleTier(email?: string | null): UserRoleTier {
  if (isAppCreator(email)) return 'creator';
  if (isVipUser(email)) return 'vip';
  return 'regular';
}

/**
 * Sets VIP membership status locally
 */
export function setVipMemberStatus(isVip: boolean): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('adam_user_vip_status', isVip ? 'true' : 'false');
    } catch (_) {}
  }
}

/**
 * Shields and masks email addresses to protect user privacy
 */
export function maskEmailAddress(email?: string | null): string {
  if (!email || typeof email !== 'string') return '';
  const trimmed = email.trim();
  const parts = trimmed.split('@');
  if (parts.length !== 2) return '***';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) return `${name[0]}*@${domain}`;
  return `${name.slice(0, 2)}${'*'.repeat(Math.min(5, name.length - 2))}@${domain}`;
}

/**
 * Gets today's date string (YYYY-MM-DD)
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes model identifiers to match standard keys
 */
export function normalizeModelId(modelId: string): string {
  const lower = (modelId || '').trim().toLowerCase();
  if (lower.includes('3.7-pro') || lower === 'gemini-3.7-pro') return 'gemini-3.7-pro';
  if (lower.includes('405b')) return 'meta/llama-3.1-405b-instruct';
  if (lower.includes('nemotron')) return 'nvidia/llama-3.1-nemotron-70b-instruct';
  if (lower.includes('llama-3.3-70b')) return 'meta-llama/llama-3.3-70b-instruct';
  return modelId.trim();
}

/**
 * Checks if a model belongs to the Top 3 Frontier Tier
 */
export function isTopTierModel(modelId: string): boolean {
  const norm = normalizeModelId(modelId);
  return TOP_3_FRONTIER_MODELS.includes(norm as any);
}

/**
 * Loads current daily quota data from localStorage
 */
export function loadDailyQuotaData(userPartitionKey?: string | null): DailyModelQuotaData {
  const today = getTodayDateString();
  const storageKey = `${QUOTA_STORAGE_KEY_PREFIX}${today}${userPartitionKey ? `_${userPartitionKey}` : ''}`;

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        return {
          date: today,
          topModelUsage: parsed.topModelUsage || {},
          otherModelsUsageSeconds: parsed.otherModelsUsageSeconds || 0,
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
      }
    }
  } catch (e) {
    console.error('[QuotaManager] Error reading quota storage:', e);
  }

  return {
    date: today,
    topModelUsage: {},
    otherModelsUsageSeconds: 0,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Saves daily quota data to localStorage
 */
export function saveDailyQuotaData(data: DailyModelQuotaData, userPartitionKey?: string | null): void {
  const today = getTodayDateString();
  const storageKey = `${QUOTA_STORAGE_KEY_PREFIX}${today}${userPartitionKey ? `_${userPartitionKey}` : ''}`;

  try {
    data.date = today;
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (e) {
    console.error('[QuotaManager] Error saving quota storage:', e);
  }
}

/**
 * Formats seconds into human-readable Arabic/English strings
 */
export function formatSecondsToTime(seconds: number, isArabic: boolean = true): string {
  if (seconds === Infinity) {
    return isArabic ? 'غير محدود ♾️' : 'Unlimited ♾️';
  }
  if (seconds <= 0) {
    return isArabic ? '0 دقيقة (منتهية)' : '0 min (depleted)';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    if (isArabic) {
      return `${hours} س و ${minutes} د`;
    }
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    if (isArabic) {
      return `${minutes} د و ${secs} ث`;
    }
    return `${minutes}m ${secs}s`;
  }

  return isArabic ? `${secs} ثانية` : `${secs}s`;
}

/**
 * Gets Friendly Display Name for models
 */
export function getModelDisplayName(modelId: string, isArabic: boolean = true): string {
  const norm = normalizeModelId(modelId);
  switch (norm) {
    case 'gemini-3.7-pro':
      return isArabic ? 'جيميني 3.7 برو (Gemini 3.7 Pro الاستدلال العميق)' : 'Gemini 3.7 Pro (Deep Reasoning)';
    case 'meta/llama-3.1-405b-instruct':
      return isArabic ? 'ميتا لاما 405B الخارق (Meta Llama 3.1 405B)' : 'Meta Llama 3.1 405B (Frontier)';
    case 'nvidia/llama-3.1-nemotron-70b-instruct':
      return isArabic ? 'نيفيديا نيموترون 70B (NVIDIA Nemotron 70B)' : 'NVIDIA Nemotron 70B (Reasoning)';
    case 'gemini-3.7-flash':
      return isArabic ? 'جيميني 3.7 فلاش الفائق (Gemini 3.7 Flash)' : 'Gemini 3.7 Flash';
    case 'meta-llama/llama-3.3-70b-instruct':
      return isArabic ? 'ميتا لاما 3.3 (70B Instruct)' : 'Meta Llama 3.3 (70B)';
    default:
      return modelId;
  }
}

/**
 * Gets Quota Status for a specific model
 */
export function getModelQuotaStatus(
  modelId: string,
  userEmail?: string | null,
  isArabic: boolean = true,
  userPartitionKey?: string | null
): ModelQuotaInfo {
  const isCreator = isAppCreator(userEmail);
  const norm = normalizeModelId(modelId);
  const isTop = isTopTierModel(norm);
  const displayName = getModelDisplayName(modelId, isArabic);

  if (isCreator) {
    return {
      modelId: norm,
      displayName,
      isCreator: true,
      isTopTier: isTop,
      limitSeconds: Infinity,
      usedSeconds: 0,
      remainingSeconds: Infinity,
      percentageUsed: 0,
      isDepleted: false,
      formattedLimit: isArabic ? 'غير محدود (صانع التطبيق)' : 'Unlimited (Creator VIP)',
      formattedRemaining: isArabic ? 'غير محدود ♾️' : 'Unlimited ♾️',
    };
  }

  const quotaData = loadDailyQuotaData(userPartitionKey);

  if (isTop) {
    const limit = TOP_MODEL_DAILY_LIMIT_SECONDS;
    const used = quotaData.topModelUsage[norm] || 0;
    const remaining = Math.max(0, limit - used);
    const percentage = Math.min(100, Math.round((used / limit) * 100));

    return {
      modelId: norm,
      displayName,
      isCreator: false,
      isTopTier: true,
      limitSeconds: limit,
      usedSeconds: used,
      remainingSeconds: remaining,
      percentageUsed: percentage,
      isDepleted: remaining <= 0,
      formattedLimit: isArabic ? '5 دقائق / يوم' : '5 min / day',
      formattedRemaining: formatSecondsToTime(remaining, isArabic),
    };
  } else {
    const limit = OTHER_MODELS_POOL_DAILY_LIMIT_SECONDS;
    const used = quotaData.otherModelsUsageSeconds || 0;
    const remaining = Math.max(0, limit - used);
    const percentage = Math.min(100, Math.round((used / limit) * 100));

    return {
      modelId: norm,
      displayName,
      isCreator: false,
      isTopTier: false,
      limitSeconds: limit,
      usedSeconds: used,
      remainingSeconds: remaining,
      percentageUsed: percentage,
      isDepleted: remaining <= 0,
      formattedLimit: isArabic ? '3 ساعات / يوم (مجمعة)' : '3 hours / day (Pooled)',
      formattedRemaining: formatSecondsToTime(remaining, isArabic),
    };
  }
}

/**
 * Records model usage duration (in seconds)
 */
export function recordModelUsageDuration(
  modelId: string,
  durationSeconds: number,
  userEmail?: string | null,
  userPartitionKey?: string | null
): void {
  // If creator, no quota tracking needed
  if (isAppCreator(userEmail)) return;

  const validDuration = Math.max(1, Math.min(300, durationSeconds || 1));
  const norm = normalizeModelId(modelId);
  const isTop = isTopTierModel(norm);
  const quotaData = loadDailyQuotaData(userPartitionKey);

  if (isTop) {
    const current = quotaData.topModelUsage[norm] || 0;
    quotaData.topModelUsage[norm] = current + validDuration;
  } else {
    quotaData.otherModelsUsageSeconds = (quotaData.otherModelsUsageSeconds || 0) + validDuration;
  }

  saveDailyQuotaData(quotaData, userPartitionKey);
}

/**
 * Returns a comprehensive summary of all quotas
 */
export function getAllQuotasSummary(
  userEmail?: string | null,
  isArabic: boolean = true,
  userPartitionKey?: string | null
): GlobalQuotaSummary {
  const isCreator = isAppCreator(userEmail);
  const isVip = isVipUser(userEmail);
  const userRoleTier = getUserRoleTier(userEmail);
  const today = getTodayDateString();
  const quotaData = loadDailyQuotaData(userPartitionKey);

  const topModelsInfo: ModelQuotaInfo[] = TOP_3_FRONTIER_MODELS.map((modelId) =>
    getModelQuotaStatus(modelId, userEmail, isArabic, userPartitionKey)
  );

  const otherPoolLimit = isCreator ? Infinity : OTHER_MODELS_POOL_DAILY_LIMIT_SECONDS;
  const otherPoolUsed = isCreator ? 0 : (quotaData.otherModelsUsageSeconds || 0);
  const otherPoolRemaining = isCreator ? Infinity : Math.max(0, otherPoolLimit - otherPoolUsed);
  const otherPoolPercentage = isCreator ? 0 : Math.min(100, Math.round((otherPoolUsed / otherPoolLimit) * 100));

  return {
    isCreator,
    isVip,
    userRoleTier,
    userEmail: userEmail || null,
    creatorName: CREATOR_NAME,
    currentDate: today,
    resetTimeFormatted: isArabic ? 'منتصف الليل (12:00 ص)' : 'Midnight (12:00 AM)',
    topModels: topModelsInfo,
    otherModelsPool: {
      limitSeconds: otherPoolLimit,
      usedSeconds: otherPoolUsed,
      remainingSeconds: otherPoolRemaining,
      percentageUsed: otherPoolPercentage,
      isDepleted: !isCreator && otherPoolRemaining <= 0,
      formattedLimit: isCreator ? (isArabic ? 'غير محدود' : 'Unlimited') : (isArabic ? '3 ساعات / يوم (مجمعة)' : '3 hours / day'),
      formattedRemaining: isCreator ? (isArabic ? 'غير محدود ♾️' : 'Unlimited ♾️') : formatSecondsToTime(otherPoolRemaining, isArabic),
    },
  };
}
