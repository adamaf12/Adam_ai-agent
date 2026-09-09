import { auditLogger } from './auditLog';

export interface UserBudget {
  userId: string;
  dailyTokenLimit: number;
  tokensUsedToday: number;
  imageGenerationsToday: number;
  maxDailyImages: number;
  estimatedCostUsd: number;
  maxDailyCostUsd: number;
  lastResetTime: number;
}

class CostControlManager {
  private userBudgets = new Map<string, UserBudget>();
  private readonly DEFAULT_TOKEN_LIMIT = 150_000;
  private readonly DEFAULT_IMAGE_LIMIT = 30;
  private readonly DEFAULT_MAX_COST_USD = 3.0; // $3/day

  private getOrCreate(userId: string): UserBudget {
    const now = Date.now();
    let budget = this.userBudgets.get(userId);

    // Reset every 24 hours
    if (!budget || now - budget.lastResetTime > 24 * 60 * 60 * 1000) {
      budget = {
        userId,
        dailyTokenLimit: this.DEFAULT_TOKEN_LIMIT,
        tokensUsedToday: 0,
        imageGenerationsToday: 0,
        maxDailyImages: this.DEFAULT_IMAGE_LIMIT,
        estimatedCostUsd: 0,
        maxDailyCostUsd: this.DEFAULT_MAX_COST_USD,
        lastResetTime: now,
      };
      this.userBudgets.set(userId, budget);
    }
    return budget;
  }

  /**
   * Pre-check if user has remaining budget before calling expensive AI operations
   */
  public checkBudget(userId: string, isImage = false): { allowed: boolean; remainingTokens: number; remainingImages: number; reason?: string } {
    if (userId?.includes('maamarfeidat') || userId === 'admin' || userId?.startsWith('dev_')) {
      return {
        allowed: true,
        remainingTokens: 999_999_999,
        remainingImages: 999_999,
      };
    }
    const budget = this.getOrCreate(userId);

    if (isImage && budget.imageGenerationsToday >= budget.maxDailyImages) {
      return {
        allowed: false,
        remainingTokens: Math.max(0, budget.dailyTokenLimit - budget.tokensUsedToday),
        remainingImages: 0,
        reason: `Daily image generation quota reached (${budget.maxDailyImages}/${budget.maxDailyImages}). Resets in 24 hours.`,
      };
    }

    if (budget.tokensUsedToday >= budget.dailyTokenLimit || budget.estimatedCostUsd >= budget.maxDailyCostUsd) {
      return {
        allowed: false,
        remainingTokens: 0,
        remainingImages: Math.max(0, budget.maxDailyImages - budget.imageGenerationsToday),
        reason: `Daily AI usage limit reached. Resets in 24 hours.`,
      };
    }

    return {
      allowed: true,
      remainingTokens: budget.dailyTokenLimit - budget.tokensUsedToday,
      remainingImages: budget.maxDailyImages - budget.imageGenerationsToday,
    };
  }

  /**
   * Record tokens and media consumed by a user
   */
  public recordUsage(userId: string, tokens: number, isImage = false) {
    const budget = this.getOrCreate(userId);
    budget.tokensUsedToday += Math.max(0, tokens);

    if (isImage) {
      budget.imageGenerationsToday += 1;
      budget.estimatedCostUsd += 0.04; // ~$0.04 per Flux/Pollinations image
    }

    // Rough Gemini flash cost: ~$0.10 per 1M tokens
    budget.estimatedCostUsd += (tokens / 1_000_000) * 0.15;

    // Log alert if nearing threshold
    const percent = (budget.tokensUsedToday / budget.dailyTokenLimit) * 100;
    if (percent >= 80 && percent < 90) {
      auditLogger.log({
        userId,
        ip: '0.0.0.0',
        action: 'COST_BUDGET_WARNING',
        resource: 'ai:tokens',
        outcome: 'WARNING',
        riskScore: 25,
        metadata: { tokensUsed: budget.tokensUsedToday, percent: Math.round(percent) },
      });
    }
  }

  public getBudgetStatus(userId: string) {
    const budget = this.getOrCreate(userId);
    return {
      ...budget,
      tokensRemaining: Math.max(0, budget.dailyTokenLimit - budget.tokensUsedToday),
      imagesRemaining: Math.max(0, budget.maxDailyImages - budget.imageGenerationsToday),
      percentageUsed: Math.min(100, Math.round((budget.tokensUsedToday / budget.dailyTokenLimit) * 100)),
    };
  }
}

export const costControlManager = new CostControlManager();
