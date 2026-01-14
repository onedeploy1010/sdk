/**
 * Usage Tracking Service
 * Tracks AI usage for Personal Assistant and Trading Agent
 */

import { getConfig } from '../config';

// Usage categories (internal)
export type UsageCategory =
  | 'wallet'
  | 'payment'
  | 'exchange_onramper'
  | 'exchange_swap'
  | 'ai_thirdweb'
  | 'ai_trading_engine';

// Display categories (client-facing)
export type DisplayCategory = 'personal_assistant' | 'trading_agent';

export interface UsageRecord {
  userId: string;
  category: UsageCategory;
  action: string;
  requestTokens?: number;
  responseTokens?: number;
  creditsUsed?: number;
  metadata?: Record<string, any>;
}

export interface UsageSummary {
  personal_assistant: {
    requestCount: number;
    totalTokens: number;
    totalCredits: number;
  };
  trading_agent: {
    requestCount: number;
    totalTokens: number;
    totalCredits: number;
  };
}

export interface UsageActivity {
  type: DisplayCategory;
  action: string;
  tokens: number;
  credits: number;
  timestamp: string;
}

export interface UsageResponse {
  summary: UsageSummary;
  dailyBreakdown: Array<{
    date: string;
    personal_assistant: number;
    trading_agent: number;
  }>;
  recentActivity: UsageActivity[];
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

/**
 * Usage Tracking Service
 */
export class UsageService {
  private baseUrl: string;
  private userId: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getConfig().oneEngineUrl || '';
  }

  /**
   * Set the current user ID for tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Record Personal Assistant usage (Thirdweb AI)
   */
  async trackPersonalAssistant(
    action: string,
    tokens?: { request?: number; response?: number },
    credits?: number,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    return this.recordUsage({
      userId: this.userId!,
      category: 'ai_thirdweb',
      action,
      requestTokens: tokens?.request,
      responseTokens: tokens?.response,
      creditsUsed: credits,
      metadata,
    });
  }

  /**
   * Record Trading Agent usage (Engine AI)
   */
  async trackTradingAgent(
    action: string,
    credits?: number,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    return this.recordUsage({
      userId: this.userId!,
      category: 'ai_trading_engine',
      action,
      creditsUsed: credits,
      metadata,
    });
  }

  /**
   * Record wallet operation usage
   */
  async trackWallet(action: string, metadata?: Record<string, any>): Promise<boolean> {
    return this.recordUsage({
      userId: this.userId!,
      category: 'wallet',
      action,
      metadata,
    });
  }

  /**
   * Record payment usage
   */
  async trackPayment(action: string, metadata?: Record<string, any>): Promise<boolean> {
    return this.recordUsage({
      userId: this.userId!,
      category: 'payment',
      action,
      metadata,
    });
  }

  /**
   * Record exchange usage (onramper)
   */
  async trackOnramper(action: string, metadata?: Record<string, any>): Promise<boolean> {
    return this.recordUsage({
      userId: this.userId!,
      category: 'exchange_onramper',
      action,
      metadata,
    });
  }

  /**
   * Record exchange usage (swap)
   */
  async trackSwap(action: string, metadata?: Record<string, any>): Promise<boolean> {
    return this.recordUsage({
      userId: this.userId!,
      category: 'exchange_swap',
      action,
      metadata,
    });
  }

  /**
   * Record any usage
   */
  async recordUsage(record: UsageRecord): Promise<boolean> {
    if (!record.userId) {
      console.warn('[UsageService] No userId set, skipping usage tracking');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/usage/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: record.userId,
          category: record.category,
          action: record.action,
          requestTokens: record.requestTokens || 0,
          responseTokens: record.responseTokens || 0,
          creditsUsed: record.creditsUsed || 0,
          metadata: record.metadata || {},
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('[UsageService] Failed to record usage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[UsageService] Error recording usage:', error);
      return false;
    }
  }

  /**
   * Get AI usage summary for current user
   */
  async getAIUsage(days: number = 30): Promise<UsageResponse | null> {
    if (!this.userId) {
      console.warn('[UsageService] No userId set');
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/usage/user?userId=${this.userId}&days=${days}`
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('[UsageService] Failed to get usage:', error);
        return null;
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('[UsageService] Error getting usage:', error);
      return null;
    }
  }
}

// Singleton instance
let usageServiceInstance: UsageService | null = null;

export function getUsageService(): UsageService {
  if (!usageServiceInstance) {
    usageServiceInstance = new UsageService();
  }
  return usageServiceInstance;
}

export function createUsageService(baseUrl?: string): UsageService {
  return new UsageService(baseUrl);
}
